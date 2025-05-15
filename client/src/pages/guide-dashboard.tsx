import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import MapView from "@/components/map-view";
import GuideStats from "@/components/guide/guide-stats";
import RequestsPreview from "@/components/guide/requests-preview";
import UpcomingTours from "@/components/guide/upcoming-tours";
import { useAuth, User } from "@/lib/AuthContext";
import { ChatAssistant } from "@/components/chat-assistant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import GuideBottomNavigation from "@/components/guide/bottom-navigation";
import { MapPin, Loader, Plus, X } from "lucide-react";
import { fetchApi } from "@/lib/api-client";

// Extend User interface to include guide-specific properties
interface GuideUser extends User {
  currentLatitude?: string;
  currentLongitude?: string;
}

interface Connection {
  id: number | string;
  fromUserId: string | number;
  toUserId: string | number;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  tripDetails?: string;
  budget?: string;
  createdAt: string;
  updatedAt: string;
  fromUser?: User;
}

interface Stats {
  pendingRequests: number;
  activeConnections: number;
  completedTours: number;
  rating: number;
  reviews: number;
}

// Define the place interface to fix TypeScript errors
interface Place {
  id: number | string;
  name: string;
  location: string;
  latitude: string;
  longitude: string;
  description?: string;
  category?: string;
}

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

// Create some mock places data for the map
const MOCK_PLACES: Place[] = [
  {
    id: "1",
    name: "Gateway of India",
    location: "Mumbai",
    latitude: "18.9220",
    longitude: "72.8347",
    description: "Iconic monument in Mumbai",
    category: "monument"
  },
  {
    id: "2",
    name: "Ajanta Caves",
    location: "Aurangabad",
    latitude: "20.5522",
    longitude: "75.7033",
    description: "Ancient Buddhist cave monuments",
    category: "heritage"
  },
  {
    id: "3",
    name: "Ellora Caves",
    location: "Aurangabad",
    latitude: "20.0258",
    longitude: "75.1780",
    description: "UNESCO World Heritage Site",
    category: "heritage"
  },
  {
    id: "4",
    name: "Shaniwar Wada",
    location: "Pune",
    latitude: "18.5195",
    longitude: "73.8553",
    description: "Historical fortification in Pune",
    category: "monument"
  }
];

const GuideDashboard: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [bottomSheetOpen, setBottomSheetOpen] = useState(true);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<GuideUser | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{lat: number, lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationUpdateInterval, setLocationUpdateInterval] = useState<number | null>(null);
  const mapRef = useRef<any>(null);

  // Simplified authentication check
  useEffect(() => {
    console.log("Checking authentication for guide dashboard...");
    console.log("Auth loading:", authLoading);
    console.log("Current user:", user);
    console.log("Window auth object:", (window as any).auth);
    
    // Give a little time for auth to initialize
    setTimeout(() => {
      // First try to get user from context
      let userToUse = user;
      
      // If no user in context, check window.auth as fallback
      if (!userToUse && (window as any).auth?.user) {
        console.log("Using window.auth fallback:", (window as any).auth.user);
        userToUse = (window as any).auth.user;
      }
      
      if (!userToUse) {
        console.log("No user found, redirecting to login");
        toast({
          title: "Authentication required",
          description: "Please login to access guide dashboard",
          variant: "destructive",
        });
        setLocation('/login');
        return;
      }
      
      if (!userToUse.isGuide) {
        console.log("User is not a guide, redirecting to dashboard");
        toast({
          title: "Access denied",
          description: "This page is only for guides",
          variant: "destructive",
        });
        setLocation('/dashboard');
        return;
      }
      
      console.log("Guide authenticated successfully:", userToUse);
      setCurrentUser(userToUse as GuideUser);
    }, 200); // Short delay to ensure auth has time to initialize
  }, [user, authLoading, setLocation, toast]);

  // Use mock places data directly rather than querying
  const { data: places = MOCK_PLACES, isLoading: isLoadingPlaces } = useQuery<Place[]>({
    queryKey: ["/api/places"],
    // Return mock data directly 
    queryFn: () => Promise.resolve(MOCK_PLACES),
    // Only enable if user is authenticated as guide
    enabled: !!user && user.isGuide,
  });

  // Fetch tourist locations
  const { data: touristLocations = [], isLoading: isLoadingTouristLocations } = useQuery<UserLocation[]>({
    queryKey: ['/api/tourists/locations'],
    queryFn: async () => {
      try {
        console.log('Fetching tourist locations for guide...');
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
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!user?.id && user.isGuide,
  });

  // Stats query with mock data
  const { data: stats, isLoading: isLoadingStats } = useQuery<Stats>({
    queryKey: ['/api/guide', user?.id, 'stats'],
    queryFn: async () => {
      return {
        pendingRequests: 3,
        activeConnections: 5,
        completedTours: 12,
        rating: 4.7,
        reviews: 28
      };
    },
    enabled: !!user?.id && user.isGuide,
  });

  // Query for recent connections with mock data
  const { data: recentConnections = [], isLoading: isLoadingConnections } = useQuery<Connection[]>({
    queryKey: ['/api/guide', user?.id, 'recent-connections'],
    queryFn: async (): Promise<Connection[]> => {
      // Mock data for testing
      const mockData: Connection[] = [
        {
          id: "1",
          fromUserId: "tourist1",
          toUserId: user?.id || "",
          status: "pending" as const,
          message: "I'm planning a trip to Mumbai next week. Would love your guidance!",
          tripDetails: "3-day trip to Mumbai, interested in historical sites",
          budget: "₹5000",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          fromUser: {
            id: "tourist1",
            username: "traveler123",
            name: "John Traveler",
            email: "john@example.com",
            role: "tourist",
            isGuide: false
          }
        },
        {
          id: "2",
          fromUserId: "tourist2",
          toUserId: user?.id || "",
          status: "accepted" as const,
          message: "We're a family of 4 visiting Pune. Can you help us explore the city?",
          tripDetails: "5-day trip to Pune, family with children",
          budget: "₹10000",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 43200000).toISOString(),
          fromUser: {
            id: "tourist2",
            username: "explorer456",
            name: "Mary Explorer",
            email: "mary@example.com",
            role: "tourist",
            isGuide: false
          }
        },
        {
          id: "3",
          fromUserId: "tourist3",
          toUserId: user?.id || "",
          status: "accepted" as const,
          message: "Looking for a guide in Aurangabad to visit Ajanta and Ellora caves.",
          tripDetails: "2-day trip to Aurangabad, focus on caves",
          budget: "₹7000",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          fromUser: {
            id: "tourist3",
            username: "hiker789",
            name: "Bob Hiker",
            email: "bob@example.com",
            role: "tourist",
            isGuide: false
          }
        }
      ];
      return mockData;
    },
    enabled: !!user?.id && user.isGuide,
  });

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
      description: "Your location will update every 30 seconds. Tourists can now see your real-time location.",
    });
  }, [getCurrentPosition, locationUpdateInterval, toast]);
  
  // Stop live location tracking
  const stopLiveLocationTracking = useCallback(() => {
    if (locationUpdateInterval) {
      window.clearInterval(locationUpdateInterval);
      setLocationUpdateInterval(null);
      
      toast({
        title: "Live tracking disabled",
        description: "Your location will no longer be updated automatically.",
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
        userType: 'guide'
      });
      
      console.log("Guide location updated on server");
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  // Process connections
  const upcomingConnections = Array.isArray(recentConnections) 
    ? recentConnections
        .filter(conn => conn.status === 'accepted')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3)
    : [];

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const handleLogout = () => {
    // Stop location tracking if active
    if (locationUpdateInterval) {
      stopLiveLocationTracking();
    }
    
    logout();
    setLocation('/login');
  };

  // Create map markers for places and tourists
  const mapMarkers = useMemo(() => {
    const markers = [];
    
    // Add place markers
    if (places && places.length > 0) {
      const placeMarkers = places.map(place => {
        // Create Google Maps directions URL
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
        
        return {
          id: place.id,
          position: {
            lat: parseFloat(place.latitude),
            lng: parseFloat(place.longitude)
          },
          title: place.name,
          popup: `
            <div>
              <div class="font-bold">${place.name}</div>
              <div class="text-sm">${place.description || place.location}</div>
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
          markerType: 'attraction' as const,
          customIcon: true,
          directionsUrl // Store the directions URL in the marker
        };
      });
      
      markers.push(...placeMarkers);
    }
    
    // Add tourist markers with live status
    if (touristLocations && touristLocations.length > 0) {
      const touristMarkers = touristLocations.map(tourist => {
        // Create Google Maps directions URL
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${tourist.latitude},${tourist.longitude}`;
        
        return {
          userId: tourist.userId,
          position: {
            lat: tourist.latitude,
            lng: tourist.longitude
          },
          title: tourist.name || tourist.username,
          popup: `
            <div>
              <div class="font-bold">Tourist: ${tourist.name || tourist.username}</div>
              <div class="mt-1 text-sm flex items-center">
                <span class="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                <span class="text-green-600">Live location</span>
              </div>
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
          markerType: 'user' as const,
          customIcon: true,
          isLive: true, // Mark as live location
          directionsUrl // Store the directions URL in the marker
        };
      });
      
      markers.push(...touristMarkers);
    }
    
    // Add current guide's location if available
    if (currentPosition) {
      markers.push({
        id: 'guide-location',
        position: currentPosition,
        title: 'Your Location',
        popup: 'You are here',
        markerType: 'guide' as const,
        customIcon: true,
        isLive: !!locationUpdateInterval // Only mark as live if tracking is enabled
      } as any); // Use type assertion to avoid TypeScript error
    }
    
    return markers;
  }, [places, touristLocations, currentPosition, locationUpdateInterval]);
  
  // Map center - prioritize guide's location if available
  const mapCenter = useMemo(() => {
    if (currentPosition) {
      return currentPosition;
    }
    
    // Default to Mumbai
    return { lat: 19.076, lng: 72.8777 };
  }, [currentPosition]);

  // Show loading state while authentication is in progress
  if (authLoading) {
    return <div className="h-full flex items-center justify-center">Loading authentication...</div>;
  }
  
  // If no user or not a guide, don't render anything (redirect will happen in useEffect)
  if (!currentUser) {
    return <div className="h-full flex items-center justify-center">Checking authentication...</div>;
  }
  
  if (!currentUser.isGuide) {
    return null;
  }

  return (
    <div className="h-full flex flex-col pb-14">
      {/* Header */}
      <div className="p-4 border-b flex flex-col md:flex-row md:items-center gap-4 bg-white z-10">
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-12 w-12">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.username || 'guide'}`} />
            <AvatarFallback>{currentUser?.name?.[0] || currentUser?.username?.[0] || 'G'}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">{currentUser?.name || currentUser?.username}</h1>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Guide</Badge>
            </div>
            <p className="text-sm text-gray-500">{today}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleLogout} className="h-10" size="sm">Logout</Button>
        </div>
      </div>
      
      {/* Dashboard Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 flex flex-col">
        {/* Guide Stats */}
        <GuideStats stats={stats} isLoading={isLoadingStats} />
        
        {/* Map View */}
        <Card className="mb-6 overflow-hidden relative">
          <CardContent className="p-0">
            <div className="h-[300px]">
              <MapView
                center={mapCenter}
                zoom={currentPosition ? 14 : 12}
                markers={mapMarkers}
                bottomSheetOpen={false}
                enableDragging={true}
                ref={mapRef}
              />
              
              {/* Map Controls - Zoom In/Out */}
              <div className="absolute left-4 top-4 z-20 flex flex-col gap-2">
                <Button
                  className="rounded-full shadow-md h-10 w-10 p-0 bg-white text-black hover:bg-gray-100"
                  variant="outline"
                  onClick={() => {
                    if (mapRef.current) {
                      const currentZoom = mapRef.current.getZoom ? mapRef.current.getZoom() : 14;
                      mapRef.current.setView(
                        [mapCenter.lat, mapCenter.lng], 
                        Math.min((currentZoom || 14) + 1, 18)
                      );
                    }
                  }}
                  size="icon"
                >
                  <span className="text-xl">+</span>
                </Button>
                <Button
                  className="rounded-full shadow-md h-10 w-10 p-0 bg-white text-black hover:bg-gray-100"
                  variant="outline"
                  onClick={() => {
                    if (mapRef.current) {
                      const currentZoom = mapRef.current.getZoom ? mapRef.current.getZoom() : 14;
                      mapRef.current.setView(
                        [mapCenter.lat, mapCenter.lng], 
                        Math.max((currentZoom || 14) - 1, 5)
                      );
                    }
                  }}
                  size="icon"
                >
                  <span className="text-xl">-</span>
                </Button>
              </div>
              
              {/* Floating Action Button - Location tracking */}
              <Button
                className="absolute right-4 bottom-4 z-20 rounded-full shadow-md h-12 w-12 p-0"
                variant={locationUpdateInterval ? "destructive" : "default"}
                onClick={locationUpdateInterval ? stopLiveLocationTracking : startLiveLocationTracking}
                disabled={locationLoading}
                size="icon"
              >
                {locationLoading ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : locationUpdateInterval ? (
                  <X className="h-5 w-5" />
                ) : (
                  <MapPin className="h-5 w-5" />
                )}
              </Button>

              {/* Relocate button to center map on guide */}
              {currentPosition && (
                <Button
                  className="absolute right-4 bottom-20 z-20 rounded-full shadow-md h-12 w-12 p-0 bg-white text-black hover:bg-gray-100"
                  variant="outline"
                  onClick={() => {
                    if (mapRef.current) {
                      mapRef.current.setView([currentPosition.lat, currentPosition.lng], 15);
                    }
                  }}
                  size="icon"
                >
                  <MapPin className="h-5 w-5" />
                </Button>
              )}
              
              {/* Live location status indicator */}
              {locationUpdateInterval && (
                <div className="absolute left-4 bottom-4 z-20 bg-white py-1 px-2 rounded-full shadow-md flex items-center">
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-medium">Live</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Pending Requests */}
        <RequestsPreview
          connections={recentConnections}
          isLoading={isLoadingConnections}
        />
        
        {/* Upcoming Tours */}
        <UpcomingTours
          connections={upcomingConnections}
          isLoading={isLoadingConnections}
        />
      </div>
      
      {/* Bottom Navigation */}
      <GuideBottomNavigation />
    </div>
  );
};

export default GuideDashboard;
