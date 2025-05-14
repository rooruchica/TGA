import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getCurrentPosition } from "@/lib/geolocation";
import { fetchApi } from "@/lib/api-client";

// Define guide profile interface
interface GuideProfile {
  id: string;
  userId: string;
  location?: string;
  specialties?: string[];
  experience?: number;
  languages?: string[];
  rating?: number;
  ratingCount?: number;
}

// Define guide interface
interface Guide {
  id: string;
  fullName: string;
  username?: string;
  email?: string;
  phone?: string;
  userType: string;
  imageUrl?: string;
  distance?: number;
  guideProfile?: GuideProfile;
}

export default function AvailableGuides() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [message, setMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [_, setLocation] = useLocation();

  // Try to get user location on component mount
  useEffect(() => {
    async function fetchLocation() {
      try {
        const position = await getCurrentPosition();
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      } catch (error) {
        console.error("Error getting location:", error);
      }
    }
    
    fetchLocation();
  }, []);

  // First try to get nearby guides if we have location
  const { data: nearbyGuides = [] as Guide[], isLoading: isLoadingNearby } = useQuery<Guide[]>({
    queryKey: ['nearby-guides', userLocation],
    queryFn: async () => {
      if (!userLocation) throw new Error('No user location');
      return fetchApi<Guide[]>(`/api/nearby/guides?latitude=${userLocation.lat}&longitude=${userLocation.lng}`);
    },
    enabled: !!userLocation && locationError === null,
    retry: false
  });

  // Fallback to all guides if no location or no nearby guides found
  const { data: allGuides = [] as Guide[], isLoading: isLoadingAll } = useQuery<Guide[]>({
    queryKey: ['guides'],
    queryFn: async () => {
      return fetchApi<Guide[]>('/api/guides');
    },
    enabled: !userLocation || nearbyGuides.length === 0 || locationError !== null
  });

  // Combine results, prioritizing nearby guides
  const guides: Guide[] = nearbyGuides.length > 0 ? nearbyGuides : allGuides;
  const isLoading = isLoadingNearby || isLoadingAll;

  const sendRequest = useMutation({
    mutationFn: async (guideId: string) => {
      // Check if user is logged in
      if (!user) {
        toast({
          title: "Login Required",
          description: "Please log in before requesting a guide",
          variant: "destructive"
        });
        setLocation('/login');
        throw new Error("You must be logged in to request a guide");
      }

      // User has a valid ID
      const fromUserId = user.id.toString();
      const toUserId = guideId.toString();

      // Create the connection request
      const payload = {
        fromUserId,
        toUserId,
        status: 'pending',
        message: message || 'I would like to request your services as a guide.',
        tripDetails: 'Initial tour request',
        budget: '0'
      };

      return fetchApi('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      // Success notification
      toast({
        title: "Request sent!",
        description: "Your request has been sent to the guide.",
      });
      setIsDialogOpen(false);
      setMessage("");
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/users', user.id, 'connections'] });
        queryClient.refetchQueries({ 
          queryKey: ['/api/users', user.id, 'connections'],
          exact: true 
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRequestGuide = (guide: Guide) => {
    // First, make sure user is logged in before proceeding
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in before requesting a guide",
        variant: "destructive"
      });
      setLocation('/login');
      return;
    }
    
    // Prevent users from requesting themselves as a guide
    if (guide.id?.toString() === user?.id?.toString()) {
      toast({
        title: "Cannot connect with yourself",
        description: "You cannot request yourself as a guide.",
        variant: "destructive",
      });
      return;
    }
    
    // Now we can safely open the dialog
    setSelectedGuide(guide);
    setIsDialogOpen(true);
  };

  const handleSendRequest = () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message for the guide",
        variant: "destructive",
      });
      return;
    }
    if (selectedGuide?.id) {
      sendRequest.mutate(selectedGuide.id.toString());
    }
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading guides...</div>;
  }

  if (guides.length === 0) {
    return (
      <div className="text-center p-4">
        <h2 className="text-2xl font-bold mb-2">No Guides Available</h2>
        <p className="text-gray-500">We couldn't find any guides at the moment. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold px-4">
        {nearbyGuides.length > 0 ? 'Guides Near You' : 'Available Guides'}
        {locationError && <span className="text-sm font-normal text-gray-500 ml-2">({locationError})</span>}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {guides.map((guide: Guide) => (
          <Card key={guide.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={guide.imageUrl} />
                  <AvatarFallback>{guide.fullName?.[0] || 'G'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{guide.fullName}</h3>
                  <p className="text-sm text-gray-500">{guide.guideProfile?.location || 'Maharashtra'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-yellow-500">★</span>
                    <span className="text-sm">{guide.guideProfile?.rating || 'New'}</span>
                    {guide.distance && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({Math.round(guide.distance * 10) / 10} km)
                      </span>
                    )}
                  </div>
                </div>
                {guide.id?.toString() !== user?.id?.toString() ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRequestGuide(guide)}
                  >
                    Request Guide
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled
                    className="opacity-50"
                  >
                    Your Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogTitle>Request Guide</DialogTitle>
          <DialogDescription>
            Send a request to {selectedGuide?.fullName}. Once they accept, you'll be able to communicate directly.
          </DialogDescription>
          
          <div className="mt-4">
            <Textarea
              placeholder="Write a message to the guide describing your requirements..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendRequest} disabled={sendRequest.isPending}>
              {sendRequest.isPending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

