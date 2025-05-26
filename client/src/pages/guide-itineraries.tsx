import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import GuideBottomNavigation from "@/components/guide/bottom-navigation";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2 } from 'lucide-react';

// Define Itinerary type
interface Itinerary {
  id?: string;
  _id?: string;
  userId: string;
  title: string;
  description: string;
  startDate?: string | Date;
  endDate?: string | Date;
  places?: any[];
  tripType?: 'historical' | 'food' | 'adventure' | 'cultural' | 'picnic' | 'nature' | 'other';
}

// Define ConnectedUser type (simplified for now)
interface ConnectedUser {
  id: string; // User ID of the tourist
  name: string; // Name of the tourist
  // Potentially other details like profile picture, connection ID etc.
}

// Helper function to get trip type badge class based on type
const getTripTypeBadgeClass = (tripType?: Itinerary['tripType']) => {
  switch(tripType) {
    case 'historical':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'food':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'adventure':
      return 'bg-lime-50 text-lime-700 border-lime-200';
    case 'cultural':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'picnic':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'nature':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

// Format trip type for display
const formatTripType = (tripType?: Itinerary['tripType']) => {
  if (!tripType) return 'Other';
  return tripType.charAt(0).toUpperCase() + tripType.slice(1);
};

const GuideItineraries: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreatingItinerary, setIsCreatingItinerary] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itineraryToDelete, setItineraryToDelete] = useState<string | null>(null);
  const [newItinerary, setNewItinerary] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    tripType: "other" as Itinerary['tripType'],
    places: [] as Array<{name: string; description: string}>
  });
  const [newPlace, setNewPlace] = useState({name: "", description: ""});

  // State for Share Itinerary Dialog
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [sharingItineraryId, setSharingItineraryId] = useState<string | null>(null);
  const [connectedTourists, setConnectedTourists] = useState<ConnectedUser[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [isFetchingConnections, setIsFetchingConnections] = useState(false);
  
  const user = (window as any).auth?.user;
  
  // Query for guide's itineraries
  const { data: itineraries, isLoading } = useQuery<Itinerary[]>({
    queryKey: ['itineraries', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log("Fetching itineraries for user ID:", user.id);
      try {
        const response = await fetch(`/api/users/${user.id}/itineraries`);
        if (!response.ok) {
          throw new Error('Failed to fetch itineraries');
        }
        const data = await response.json();
        console.log("Fetched itineraries:", data);
        return data || [];
      } catch (error) {
        console.error("Error fetching itineraries:", error);
        return [];
      }
    },
    enabled: !!user?.id
  });
  
  // Fetch itineraries shared with the guide
  const { data: sharedItineraries, isLoading: isLoadingShared } = useQuery<Itinerary[]>({
    queryKey: ["/api/users", user?.id, "shared-itineraries"],
    queryFn: async () => {
      const response = await fetch(`/api/users/${user?.id}/shared-itineraries`);
      if (!response.ok) throw new Error("Failed to fetch shared itineraries");
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  // Handle creating a new itinerary
  const handleCreateItinerary = async () => {
    try {
      // Get current user from window.auth (set in App.tsx)
      const user = (window as any).auth?.user;
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please login to create an itinerary",
          variant: "destructive",
        });
        return;
      }
      
      if (!newItinerary.title || !newItinerary.startDate) {
        toast({
          title: "Incomplete information",
          description: "Please provide at least a title and start date.",
          variant: "destructive",
        });
        return;
      }
      
      // Include userId in the itinerary data
      const itineraryData = {
        ...newItinerary,
        userId: user.id
      };
      
      // Make the API request with complete data
      const response = await apiRequest('POST', '/api/itineraries', itineraryData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create itinerary");
      }
      
      // Reset form and close dialog
      setNewItinerary({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        tripType: "other" as Itinerary['tripType'],
        places: []
      });
      setIsCreatingItinerary(false);
      
      toast({
        title: "Itinerary created",
        description: "Your new itinerary has been created successfully.",
      });
      
      // Refresh itineraries data
      queryClient.invalidateQueries({ queryKey: ['itineraries', user.id] });
    } catch (error) {
      console.error("Error creating itinerary:", error);
      toast({
        title: "Failed to create itinerary",
        description: error instanceof Error ? error.message : "There was an error creating your itinerary. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch connected tourists
  const fetchConnectedTourists = async () => {
    if (!user?.id) return;
    setIsFetchingConnections(true);
    try {
      console.log("Fetching accepted connections for guide ID:", user.id);
      const response = await fetch(`/api/users/${user.id}/connections?status=accepted`);
      if (!response.ok) {
        throw new Error('Failed to fetch connected tourists');
      }
      const connections: any[] = await response.json();
      
      // Filter for connections where the current user is the guide (toUser)
      // and the other user is a tourist (fromUser)
      const tourists = connections
        .filter(conn => conn.toUserId === user.id && conn.fromUser?.userType === 'tourist')
        .map(conn => ({
          id: String(conn.fromUser.id),
          name: conn.fromUser.fullName || conn.fromUser.name || conn.fromUser.username || conn.fromUser.email || 'Unnamed Tourist',
        }));
      setConnectedTourists(tourists);
    } catch (error) {
      console.error("Error fetching connected tourists:", error);
      toast({
        title: "Failed to fetch connections",
        description: "Could not load your connected tourists. Please try again.",
        variant: "destructive",
      });
      setConnectedTourists([]);
    } finally {
      setIsFetchingConnections(false);
    }
  };

  // Handle sharing an itinerary
  const handleShareItinerary = async () => {
    if (!sharingItineraryId || !selectedRecipientId) {
      toast({
        title: "Selection missing",
        description: "Please select an itinerary and a recipient.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`Sharing itinerary ${sharingItineraryId} with ${selectedRecipientId}`);
      const response = await apiRequest('POST', `/api/itineraries/${sharingItineraryId}/share`, {
        recipientUserId: selectedRecipientId,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to share itinerary");
      }

      toast({
        title: "Itinerary Shared",
        description: "The itinerary has been successfully shared.",
      });
      setIsShareDialogOpen(false);
      setSharingItineraryId(null);
      setSelectedRecipientId(null);
      // Invalidate shared itineraries query so the list updates
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "shared-itineraries"] });
    } catch (error) {
      console.error("Error sharing itinerary:", error);
      toast({
        title: "Failed to share itinerary",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };
  
  // Delete itinerary handler
  const handleDeleteItinerary = async () => {
    if (!itineraryToDelete) return;
    
    try {
      const response = await apiRequest('DELETE', `/api/itineraries/${itineraryToDelete}`, null);
      
      if (!response.ok) {
        throw new Error('Failed to delete itinerary');
      }
      
      toast({
        title: "Itinerary deleted",
        description: "Your itinerary has been deleted successfully.",
      });
      
      // Refresh itineraries data
      queryClient.invalidateQueries({ queryKey: ['itineraries', user.id] });
      setIsDeleteDialogOpen(false);
      setItineraryToDelete(null);
    } catch (error) {
      console.error("Error deleting itinerary:", error);
      toast({
        title: "Failed to delete itinerary",
        description: error instanceof Error ? error.message : "There was an error deleting your itinerary. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Add place to new itinerary
  const handleAddPlace = () => {
    if (!newPlace.name) return;
    
    setNewItinerary({
      ...newItinerary,
      places: [...newItinerary.places, newPlace]
    });
    setNewPlace({name: "", description: ""});
  };
  
  // Remove place from new itinerary
  const handleRemovePlace = (index: number) => {
    const places = [...newItinerary.places];
    places.splice(index, 1);
    setNewItinerary({...newItinerary, places});
  };
  
  // Component for empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-8">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-12 h-12 text-gray-300 mb-4"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 3v18" />
        <path d="M13 13h4" />
        <path d="M13 7h4" />
      </svg>
      <p className="text-gray-500 text-center">No itineraries yet</p>
      <p className="text-gray-400 text-sm text-center mt-1 mb-4">
        Create your first itinerary to share with tourists
      </p>
      <Button 
        className="bg-[#DC143C] hover:bg-[#B01030]"
        onClick={() => setIsCreatingItinerary(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 mr-2"
        >
          <path d="M8 12h8" />
          <path d="M12 8v8" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        Create Itinerary
      </Button>
    </div>
  );
  
  return (
    <div className="flex flex-col h-full pb-16">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Itineraries</h1>
          <p className="text-gray-500 text-sm">Manage your tour itineraries</p>
        </div>
        <Button 
          className="bg-[#DC143C] hover:bg-[#B01030]"
          onClick={() => setIsCreatingItinerary(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 mr-2"
          >
            <path d="M8 12h8" />
            <path d="M12 8v8" />
          </svg>
          Create
        </Button>
      </div>
      
      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
            <TabsTrigger value="draft" className="flex-1">Drafts</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <TabsContent value="all" className="mt-0 space-y-4">
            {isLoading ? (
              <div className="p-4 text-center">Loading itineraries...</div>
            ) : !itineraries || itineraries.length === 0 ? (
              <EmptyState />
            ) : (
              itineraries.map((itinerary: Itinerary) => {
                console.log("Rendering itinerary:", itinerary);
                // Use MongoDB _id as fallback if id is not present
                const itemId = itinerary.id || itinerary._id;
                return (
                  <Card key={itemId} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-lg">{itinerary.title}</h3>
                        <div className="flex gap-2">
                          <Badge variant="outline" className={
                            getTripTypeBadgeClass(itinerary.tripType)
                          }>
                            {formatTripType(itinerary.tripType)}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-gray-500 text-sm mt-1">
                        {itinerary.description || "No description provided"}
                      </p>
                      
                      <div className="flex items-center mt-3 text-sm text-gray-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 mr-1"
                        >
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <line x1="3" y1="9" x2="21" y2="9" />
                          <line x1="9" y1="21" x2="9" y2="9" />
                        </svg>
                        <span>
                          {itinerary.startDate ? new Date(itinerary.startDate).toLocaleDateString() : "No start date"} 
                          {itinerary.endDate ? ` - ${new Date(itinerary.endDate).toLocaleDateString()}` : ""}
                        </span>
                      </div>
                      
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 mr-1"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{itinerary.places?.length || 0} Places</span>
                      </div>
                    </CardContent>
                    <CardFooter className="px-4 py-3 bg-gray-50 flex justify-between">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-gray-500"
                          onClick={() => {
                            setLocation(`/guide-itineraries/${itemId}`);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4 mr-1"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItineraryToDelete(itemId || "");
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4 mr-1"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                          Delete
                        </Button>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-blue-600 border-blue-200 bg-red-50 hover:bg-red-100"
                        onClick={() => setLocation(`/itinerary/${itemId}`)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 mr-1"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSharingItineraryId(itemId || "");
                          fetchConnectedTourists(); // Fetch connections when dialog is about to open
                          setIsShareDialogOpen(true);
                          setSelectedRecipientId(null); // Reset selection
                        }}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="w-4 h-4 mr-1"
                        >
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                          <polyline points="16 6 12 2 8 6" />
                          <Share2 className="w-4 h-4 mr-1" />
                        </svg>
                        Share
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </TabsContent>
          
          {/* Other tabs content would follow the same pattern */}
          <TabsContent value="active" className="mt-0">
            {/* Content for active itineraries */}
          </TabsContent>
          
          <TabsContent value="draft" className="mt-0">
            {/* Content for draft itineraries */}
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Itinerary</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this itinerary? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setItineraryToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteItinerary}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Itinerary Dialog */}
      <Dialog open={isCreatingItinerary} onOpenChange={setIsCreatingItinerary}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Itinerary</DialogTitle>
            <DialogDescription>
              Create a new itinerary for tourists visiting Maharashtra.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                placeholder="e.g., 3-Day Mumbai Experience" 
                value={newItinerary.title}
                onChange={(e) => setNewItinerary({...newItinerary, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Provide a brief description of this itinerary" 
                rows={3}
                value={newItinerary.description}
                onChange={(e) => setNewItinerary({...newItinerary, description: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tripType">Trip Type</Label>
              <select
                id="tripType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newItinerary.tripType}
                onChange={(e) => setNewItinerary({...newItinerary, tripType: e.target.value as Itinerary['tripType']})}
              >
                <option value="other">Select a trip type</option>
                <option value="historical">Historical</option>
                <option value="food">Food</option>
                <option value="adventure">Adventure</option>
                <option value="cultural">Cultural</option>
                <option value="picnic">Picnic</option>
                <option value="nature">Nature</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input 
                  id="startDate" 
                  type="date" 
                  value={newItinerary.startDate}
                  onChange={(e) => setNewItinerary({...newItinerary, startDate: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input 
                  id="endDate" 
                  type="date" 
                  value={newItinerary.endDate}
                  onChange={(e) => setNewItinerary({...newItinerary, endDate: e.target.value})}
                />
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-2">Add Places</h3>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="placeName">Place Name</Label>
                    <Input 
                      id="placeName" 
                      placeholder="e.g., Gateway of India" 
                      value={newPlace.name}
                      onChange={(e) => setNewPlace({...newPlace, name: e.target.value})}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="placeDescription">Description</Label>
                    <Input 
                      id="placeDescription" 
                      placeholder="Brief description" 
                      value={newPlace.description}
                      onChange={(e) => setNewPlace({...newPlace, description: e.target.value})}
                    />
                  </div>
                  <Button 
                    type="button"
                    size="sm"
                    onClick={handleAddPlace}
                  >
                    Add
                  </Button>
                </div>
              </div>
              
              {newItinerary.places.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium">Added Places:</h4>
                  <div className="border rounded-md divide-y">
                    {newItinerary.places.map((place, index) => (
                      <div key={index} className="flex justify-between items-center p-3">
                        <div>
                          <div className="font-medium">{place.name}</div>
                          <div className="text-sm text-gray-500">{place.description}</div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 h-8 w-8 p-0"
                          onClick={() => handleRemovePlace(index)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingItinerary(false)}>
              Cancel
            </Button>
            <Button className="bg-[#DC143C] hover:bg-[#B01030]" onClick={handleCreateItinerary}>
              Create Itinerary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <GuideBottomNavigation />

      {/* Share Itinerary Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Itinerary</DialogTitle>
            <DialogDescription>
              Select a tourist to share this itinerary with.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {isFetchingConnections ? (
              <p>Loading connections...</p>
            ) : connectedTourists.length > 0 ? (
              <Select onValueChange={(value) => setSelectedRecipientId(value)} value={selectedRecipientId || ""}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a tourist" />
                </SelectTrigger>
                <SelectContent>
                  {connectedTourists.map((tourist) => (
                    <SelectItem key={tourist.id} value={tourist.id}>
                      {tourist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-gray-500">No connected tourists found. You can only share itineraries with tourists you are connected to.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleShareItinerary} 
              disabled={!selectedRecipientId || isFetchingConnections}
              className="bg-green-600 hover:bg-green-700"
            >
              Share Itinerary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shared With Me Section */}
      <div className="px-4 pt-2">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Shared With Me</h3>
          <p className="text-gray-600 text-sm mb-3">Itineraries shared with you by tourists</p>
          {isLoadingShared ? (
            <div className="text-center py-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 animate-spin mx-auto text-[#DC143C]"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
          ) : sharedItineraries && sharedItineraries.length > 0 ? (
            <div className="space-y-3">
              {sharedItineraries.map((itinerary: Itinerary) => (
                <Card key={itinerary.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                  <CardContent>
                    <h4 className="font-medium">{itinerary.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{itinerary.description}</p>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-gray-600">
                        {itinerary.startDate ? new Date(itinerary.startDate).toLocaleDateString() : ""}
                        {itinerary.endDate ? ` - ${new Date(itinerary.endDate).toLocaleDateString()}` : ""}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => setLocation(`/itinerary/${itinerary.id}`)}>View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-12 h-12 mx-auto"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <path d="M16 2v4" />
                  <path d="M8 2v4" />
                  <path d="M3 10h18" />
                </svg>
              </div>
              <p className="text-gray-600">No itineraries have been shared with you yet</p>
              <p className="text-gray-500 text-sm">When a tourist shares an itinerary, it will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuideItineraries;