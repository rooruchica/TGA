import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LogOut, Mail, Phone, MapPin, Star, Languages, Medal, Clock, Users, Edit, Eye, Briefcase, MessageCircle, Loader } from "lucide-react";

// Define user interface based on auth context
interface User {
  id: number | string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isGuide: boolean;
  fullName?: string; // Added to fix type errors
}

interface GuideProfile {
  id: string;
  userId: string;
  location: string;
  specialties: string[];
  languages: string[];
  experience: number;
  rating: number;
  bio: string;
}

// Define a component for the live map
const LiveLocationMap = ({ position }: { position: { lat: number, lng: number } }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Load the leaflet CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
    
    // Check if leaflet is already loaded
    if (!(window as any).L) {
      // Load leaflet script
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }
    
    function initMap() {
      const L = (window as any).L;
      
      // Clear the map container if it already has a map
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
      }
      
      // Initialize the map
      const map = L.map(mapRef.current).setView([position.lat, position.lng], 13);
      
      // Add the OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      
      // Add a marker for the current position
      const marker = L.marker([position.lat, position.lng]).addTo(map)
        .bindPopup('Your current location')
        .openPopup();
      
      // Add a circle to show accuracy (optional)
      L.circle([position.lat, position.lng], {
        color: 'blue',
        fillColor: '#30c',
        fillOpacity: 0.2,
        radius: 300 // 300 meters radius
      }).addTo(map);
      
      // Ensure the map renders correctly by triggering a resize
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
    
    return () => {
      // Cleanup if needed
    };
  }, [position]);
  
  return (
    <div ref={mapRef} className="w-full h-64 rounded-md overflow-hidden border border-gray-200 mt-2"></div>
  );
};

const GuideProfile = () => {
  const [_, setLocation] = useLocation();
  const { user, isLoading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewMode, setPreviewMode] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{lat: number, lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationUpdateInterval, setLocationUpdateInterval] = useState<number | null>(null);
  
  // Get user's current location
  const getCurrentPosition = () => {
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
        
        // Reverse geocode to get readable address (simplified version)
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.display_name) {
              const locationString = data.display_name.split(',').slice(0, 3).join(', ');
              setFormData(prev => ({ ...prev, location: locationString }));
              
              // Update user location on server (if implemented)
              updateUserLocation(latitude, longitude, locationString);
            }
          })
          .catch(err => console.error("Error geocoding location:", err))
          .finally(() => setLocationLoading(false));
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
  };
  
  // Start interval to continuously update location
  const startLiveLocationTracking = () => {
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
          updateUserLocation(latitude, longitude, formData.location);
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
  };
  
  // Stop live location tracking
  const stopLiveLocationTracking = () => {
    if (locationUpdateInterval) {
      window.clearInterval(locationUpdateInterval);
      setLocationUpdateInterval(null);
      
      toast({
        title: "Live tracking disabled",
        description: "Your location will no longer be updated automatically",
      });
    }
  };
  
  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (locationUpdateInterval) {
        window.clearInterval(locationUpdateInterval);
      }
    };
  }, [locationUpdateInterval]);
  
  // Update user location on server
  const updateUserLocation = async (lat: number, lng: number, locationName: string) => {
    if (!user?.id) return;
    
    try {
      const response = await apiRequest("POST", "/api/user/location", {
        userId: user.id,
        latitude: lat.toString(),
        longitude: lng.toString(),
        locationName
      });
      
      if (!response.ok) {
        throw new Error("Failed to update location on server");
      }
      
      console.log("Location updated on server");
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };
  
  // Authentication check with loading state
  useEffect(() => {
    if (!authLoading) {
      // First try to get user from context
      let currentUser = user;
      
      // If no user in context, check window.auth as fallback
      if (!currentUser && (window as any).auth?.user) {
        console.log("Using window.auth fallback:", (window as any).auth.user);
        currentUser = (window as any).auth.user;
      }
      
      if (!currentUser) {
        console.log("No user found, redirecting to login");
        toast({
          title: "Authentication required",
          description: "Please login to access guide profile",
          variant: "destructive",
        });
        setLocation('/login');
        return;
      }
      
      if (!currentUser.isGuide) {
        console.log("User is not a guide, redirecting to dashboard");
        toast({
          title: "Access denied",
          description: "This page is only for guides",
          variant: "destructive",
        });
        setLocation('/dashboard');
        return;
      }
    }
  }, [user, authLoading, setLocation, toast]);

  const [formData, setFormData] = useState({
    location: "",
    specialties: [] as string[],
    languages: [] as string[],
    experience: 0,
    bio: "",
  });

  // Fetch guide profile
  const { data: profile, isLoading } = useQuery<GuideProfile>({
    queryKey: ['/api/guide', user?.id, 'profile'],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/guide/${user?.id}/profile`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch statistics (mock data for now)
  const { data: stats } = useQuery({
    queryKey: ['/api/guide', user?.id, 'stats'],
    queryFn: async () => {
      // In a real app, this would fetch from the server
      return {
        totalConnections: 12,
        pendingRequests: 3,
        upcomingTours: 2,
        completedTours: 8,
        averageRating: profile?.rating || 4.5
      };
    },
    enabled: !!user?.id,
  });

  // Update form data when profile is loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        location: profile.location || "",
        specialties: profile.specialties || [],
        languages: profile.languages || [],
        experience: profile.experience || 0,
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("PATCH", `/api/guide/${user?.id}/profile`, data);
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your guide profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/guide', user?.id, 'profile'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  const ProfileViewer = () => (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">Guide Profile</CardTitle>
          <CardDescription>How tourists will see your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-3">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'default'}`} />
                <AvatarFallback>{user?.name?.[0] || user?.username?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex items-center mb-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-semibold">{profile?.rating || 4.5}</span>
              </div>
              <div className="text-sm text-center text-gray-500">Guide in Maharashtra</div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-1">{user?.name || user?.username}</h3>
              <div className="flex items-center mb-3 text-gray-600">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{formData.location || "Maharashtra, India"}</span>
                {locationUpdateInterval && (
                  <Badge variant="outline" className="ml-2 bg-green-100 border-green-300 text-green-800">
                    <span className="mr-1 w-2 h-2 bg-green-500 inline-block rounded-full animate-pulse"></span>
                    Live
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-500">Experience</div>
                    <div className="font-medium">{formData.experience} Years</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Languages className="w-5 h-5 mr-2 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-500">Languages</div>
                    <div className="font-medium">
                      {formData.languages.length > 0 
                        ? formData.languages.join(", ") 
                        : "English, Hindi"}
                    </div>
                  </div>
                </div>
              </div>
              
              <h4 className="font-semibold mb-2">Specialties</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.specialties.length > 0 ? (
                  formData.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">{specialty}</Badge>
                  ))
                ) : (
                  <>
                    <Badge variant="secondary">Historical Sites</Badge>
                    <Badge variant="secondary">Cultural Tours</Badge>
                    <Badge variant="secondary">Local Cuisine</Badge>
                  </>
                )}
              </div>
              
              <h4 className="font-semibold mb-2">About Me</h4>
              <p className="text-gray-700">
                {formData.bio || "I'm a passionate guide who loves showing tourists the beauty and culture of Maharashtra. I specialize in creating memorable experiences for visitors."}
              </p>
              
              {/* Live Location Map (if available) */}
              {currentPosition && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Current Location
                    {locationUpdateInterval && (
                      <Badge variant="outline" className="ml-2 bg-green-100 border-green-300 text-green-800">
                        <span className="mr-1 w-2 h-2 bg-green-500 inline-block rounded-full animate-pulse"></span>
                        Live
                      </Badge>
                    )}
                  </h4>
                  <LiveLocationMap position={currentPosition} />
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => setPreviewMode(false)} className="w-full">
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  return (
    <Layout>
      <div className="h-full flex flex-col pb-14">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Guide Profile</h2>
          <div className="flex items-center space-x-2">
            <Switch 
              id="preview-mode" 
              checked={previewMode}
              onCheckedChange={setPreviewMode}
            />
            <Label htmlFor="preview-mode">
              {previewMode ? (
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  Preview Mode
                </div>
              ) : (
                <div className="flex items-center">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit Mode
                </div>
              )}
            </Label>
          </div>
        </div>

        {/* Profile Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* User Info Card */}
          <Card className="mb-6">
            <div className="p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'default'}`} />
                  <AvatarFallback>{user?.name?.[0] || user?.username?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{user?.name || user?.username}</h3>
                  <p className="text-sm text-gray-500">@{user?.username}</p>
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-1" />
                    {user?.email}
                  </div>
                  {user?.phone && (
                    <div className="flex items-center mt-1 text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-1" />
                      {user.phone}
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 md:self-start"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <Users className="h-8 w-8 text-blue-500 mb-2" />
                <p className="text-lg font-bold">{stats?.totalConnections || 0}</p>
                <p className="text-xs text-gray-500">Tourist Connections</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <MessageCircle className="h-8 w-8 text-yellow-500 mb-2" />
                <p className="text-lg font-bold">{stats?.pendingRequests || 0}</p>
                <p className="text-xs text-gray-500">Pending Requests</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <Clock className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-lg font-bold">{stats?.upcomingTours || 0}</p>
                <p className="text-xs text-gray-500">Upcoming Tours</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <Medal className="h-8 w-8 text-purple-500 mb-2" />
                <p className="text-lg font-bold">{stats?.completedTours || 0}</p>
                <p className="text-xs text-gray-500">Completed Tours</p>
              </CardContent>
            </Card>
          </div>

          {previewMode ? (
            <ProfileViewer />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter your location"
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={locationUpdateInterval ? stopLiveLocationTracking : startLiveLocationTracking}
                    disabled={locationLoading}
                    className={`whitespace-nowrap ${locationUpdateInterval ? 'bg-red-50 text-red-600 hover:bg-red-100' : ''}`}
                  >
                    {locationLoading ? (
                      <div className="flex items-center">
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </div>
                    ) : locationUpdateInterval ? (
                      <div className="flex items-center">
                        <span className="mr-1 w-2 h-2 bg-red-500 inline-block rounded-full"></span>
                        Stop Live Tracking
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Start Live Tracking
                      </div>
                    )}
                  </Button>
                </div>
                
                {/* Live Location Map */}
                {currentPosition && (
                  <div className="mt-3">
                    <div className="mb-2 text-sm flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-gray-600" />
                      <span className="text-gray-700">
                        Current coordinates: {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
                      </span>
                      {locationUpdateInterval && (
                        <Badge variant="outline" className="ml-2 bg-green-100 border-green-300 text-green-800">
                          <span className="mr-1 w-2 h-2 bg-green-500 inline-block rounded-full animate-pulse"></span>
                          Live
                        </Badge>
                      )}
                    </div>
                    <LiveLocationMap position={currentPosition} />
                  </div>
                )}
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience
                </label>
                <Input
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) })}
                  placeholder="Enter years of experience"
                />
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialties (comma-separated)
                </label>
                <Input
                  value={formData.specialties.join(", ")}
                  onChange={(e) => setFormData({
                    ...formData,
                    specialties: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="e.g., Historical Tours, Adventure Tours, Cultural Tours"
                />
                <div className="mt-2 text-sm text-gray-500">
                  Add the types of tours and experiences you specialize in
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Languages (comma-separated)
                </label>
                <Input
                  value={formData.languages.join(", ")}
                  onChange={(e) => setFormData({
                    ...formData,
                    languages: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="e.g., English, Hindi, Marathi"
                />
                <div className="mt-2 text-sm text-gray-500">
                  List languages you speak fluently with tourists
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell tourists about yourself, your background, experience, and what makes your tours special..."
                  rows={6}
                />
                <div className="mt-2 text-sm text-gray-500">
                  Write a compelling bio to attract tourists (500 characters max)
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default GuideProfile;
