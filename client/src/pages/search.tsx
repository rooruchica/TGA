import { Layout } from "@/components/layout";
import MapView, { MarkerType } from "@/components/map-view";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MapPin, Store, Coffee, Hotel, Landmark, PlusCircle, Stethoscope, ShoppingBag, AlertTriangle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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

// Generate mock POIs near a location
const generateMockPOIsNearLocation = (
  baseLat: number, 
  baseLng: number, 
  category: string, 
  count: number = 5, 
  maxDistance: number = 500 // maximum distance in meters
): POI[] => {
  const result: POI[] = [];
  
  // Names based on category
  const namesByCategory: Record<string, string[]> = {
    [POI_CATEGORIES.MEDICAL]: [
      "City Pharmacy", "MediCare Plus", "LifeCare Clinic", 
      "24x7 Medicines", "Health First", "Apollo Pharmacy",
      "MedPlus", "Family Health", "Wellness Drugstore", "Care Pharmacy"
    ],
    [POI_CATEGORIES.CAFE]: [
      "Chai Corner", "Coffee House", "Café Delight", 
      "Mumbai Beans", "Tea Tales", "Espresso Express",
      "Barista", "Brew Stop", "Café Culture", "Morning Shot"
    ],
    [POI_CATEGORIES.RESTAURANT]: [
      "Spice Garden", "Royal Treat", "Taste of India", 
      "Mumbai Delights", "Street Bites", "Heritage Kitchen",
      "Flavors", "Curry House", "Masala Junction", "Local Tadka"
    ],
    [POI_CATEGORIES.HOTEL]: [
      "City Stay", "Royal Residency", "Heritage Hotel", 
      "Grand Luxury", "Tourist Home", "Comfort Inn",
      "Traveller's Rest", "Business Plaza", "Weekend Getaway", "Stay Inn"
    ],
    [POI_CATEGORIES.EMERGENCY]: [
      "City Hospital", "Emergency Care", "24/7 Medical Center", 
      "Trauma Center", "Urgent Care", "St. Mary's Hospital",
      "LifeLine Hospital", "Emergency Services", "Accident Care", "EMS Center"
    ],
    [POI_CATEGORIES.POI]: [
      "Viewpoint", "Local Market", "City Square", 
      "Heritage Building", "Art Gallery", "Museum",
      "Temple", "Garden", "Historical Site", "Cultural Center"
    ]
  };
  
  // Description templates
  const descriptionsByCategory: Record<string, string[]> = {
    [POI_CATEGORIES.MEDICAL]: [
      "24x7 pharmacy with all essential medicines",
      "Medical store with trained pharmacists",
      "Healthcare products and prescription services",
      "Affordable medicines and health supplies",
      "Well-stocked pharmacy with quick service"
    ],
    [POI_CATEGORIES.CAFE]: [
      "Cozy café serving fresh coffee and snacks",
      "Local café with great ambiance",
      "Popular coffee stop with free WiFi",
      "Traditional tea house with local flavors",
      "Premium coffee shop with pastries"
    ],
    [POI_CATEGORIES.RESTAURANT]: [
      "Authentic local cuisine with reasonable prices",
      "Family restaurant with diverse menu",
      "Popular eatery with signature dishes",
      "Specialty restaurant with great reviews",
      "Budget-friendly food with quick service"
    ],
    [POI_CATEGORIES.EMERGENCY]: [
      "24/7 emergency services with ambulance",
      "Urgent care center with qualified doctors",
      "Emergency room with modern facilities",
      "Trauma center for immediate attention",
      "Quick response medical emergency unit"
    ],
    [POI_CATEGORIES.POI]: [
      "Popular tourist spot with amazing views",
      "Historical site with cultural significance",
      "Must-visit location for travelers",
      "Local attraction with guided tours",
      "Hidden gem loved by locals"
    ]
  };
  
  // One degree of latitude is approximately 111 kilometers
  // So 1 meter is approximately 1/111000 degree
  const meterToDegree = 1/111000;
  
  for (let i = 0; i < count; i++) {
    // Generate a random distance (up to maxDistance meters)
    const distance = Math.random() * maxDistance;
    
    // Generate a random angle (in radians)
    const angle = Math.random() * 2 * Math.PI;
    
    // Calculate offset in degrees
    const latOffset = Math.cos(angle) * distance * meterToDegree;
    const lngOffset = Math.sin(angle) * distance * meterToDegree;
    
    // Names for this category
    const names = namesByCategory[category] || namesByCategory[POI_CATEGORIES.POI];
    const descriptions = descriptionsByCategory[category] || descriptionsByCategory[POI_CATEGORIES.POI];
    
    result.push({
      id: `${category}-${i}`,
      name: names[i % names.length],
      category,
      latitude: baseLat + latOffset,
      longitude: baseLng + lngOffset,
      distance: Math.round(distance),
      rating: 3.5 + Math.random() * 1.5, // Random rating between 3.5 and 5
      isOpen: Math.random() > 0.2, // 80% chance of being open
      description: descriptions[i % descriptions.length]
    });
  }
  
  // Sort by distance
  return result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
};

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPosition, setCurrentPosition] = useState<{lat: number, lng: number} | null>(null);
  const [searchResults, setSearchResults] = useState<POI[]>([]);
  
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
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    
    if (!currentPosition) {
      toast({
        title: "Location needed",
        description: "Please allow location access to see nearby places",
      });
      getCurrentPosition();
      return;
    }
    
    // Generate mock data for selected category
    const mockPOIs = generateMockPOIsNearLocation(
      currentPosition.lat,
      currentPosition.lng,
      category,
      category === POI_CATEGORIES.MEDICAL ? 5 : 
      category === POI_CATEGORIES.CAFE ? 5 : 8
    );
    
    setSearchResults(mockPOIs);
    
    toast({
      title: `Found ${mockPOIs.length} results`,
      description: `Showing nearby ${category} within 500m radius`,
    });
  };
  
  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    if (!currentPosition) {
      toast({
        title: "Location needed",
        description: "Please allow location access to search nearby places",
      });
      getCurrentPosition();
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
    
    // Generate mock data for matched category
    const mockPOIs = generateMockPOIsNearLocation(
      currentPosition.lat,
      currentPosition.lng,
      matchedCategory,
      5
    );
    
    setSearchResults(mockPOIs);
    setSelectedCategory(matchedCategory);
    
    toast({
      title: `Found ${mockPOIs.length} results`,
      description: `Showing ${matchedCategory} related to "${searchQuery}"`,
    });
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
            ? 'poi' as MarkerType 
            : poi.category === POI_CATEGORIES.CAFE || poi.category === POI_CATEGORIES.RESTAURANT
              ? 'user' as MarkerType
              : 'attraction' as MarkerType,
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
        markerType: 'user' as MarkerType,
        customIcon: true,
        isLive: true
      } as any); // Type assertion to avoid type error
    }
    
    return markers;
  }, [mapMarkers, currentPosition]);
  
  return (
    <Layout>
      <div className="flex flex-col h-screen">
        <div className="p-4 space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search medical, cafes, restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
