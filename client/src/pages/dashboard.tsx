import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/bottom-navigation";
import MapView from "@/components/map-view";
import Categories from "@/components/home/categories";
import FeaturedPlaces from "@/components/home/featured-places";
import AvailableGuides from "@/components/home/available-guides";
import { ChatAssistant } from "@/components/chat-assistant";
import { useWikimedia } from "@/hooks/use-wikimedia";
import { Place } from "@shared/schema";
import { fetchApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, X } from "lucide-react";

// Define interface for user location
interface UserLocation {
  userId: string | number;
  username: string;
  name?: string;
  latitude: number;
  longitude: number;
  lastUpdated: string;
  userType: 'guide' | 'tourist';
}

const Dashboard: React.FC = () => {
  const [_, setLocation] = useLocation();
  const [bottomSheetOpen, setBottomSheetOpen] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPosition, setCurrentPosition] = useState<{lat: number, lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationUpdateInterval, setLocationUpdateInterval] = useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(true);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const startHeight = useRef<number | null>(null);
  const [sheetHeight, setSheetHeight] = useState<number>(400); // initial height in px
  
  // Fetch places from API
  const { data: rawPlaces = [], isLoading: isLoadingPlaces } = useQuery<Place[]>({
    queryKey: ['/api/places'],
    queryFn: async () => {
      return fetchApi<Place[]>('/api/places');
    }
  });

  // Fetch guide locations
  const { data: guideLocations = [], isLoading: isLoadingGuideLocations } = useQuery<UserLocation[]>({
    queryKey: ['/api/guides/locations'],
    queryFn: async () => {
      try {
        console.log('Fetching guide locations...');
        // Make sure we're using the full URL path
        const response = await fetchApi<UserLocation[]>('/api/locations/guides');
        console.log('Guide locations response:', response);
        return response;
      } catch (error) {
        console.error("Failed to fetch guide locations", error);
        // Return mock data as fallback
        return [
          {
            userId: "guide1",
            username: "maharashtra_explorer",
            name: "Amol Deshmukh",
            latitude: 18.922,
            longitude: 72.8347, // Gateway of India
            lastUpdated: new Date().toISOString(),
            userType: 'guide'
          },
          {
            userId: "guide2",
            username: "pune_guide",
            name: "Priya Sharma",
            latitude: 18.5195,
            longitude: 73.8553, // Shaniwar Wada
            lastUpdated: new Date().toISOString(),
            userType: 'guide'
          }
        ];
      }
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Fetch tourist locations
  const { data: touristLocations = [], isLoading: isLoadingTouristLocations } = useQuery<UserLocation[]>({
    queryKey: ['/api/tourists/locations'],
    queryFn: async () => {
      try {
        console.log('Fetching tourist locations...');
        // Make sure we're using the full URL path
        const response = await fetchApi<UserLocation[]>('/api/locations/tourists');
        console.log('Tourist locations response:', response);
        return response;
      } catch (error) {
        console.error("Failed to fetch tourist locations", error);
        // Return mock data as fallback
        return [
          {
            userId: "tourist1",
            username: "traveler123",
            name: "John Singh",
            latitude: 18.9252,
            longitude: 72.8245, // Near Gateway of India
            lastUpdated: new Date().toISOString(),
            userType: 'tourist'
          },
          {
            userId: "tourist2",
            username: "worldexplorer",
            name: "Emma Patel",
            latitude: 18.5205,
            longitude: 73.8653, // Near Shaniwar Wada
            lastUpdated: new Date().toISOString(),
            userType: 'tourist'
          }
        ];
      }
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });
  
  // Enhance places with Wikimedia images
  // Use useMemo to prevent the places array from changing identity on every render
  const placesWithStableIdentity = useMemo(() => rawPlaces, [rawPlaces]);
  
  const { places, isLoading: isLoadingWikimedia } = useWikimedia(placesWithStableIdentity, {
    updateDatabase: true // Also update the backend data
  });

  // Boolean to check if any loading is in progress
  const isLoading = isLoadingPlaces || isLoadingWikimedia || isLoadingGuideLocations || isLoadingTouristLocations;

  // Get user's current location
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }
    
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition({ lat: latitude, lng: longitude });
        
        // Update user location on server
        updateUserLocation(latitude, longitude);
        setLocationLoading(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast({
          title: "Location error",
          description: `Could not get your location: ${error.message}`,
          variant: "destructive",
        });
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [toast]);

  // Start interval to continuously update location
  const startLiveLocationTracking = useCallback(() => {
    // Clear any existing interval
    if (locationUpdateInterval) {
      window.clearInterval(locationUpdateInterval);
    }
    
    // Get initial position
    getCurrentPosition();
    
    // Set up interval to update position every 30 seconds
    const intervalId = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentPosition({ lat: latitude, lng: longitude });
          updateUserLocation(latitude, longitude);
        },
        (error) => console.error("Error updating location:", error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }, 30000); // Update every 30 seconds
    
    setLocationUpdateInterval(intervalId);
    
    toast({
      title: "Live tracking enabled",
      description: "Your location will update every 30 seconds",
    });
  }, [getCurrentPosition, locationUpdateInterval, toast]);
  
  // Stop live location tracking
  const stopLiveLocationTracking = useCallback(() => {
    if (locationUpdateInterval) {
      window.clearInterval(locationUpdateInterval);
      setLocationUpdateInterval(null);
      
      toast({
        title: "Live tracking disabled",
        description: "Your location will no longer be updated automatically",
      });
    }
  }, [locationUpdateInterval, toast]);
  
  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (locationUpdateInterval) {
        window.clearInterval(locationUpdateInterval);
      }
    };
  }, [locationUpdateInterval]);
  
  // Update user location on server
  const updateUserLocation = async (lat: number, lng: number) => {
    if (!user?.id) return;
    
    try {
      const response = await fetchApi("POST", "/api/user/location", {
        userId: user.id,
        latitude: lat.toString(),
        longitude: lng.toString(),
      });
      
      console.log("Location updated on server");
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  // Use enhanced places data for rendering
  // Calculate map markers once when places change
  const mapMarkers = useMemo(() => {
    const markers = [];
    
    // Add place markers
    if (places && places.length > 0) {
      const placeMarkers = places
        .filter(place => 
          ['attraction', 'monument', 'heritage', 'landmark'].includes(place.category || '')
        )
        .map(place => ({
          id: place.id,
          position: {
            lat: parseFloat(place.latitude),
            lng: parseFloat(place.longitude)
          },
          title: place.name,
          popup: place.name,
          markerType: 'attraction',
          customIcon: true
        }));
      
      markers.push(...placeMarkers);
    }
    
    // Add guide markers with live status
    if (guideLocations && guideLocations.length > 0) {
      const guideMarkers = guideLocations.map(guide => ({
        userId: guide.userId,
        position: {
          lat: guide.latitude,
          lng: guide.longitude
        },
        title: guide.name || guide.username,
        popup: `Guide: ${guide.name || guide.username}`,
        markerType: 'guide',
        customIcon: true,
        isLive: true // Mark as live location
      }));
      
      markers.push(...guideMarkers);
    }
    
    // Add tourist markers with live status
    if (touristLocations && touristLocations.length > 0) {
      const touristMarkers = touristLocations.map(tourist => ({
        userId: tourist.userId,
        position: {
          lat: tourist.latitude,
          lng: tourist.longitude
        },
        title: tourist.name || tourist.username,
        popup: `Tourist: ${tourist.name || tourist.username}`,
        markerType: 'user',
        customIcon: true,
        isLive: true // Mark as live location
      }));
      
      markers.push(...touristMarkers);
    }
    
    // Add current user's location if available
    if (currentPosition) {
      markers.push({
        id: 'current-user',
        position: currentPosition,
        title: 'Your Location',
        popup: 'You are here',
        markerType: 'user',
        customIcon: true,
        isLive: !!locationUpdateInterval // Only mark as live if tracking is enabled
      });
    }
    
    return markers;
  }, [places, guideLocations, touristLocations, currentPosition, locationUpdateInterval]);
  
  // Map center - prioritize user's location if available
  const mapCenter = useMemo(() => {
    if (currentPosition) {
      return currentPosition;
    }
    
    // Default to Mumbai
    return { lat: 19.076, lng: 72.8777 };
  }, [currentPosition]);
  
  // Drag logic for bottom sheet (simple pure React/CSS)
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    startY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startHeight.current = sheetRef.current ? sheetRef.current.offsetHeight : 400;
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleDragMove as any);
    window.addEventListener('touchmove', handleDragMove as any);
    window.addEventListener('mouseup', handleDragEnd as any);
    window.addEventListener('touchend', handleDragEnd as any);
  };
  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (startY.current !== null && startHeight.current !== null) {
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const delta = startY.current - clientY;
      setSheetHeight(Math.max(120, Math.min(window.innerHeight - 80, startHeight.current + delta)));
    }
  };
  const handleDragEnd = () => {
    startY.current = null;
    startHeight.current = null;
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', handleDragMove as any);
    window.removeEventListener('touchmove', handleDragMove as any);
    window.removeEventListener('mouseup', handleDragEnd as any);
    window.removeEventListener('touchend', handleDragEnd as any);
  };
  
  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Map and search bar */}
      <div className="fixed inset-0 z-0">
        <MapView
          center={mapCenter}
          zoom={currentPosition ? 15 : 12}
          markers={mapMarkers}
          className="w-full h-full"
        />
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
            <Input 
              type="text" 
              placeholder="Search locations in Maharashtra" 
              className="w-full pl-9 rounded-full"
              onClick={() => setLocation('/search')}
            />
            <div className="ml-3 flex-shrink-0">
              <ChatAssistant />
            </div>
        </div>
      </div>
      
      {/* Custom Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`fixed left-0 right-0 z-30 bg-white rounded-t-2xl shadow-2xl transition-all duration-300 ${isSheetOpen ? '' : 'translate-y-[80%]'} overflow-y-auto`}
        style={{
          bottom: 0,
          height: sheetHeight,
          minHeight: 120,
          maxHeight: '80vh',
        }}
      >
        {/* Drag handle */}
        <div
          className="w-full flex justify-center py-2 cursor-row-resize"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>
        <div className="p-4 space-y-6">
              <Categories />
          <FeaturedPlaces places={places} isLoading={isLoadingWikimedia} />
              <AvailableGuides />
            </div>
      </div>
        
        {/* Floating Action Button for location tracking */}
        <Button
          className="absolute right-4 bottom-20 z-20 rounded-full shadow-md h-14 w-14 p-0"
          variant={locationUpdateInterval ? "destructive" : "default"}
          onClick={locationUpdateInterval ? stopLiveLocationTracking : startLiveLocationTracking}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
          ) : locationUpdateInterval ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
        
        {/* Live location status indicator */}
        {locationUpdateInterval && (
          <div className="absolute left-4 bottom-20 z-20 bg-white py-1 px-3 rounded-full shadow-md flex items-center">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium">Live location active</span>
          </div>
        )}
      
      {/* Global styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .bottom-sheet-dragging {
            overflow: hidden !important;
          }
          
          .bottom-sheet-drag {
            cursor: grab;
            touch-action: none !important;
          }
          
          .bottom-sheet-drag:active {
            cursor: grabbing;
          }
          
          .bottom-sheet-drag .w-16 {
            position: relative;
            z-index: 9999;
            pointer-events: auto !important;
          }
          
          .leaflet-container {
            z-index: 1;
          }
          
          .leaflet-control-container {
            z-index: 10;
          }
        `
      }} />
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

export default Dashboard;