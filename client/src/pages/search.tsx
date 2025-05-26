import { Layout } from "@/components/layout";
import MapView from "@/components/map-view";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MapPin, Store, Coffee, Hotel, Landmark, PlusCircle, Stethoscope, ShoppingBag, AlertTriangle, X, ExternalLink, Star, Map as MapIcon, Clock } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Define categories
const POI_CATEGORIES = {
  MEDICAL: "medical",
  CAFE: "cafe", 
  RESTAURANT: "restaurant",
  HOTEL: "hotel",
  ATM: "atm",
  SHOPPING: "shopping",
  ATTRACTION: "attraction",
  EMERGENCY: "emergency",
  POI: "poi"
};

// Define interface for POI
interface POI {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  address?: string;
  description?: string;
  distance?: number; // Distance in meters
  rating?: number;
  isOpen?: boolean;
}

interface PlaceDetails {
  name: string;
  address: string;
  rating?: number;
  isOpen?: boolean;
  types?: string[];
  photoUrl?: string;
  url?: string;
  phoneNumber?: string;
  website?: string;
  reviews?: any[];
}

const topCategories = [
  { name: "Medical", icon: Stethoscope, category: POI_CATEGORIES.MEDICAL },
  { name: "Cafes", icon: Coffee, category: POI_CATEGORIES.CAFE },
  { name: "Restaurants", icon: Coffee, category: POI_CATEGORIES.RESTAURANT },
  { name: "Hotels", icon: Hotel, category: POI_CATEGORIES.HOTEL },
  { name: "Shopping", icon: ShoppingBag, category: POI_CATEGORIES.SHOPPING },
];

const gridCategories = [
  { name: "Attractions", icon: Landmark, category: POI_CATEGORIES.ATTRACTION },
  { name: "Emergency", icon: AlertTriangle, category: POI_CATEGORIES.EMERGENCY },
  { name: "Points of Interest", icon: MapPin, category: POI_CATEGORIES.POI },
];

