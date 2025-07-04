import MapView from "@/components/map-view";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MapPin, Store, Coffee, Hotel, Landmark, PlusCircle, Stethoscope, ShoppingBag, AlertTriangle, X, ExternalLink, Star, Map as MapIcon, Clock } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";

declare global {
  interface Window {
    google: any;
  }
}

// Add TypeScript declaration for custom element to silence JSX error
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmpx-place-details': any;
    }
  }
}

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

// Define interface for PlaceDetails
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
  photos?: any[];
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
    if (!window.google || !map || !(map instanceof window.google.maps.Map)) return reject("Google Maps not loaded or map is not a valid Map instance");
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
  const [showDirections, setShowDirections] = useState(false);
  const [selectedTravelMode, setSelectedTravelMode] = useState("DRIVING");
  const [travelInfo, setTravelInfo] = useState<{ duration: string; distance: string } | null>(null);
  
  // Add a ref to track if we should fit bounds
  const shouldFitBoundsRef = useRef(false);
  
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
    
    // Add marker for selected place if not already in searchResults
    if (selectedPOI && !searchResults.some(p => p.id === selectedPOI.id)) {
      markers.push({
        id: selectedPOI.id,
        position: { lat: selectedPOI.latitude, lng: selectedPOI.longitude },
        title: selectedPOI.name,
        popup: selectedPOI.name,
        markerType: 'attraction',
        customIcon: false, // default map-pin
        directionsUrl: ''
      });
    }
    
    // Add user location marker as blue dot
    if (currentPosition) {
      markers.push({
        id: 'user-location',
        position: currentPosition,
        title: 'Your Location',
        popup: 'You are here',
        markerType: 'user',
        customIcon: true,
        directionsUrl: ''
      });
    }
    
    return markers;
  }, [mapMarkers, selectedPOI, searchResults, currentPosition]);
  
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
      if (!window.google || !map || !(map instanceof window.google.maps.Map)) return reject("Google Maps not loaded or map is not a valid Map instance");
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
            photos: result.photos,
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
    // Find POI in searchResults or selectedPOI
    let poi = searchResults.find(p => p.latitude === marker.position.lat && p.longitude === marker.position.lng);
    if (!poi && selectedPOI && selectedPOI.latitude === marker.position.lat && selectedPOI.longitude === marker.position.lng) {
      poi = selectedPOI;
    }
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
    if (!window.google || !mapInstance || !(mapInstance instanceof window.google.maps.Map)) return;
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
      async (result: any, status: string) => {
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
            photos: result.photos,
          });
          // Fetch and show directions for searched location
          if (currentPosition && result.geometry && result.geometry.location) {
            const { polyline, steps } = await fetchDirections(
              mapInstance,
              currentPosition,
              { lat: result.geometry.location.lat(), lng: result.geometry.location.lng() }
            );
            setRoutePolyline(polyline);
            setDirectionsSteps(steps);
          } else {
            setRoutePolyline([]);
            setDirectionsSteps([]);
          }
          stopLiveNavigation();
        }
      }
    );
  };
  
  // Add travel modes
  const TRAVEL_MODES = [
    { label: "Car", value: "DRIVING" },
    { label: "Bike", value: "BICYCLING" },
    { label: "Bus", value: "TRANSIT" },
    { label: "Walk", value: "WALKING" },
  ];

  // Fetch directions info for selected mode
  const fetchTravelInfo = async (from: { lat: number, lng: number }, to: { lat: number, lng: number }, mode: string) => {
    return new Promise<{ duration: string; distance: string } | null>((resolve) => {
      if (!window.google) return resolve(null);
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: from,
          destination: to,
          travelMode: window.google.maps.TravelMode[mode],
        },
        (result: any, status: string) => {
          if (status !== window.google.maps.DirectionsStatus.OK) {
            resolve(null);
            return;
          }
          const leg = result.routes[0].legs[0];
          resolve({ duration: leg.duration.text, distance: leg.distance.text });
        }
      );
    });
  };

  // When selectedPOI or travel mode changes, fetch travel info
  useEffect(() => {
    if (showDirections && selectedPOI && currentPosition) {
      fetchTravelInfo(currentPosition, { lat: selectedPOI.latitude, lng: selectedPOI.longitude }, selectedTravelMode)
        .then(setTravelInfo);
    } else {
      setTravelInfo(null);
    }
  }, [showDirections, selectedPOI, currentPosition, selectedTravelMode]);
  
  // When directions are shown or routePolyline changes, fit map to bounds
  useEffect(() => {
    if (showDirections && mapInstance && routePolyline && routePolyline.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      routePolyline.forEach(point => bounds.extend(point));
      if (currentPosition) bounds.extend(currentPosition);
      if (selectedPOI) bounds.extend({ lat: selectedPOI.latitude, lng: selectedPOI.longitude });
      mapInstance.fitBounds(bounds);
      shouldFitBoundsRef.current = false;
    }
  }, [showDirections, mapInstance, routePolyline, currentPosition, selectedPOI]);

  // NEW: Fit bounds to user and selected place even if not showing directions
  useEffect(() => {
    if (
      mapInstance &&
      selectedPOI &&
      currentPosition &&
      !showDirections
    ) {
      // Defensive: Check for valid coordinates
      const isValid = (pt: any) =>
        pt &&
        typeof pt.lat === 'number' &&
        !isNaN(pt.lat) &&
        typeof pt.lng === 'number' &&
        !isNaN(pt.lng);

      const dest = { lat: selectedPOI.latitude, lng: selectedPOI.longitude };
      if (!isValid(currentPosition) || !isValid(dest)) {
        return;
      }

      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(currentPosition);
      bounds.extend(dest);
      mapInstance.fitBounds(bounds);
    }
  }, [selectedPOI, currentPosition, mapInstance, showDirections]);

  // When a place is selected (POI or search result), always show directions
  useEffect(() => {
    if (selectedPOI) {
      setShowDirections(true);
    }
  }, [selectedPOI]);

  return (
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
          routePolyline={showDirections && routePolyline.length > 0 ? routePolyline : undefined}
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
        {selectedPOI && (
          <div id="place-details-ui" style={{ width: '100%', minHeight: 300 }}>
            <gmpx-place-details place-id={selectedPOI.id} language="en"></gmpx-place-details>
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
      <BottomNavigation />

      {placeDetails && (
        <div className="place-details-panel" style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 16, margin: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>{placeDetails.name}</h2>
          <p style={{ margin: '8px 0' }}>{placeDetails.address}</p>
          {placeDetails.rating && <p>Rating: {placeDetails.rating} ⭐</p>}
          {placeDetails.isOpen !== undefined && (
            <p>Status: <span style={{ color: placeDetails.isOpen ? 'green' : 'red' }}>{placeDetails.isOpen ? 'Open now' : 'Closed'}</span></p>
          )}
          {placeDetails.website && (
            <p><a href={placeDetails.website} target="_blank" rel="noopener noreferrer">Website</a></p>
          )}
          {placeDetails.phoneNumber && <p>Phone: {placeDetails.phoneNumber}</p>}
          {placeDetails.photoUrl && (
            <img src={placeDetails.photoUrl} alt="Place" style={{ width: '100%', maxWidth: 400, borderRadius: 8, margin: '12px 0' }} />
          )}
          {placeDetails.reviews && placeDetails.reviews.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 500 }}>Reviews:</h3>
              <ul style={{ paddingLeft: 16 }}>
                {placeDetails.reviews.slice(0, 3).map((review: any, idx: number) => (
                  <li key={idx} style={{ marginBottom: 8 }}>
                    <strong>{review.author_name}</strong>: {review.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