// Use Google Maps JS API for Places Nearby Search
// Add Google Maps Places API fetch function
const fetchNearbyPlaces = async (
  map: any,
  lat: number,
  lng: number,
  category: string, 
  radius: number = 1000
): Promise<POI[]> => {
  return new Promise((resolve, reject) => {
    if (!window.google || !map) return reject("Google Maps not loaded");
    let type = "point_of_interest";
    if (category === POI_CATEGORIES.RESTAURANT) type = "restaurant";
    else if (category === POI_CATEGORIES.CAFE) type = "cafe";
    else if (category === POI_CATEGORIES.HOTEL) type = "lodging";
    else if (category === POI_CATEGORIES.MEDICAL) type = "pharmacy";
    else if (category === POI_CATEGORIES.EMERGENCY) type = "hospital";
    const service = new window.google.maps.places.PlacesService(map);
    service.nearbySearch(
      {
        location: { lat, lng },
        radius,
        type,
      },
      (results: any[], status: string) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
          reject("Places search failed: " + status);
          return;
        }
        resolve(
          results.map((place: any) => ({
            id: place.place_id,
            name: place.name,
      category,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            address: place.vicinity,
            description: place.types?.join(', '),
            distance: undefined,
            rating: place.rating,
            isOpen: place.opening_hours?.open_now,
          }))
        );
      }
    );
  });
};

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPosition, setCurrentPosition] = useState<{lat: number, lng: number} | null>(null);
  const [searchResults, setSearchResults] = useState<POI[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [routePolyline, setRoutePolyline] = useState<{lat: number, lng: number}[]>([]);
  const [directionsSteps, setDirectionsSteps] = useState<any[]>([]);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const [autocompleteResults, setAutocompleteResults] = useState<any[]>([]);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  
  // Function to get current position
  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("Error getting location:", error);
        toast({
          title: "Location error",
          description: `Could not get your location: ${error.message}`,
          variant: "destructive",
        });
        
        // Use Mumbai as fallback
        setCurrentPosition({ lat: 19.076, lng: 72.8777 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  
  // Get position on mount
  useEffect(() => {
    getCurrentPosition();
  }, []);
  
  // Handle category selection
  const handleCategorySelect = async (category: string) => {
    setSelectedCategory(category);
    if (!currentPosition) {
      toast({
        title: "Location needed",
        description: "Please allow location access to see nearby places",
      });
      getCurrentPosition();
      return;
    }
    if (!mapInstance) {
      toast({ title: "Map not ready yet" });
      return;
    }
    setSearchResults([]);
    toast({ title: "Searching nearby places..." });
    try {
      const pois = await fetchNearbyPlaces(
        mapInstance,
      currentPosition.lat,
      currentPosition.lng,
        category
      );
      setSearchResults(pois);
      toast({
        title: `Found ${pois.length} results`,
        description: `Showing nearby ${category}`,
      });
    } catch (e) {
    toast({
        title: "Failed to fetch places",
        description: (e as Error).message,
        variant: "destructive",
    });
    }
  };
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    if (!currentPosition) {
      toast({
        title: "Location needed",
        description: "Please allow location access to search nearby places",
      });
      getCurrentPosition();
      return;
    }
    if (!mapInstance) {
      toast({ title: "Map not ready yet" });
      return;
    }
    // Determine which category to search based on query
    const lowercaseQuery = searchQuery.toLowerCase();
    let matchedCategory = POI_CATEGORIES.POI;
    if (lowercaseQuery.includes('medical') || lowercaseQuery.includes('pharmacy') || lowercaseQuery.includes('medicine')) {
      matchedCategory = POI_CATEGORIES.MEDICAL;
    } else if (lowercaseQuery.includes('cafe') || lowercaseQuery.includes('coffee') || lowercaseQuery.includes('tea')) {
      matchedCategory = POI_CATEGORIES.CAFE;
    } else if (lowercaseQuery.includes('restaurant') || lowercaseQuery.includes('food') || lowercaseQuery.includes('eat')) {
      matchedCategory = POI_CATEGORIES.RESTAURANT;
    } else if (lowercaseQuery.includes('hotel') || lowercaseQuery.includes('stay') || lowercaseQuery.includes('accommodation')) {
      matchedCategory = POI_CATEGORIES.HOTEL;
    } else if (lowercaseQuery.includes('emergency') || lowercaseQuery.includes('hospital') || lowercaseQuery.includes('urgent')) {
      matchedCategory = POI_CATEGORIES.EMERGENCY;
    }
    setSearchResults([]);
    toast({ title: "Searching nearby places..." });
    try {
      const pois = await fetchNearbyPlaces(
        mapInstance,
      currentPosition.lat,
      currentPosition.lng,
        matchedCategory
    );
      setSearchResults(pois);
    setSelectedCategory(matchedCategory);
      toast({
        title: `Found ${pois.length} results`,
        description: `Showing ${matchedCategory} related to \"${searchQuery}\"`,
      });
    } catch (e) {
    toast({
        title: "Failed to fetch places",
        description: (e as Error).message,
        variant: "destructive",
    });
    }
  };
  
  // Convert POIs to map markers
  const mapMarkers = useMemo(() => {
    if (!searchResults.length) return [];
    
    return searchResults.map(poi => {
      // Create Google Maps directions URL
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`;
      
      return {
        id: poi.id,
        position: {
          lat: poi.latitude,
          lng: poi.longitude
        },
        title: poi.name,
        popup: `
          <div>
            <div class="font-bold">${poi.name}</div>
            <div class="text-sm">${poi.description || ''}</div>
            ${poi.distance !== undefined ? `<div class="mt-1 text-xs">${poi.distance}m away</div>` : ''}
            ${poi.isOpen ? '<div class="text-green-600 text-xs">Open now</div>' : '<div class="text-red-600 text-xs">Closed</div>'}
            <div class="mt-2">
              <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 text-xs font-medium flex items-center gap-1 hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Get Directions
              </a>
            </div>
          </div>
        `,
        markerType: 
          poi.category === POI_CATEGORIES.MEDICAL || poi.category === POI_CATEGORIES.EMERGENCY 
            ? 'poi' 
            : poi.category === POI_CATEGORIES.CAFE || poi.category === POI_CATEGORIES.RESTAURANT
              ? 'user'
              : 'attraction',
        customIcon: true,
        directionsUrl // Store the directions URL in the marker
      };
    });
  }, [searchResults]);
  
  // Add user location marker if available
  const allMarkers = useMemo(() => {
    const markers = [...mapMarkers];
    
    if (currentPosition) {
      markers.push({
        id: 'user-location',
        position: currentPosition,
        title: 'Your Location',
        popup: 'You are here',
        markerType: 'user',
        customIcon: true,
        directionsUrl: '',
        color: 'blue', // Custom property for blue marker
      });
    }
    
    return markers;
  }, [mapMarkers, currentPosition]);
  
  // Fetch directions using Google Maps JS API
  const fetchDirections = async (
    map: any,
    from: { lat: number, lng: number },
    to: { lat: number, lng: number }
  ): Promise<{ polyline: { lat: number, lng: number }[], steps: any[] }> => {
    return new Promise((resolve, reject) => {
      if (!window.google || !map) return resolve({ polyline: [], steps: [] });
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: from,
          destination: to,
          travelMode: window.google.maps.TravelMode.WALKING,
        },
        (result: any, status: string) => {
          if (status !== window.google.maps.DirectionsStatus.OK) {
            resolve({ polyline: [], steps: [] });
            return;
          }
          const overviewPath = result.routes[0].overview_path;
          const polyline = overviewPath.map((latlng: any) => ({ lat: latlng.lat(), lng: latlng.lng() }));
          const steps = result.routes[0].legs[0]?.steps || [];
          resolve({ polyline, steps });
        }
      );
    });
  };

  // Polyline decoder (Google encoded polyline algorithm)
  function decodePolyline(encoded: string) {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return points;
  }

  // Fetch place details from Google Places Details API
  const fetchPlaceDetails = async (
    map: any,
    placeId: string
  ): Promise<PlaceDetails | null> => {
    return new Promise((resolve, reject) => {
      if (!window.google || !map) return reject("Google Maps not loaded");
      const service = new window.google.maps.places.PlacesService(map);
      service.getDetails(
        {
          placeId,
          fields: [
            "name",
            "rating",
            "formatted_address",
            "geometry",
            "opening_hours",
            "types",
            "photos",
            "url",
            "formatted_phone_number",
            "website",
            "reviews",
          ],
        },
        (result: any, status: string) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
            reject("Place details failed: " + status);
            return;
          }
          let photoUrl = undefined;
          if (result.photos && result.photos.length > 0) {
            photoUrl = result.photos[0].getUrl({ maxWidth: 400 });
          }
          resolve({
            name: result.name,
            address: result.formatted_address,
            rating: result.rating,
            isOpen: result.opening_hours?.isOpen(),
            types: result.types,
            photoUrl,
            url: result.url,
            phoneNumber: result.formatted_phone_number,
            website: result.website,
            reviews: result.reviews,
          });
        }
      );
    });
  };

  // Start live navigation (real-time directions)
  const startLiveNavigation = (destination: { lat: number; lng: number }) => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentPosition({ lat: latitude, lng: longitude });
        if (mapInstance) {
          const { polyline, steps } = await fetchDirections(
            mapInstance,
            { lat: latitude, lng: longitude },
            destination
          );
          setRoutePolyline(polyline);
          setDirectionsSteps(steps);
        }
      },
      (err) => {
        // Optionally handle error
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  // Stop live navigation
  const stopLiveNavigation = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Update handleMarkerClick to start live navigation
  const handleMarkerClick = async (marker: any) => {
    if (!currentPosition) return;
    if (!mapInstance) {
      toast({ title: "Map not ready yet" });
      return;
    }
    const poi = searchResults.find(p => p.latitude === marker.position.lat && p.longitude === marker.position.lng);
    if (!poi) return;
    setSelectedPOI(poi);
    setPlaceDetails(null);
    setDirectionsSteps([]);
    toast({ title: "Fetching directions and place info..." });
    try {
      // Fetch directions
      const { polyline, steps } = await fetchDirections(mapInstance, currentPosition, { lat: poi.latitude, lng: poi.longitude });
      setRoutePolyline(polyline);
      setDirectionsSteps(steps);
      // Fetch place details
      const details = await fetchPlaceDetails(mapInstance, poi.id);
      setPlaceDetails(details);
      toast({ title: "Directions and place info loaded" });
      // Start live navigation
      startLiveNavigation({ lat: poi.latitude, lng: poi.longitude });
    } catch (e) {
      setRoutePolyline([]);
      setDirectionsSteps([]);
      setPlaceDetails(null);
      toast({ title: "Failed to fetch info", description: (e as Error).message, variant: "destructive" });
    }
  };
  
  // Autocomplete handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (window.google && e.target.value) {
      setAutocompleteLoading(true);
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        { input: e.target.value },
        (predictions: any[], status: string) => {
          setAutocompleteLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            setAutocompleteResults(predictions);
          } else {
            setAutocompleteResults([]);
          }
        }
      );
    } else {
      setAutocompleteResults([]);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = async (placeId: string) => {
    setAutocompleteResults([]);
    setSearchQuery("");
    if (!window.google || !mapInstance) return;
    const service = new window.google.maps.places.PlacesService(mapInstance);
    service.getDetails(
      {
        placeId,
        fields: [
          "name",
          "geometry",
          "formatted_address",
          "rating",
          "opening_hours",
          "types",
          "photos",
          "url",
          "formatted_phone_number",
          "website",
          "reviews",
        ],
      },
      (result: any, status: string) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          // Center map
          if (result.geometry && result.geometry.location) {
            mapInstance.setCenter(result.geometry.location);
            mapInstance.setZoom(16);
          }
          // Show as selected POI
          setSelectedPOI({
            id: placeId,
            name: result.name,
            category: result.types?.[0] || "poi",
            latitude: result.geometry.location.lat(),
            longitude: result.geometry.location.lng(),
            address: result.formatted_address,
            description: result.types?.join(", "),
            rating: result.rating,
            isOpen: result.opening_hours?.isOpen(),
          });
          // Show place details in panel
          let photoUrl = undefined;
          if (result.photos && result.photos.length > 0) {
            photoUrl = result.photos[0].getUrl({ maxWidth: 400 });
          }
          setPlaceDetails({
            name: result.name,
            address: result.formatted_address,
            rating: result.rating,
            isOpen: result.opening_hours?.isOpen(),
            types: result.types,
            photoUrl,
            url: result.url,
            phoneNumber: result.formatted_phone_number,
            website: result.website,
            reviews: result.reviews,
          });
          setDirectionsSteps([]);
          setRoutePolyline([]);
          stopLiveNavigation();
        }
      }
    );
  };
  
  return (
    <Layout>
      <div className="flex flex-col h-screen">
        <div className="p-4 space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search medical, cafes, restaurants..."
              value={searchQuery}
              onChange={handleInputChange}
              className="pl-10 pr-4 py-2 w-full"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"
              onClick={handleSearch}
            />
            {/* Autocomplete suggestions dropdown */}
            {autocompleteResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                {autocompleteResults.map((item) => (
                  <div
                    key={item.place_id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => handleSuggestionClick(item.place_id)}
                  >
                    {item.description}
                  </div>
                ))}
              </div>
            )}
          </div>

          <ScrollArea className="whitespace-nowrap pb-2">
            <div className="flex space-x-2">
              {topCategories.map((category) => (
                <Button
                  key={category.name}
                  variant={selectedCategory === category.category ? "default" : "outline"}
                  onClick={() => handleCategorySelect(category.category)}
                  className="flex items-center space-x-2"
                >
                  <category.icon className="h-4 w-4" />
                  <span>{category.name}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 relative">
          <MapView
            center={currentPosition || { lat: 19.076, lng: 72.8777 }}
            zoom={currentPosition ? 16 : 12}
            markers={allMarkers}
            className="w-full h-full"
            routePolyline={routePolyline}
            onMarkerClick={handleMarkerClick}
            onMapLoad={setMapInstance}
          />
          
          {/* Location refresh button */}
          {!currentPosition && (
            <Button
              className="absolute right-4 bottom-24 z-20 rounded-full shadow-md h-12 w-12 p-0"
              onClick={getCurrentPosition}
            >
              <MapPin className="h-5 w-5" />
            </Button>
          )}
          
          {/* Results count */}
          {searchResults.length > 0 && (
            <div className="absolute top-4 right-4 z-20 bg-white py-1 px-3 rounded-full shadow-md">
              <span className="text-sm font-medium">{searchResults.length} results</span>
            </div>
          )}
          
          {/* Directions & Place Info Panel */}
          {selectedPOI && (placeDetails || directionsSteps.length > 0) && (
            <div className="fixed left-0 right-0 bottom-0 z-30 bg-white shadow-2xl rounded-t-2xl p-4 max-h-[60vh] overflow-y-auto border-t border-gray-200 animate-slide-up">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {placeDetails?.photoUrl && (
                    <img src={placeDetails.photoUrl} alt={placeDetails.name} className="w-16 h-16 rounded object-cover border" />
                  )}
                  <div>
                    <div className="font-bold text-lg flex items-center gap-2">
                      {placeDetails?.name || selectedPOI.name}
                      {placeDetails?.rating && (
                        <span className="flex items-center text-yellow-500 text-sm ml-2"><Star className="w-4 h-4 mr-1" />{placeDetails.rating}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <MapIcon className="w-4 h-4" />
                      {placeDetails?.address || selectedPOI.address}
                    </div>
                    {placeDetails?.isOpen !== undefined && (
                      <div className={placeDetails.isOpen ? "text-green-600 text-xs" : "text-red-600 text-xs"}>
                        {placeDetails.isOpen ? "Open now" : "Closed"}
                      </div>
                    )}
                    {placeDetails?.types && (
                      <div className="text-xs text-gray-400 mt-1">{placeDetails.types.slice(0, 3).join(", ")}</div>
                    )}
                  </div>
                </div>
                <button onClick={() => { setSelectedPOI(null); setPlaceDetails(null); setDirectionsSteps([]); setRoutePolyline([]); stopLiveNavigation(); }} className="p-2 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {placeDetails?.url && (
                  <a href={placeDetails.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 flex items-center gap-1 text-xs hover:underline">
                    <ExternalLink className="w-4 h-4" /> Google Maps
                  </a>
                )}
                {placeDetails?.website && (
                  <a href={placeDetails.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 flex items-center gap-1 text-xs hover:underline">
                    <ExternalLink className="w-4 h-4" /> Website
                  </a>
                )}
                {placeDetails?.phoneNumber && (
                  <span className="text-xs text-gray-500 ml-2">{placeDetails.phoneNumber}</span>
                )}
              </div>
              {/* Directions Steps */}
              {directionsSteps.length > 0 && (
                <div className="mt-2">
                  <div className="font-semibold mb-1 flex items-center gap-2"><Clock className="w-4 h-4" />Directions</div>
                  <ol className="space-y-2 pl-4">
                    {directionsSteps.map((step, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex gap-2 items-start">
                        <span className="font-bold text-blue-600">{idx + 1}.</span>
                        <span dangerouslySetInnerHTML={{ __html: step.html_instructions }} />
                        <span className="text-xs text-gray-400 ml-2">{step.distance?.text} ({step.duration?.text})</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>

        <Card className="mx-4 mb-4 p-4">
          <div className="grid grid-cols-3 gap-4">
            {gridCategories.map((category) => (
              <Button
                key={category.name}
                variant="outline"
                onClick={() => handleCategorySelect(category.category)}
                className="flex flex-col items-center p-4 h-auto"
              >
                <category.icon className="h-6 w-6 mb-2" />
                <span className="text-sm text-center">{category.name}</span>
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default SearchPage;
