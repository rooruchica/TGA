import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import BottomNavigation from "@/components/bottom-navigation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Itinerary } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
// Global auth state is used instead of AuthContext

type Place = { name: string; description: string };

const tripSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  tripType: z.enum(["historical", "food", "adventure", "cultural", "picnic", "nature", "other"]).optional(),
  places: z.array(z.object({
    name: z.string().min(1, "Place name is required"),
    description: z.string().optional(),
  })).optional(),
});

type TripFormValues = z.infer<typeof tripSchema>;

const tripTypes = [
  "historical", "food", "adventure", "cultural", "picnic", "nature", "other"
];

const TripPlanner: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  
  // Get user from window.auth (set in App.tsx)
  const user = (window as any).auth?.user;
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to access trip planner",
        variant: "destructive",
      });
      setLocation('/login');
    }
  }, [user, setLocation, toast]);
  
  const { data: itineraries, isLoading } = useQuery<Itinerary[]>({
    queryKey: ['/api/users', user?.id, 'itineraries'],
    queryFn: async () => {
      const response = await fetch(`/api/users/${user?.id}/itineraries`);
      if (!response.ok) throw new Error('Failed to fetch trips');
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  // Fetch itineraries shared with the user
  const { data: sharedItineraries, isLoading: isLoadingShared } = useQuery<Itinerary[]>({
    queryKey: ['/api/users', user?.id, 'shared-itineraries'],
    queryFn: async () => {
      const response = await fetch(`/api/users/${user?.id}/shared-itineraries`);
      if (!response.ok) throw new Error('Failed to fetch shared itineraries');
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      tripType: "other",
      places: [],
    },
  });
  
  const createTrip = useMutation({
    mutationFn: (data: TripFormValues) => {
      if (!user) throw new Error("User not authenticated");
      
      return apiRequest("POST", "/api/itineraries", {
        ...data, 
        userId: user.id
      });
    },
    onSuccess: () => {
      toast({
        title: "Trip created",
        description: "Your new trip has been created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'itineraries'] });
      setShowForm(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error creating trip",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [newPlace, setNewPlace] = useState<Place>({ name: "", description: "" });
  const [tripType, setTripType] = useState("other");
  // Share dialog state
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [sharingItineraryId, setSharingItineraryId] = useState<string | null>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [connectedGuides, setConnectedGuides] = useState<any[]>([]);
  const [isFetchingConnections, setIsFetchingConnections] = useState(false);
  
  // Fetch connected guides (accepted connections)
  const fetchConnectedGuides = async () => {
    if (!user?.id) return;
    setIsFetchingConnections(true);
    try {
      const response = await fetch(`/api/users/${user.id}/connections?status=accepted`);
      if (!response.ok) throw new Error("Failed to fetch connected guides");
      const connections = await response.json();
      // Tourist is fromUser, guide is toUser
      const guides = connections
        .filter((conn: any) => conn.fromUserId === user.id && conn.toUser?.userType === "guide")
        .map((conn: any) => ({
          id: String(conn.toUser.id),
          name: conn.toUser.fullName || conn.toUser.name || conn.toUser.username || conn.toUser.email || "Unnamed Guide",
        }));
      setConnectedGuides(guides);
    } catch (error) {
      setConnectedGuides([]);
    } finally {
      setIsFetchingConnections(false);
    }
  };
  
  // Add place to itinerary
  const handleAddPlace = () => {
    if (!newPlace.name) return;
    setPlaces([...places, newPlace]);
    setNewPlace({ name: "", description: "" });
    form.setValue("places", [...places, newPlace]);
  };
  
  // Remove place from itinerary
  const handleRemovePlace = (index: number) => {
    const updated = [...places];
    updated.splice(index, 1);
    setPlaces(updated);
    form.setValue("places", updated);
  };
  
  // Share itinerary handler
  const handleShareItinerary = async () => {
    if (!sharingItineraryId || !selectedGuideId) return;
    try {
      const response = await apiRequest("POST", `/api/itineraries/${sharingItineraryId}/share`, {
        recipientUserId: selectedGuideId,
      });
      if (!response.ok) throw new Error("Failed to share itinerary");
      toast({ title: "Itinerary Shared", description: "The itinerary has been shared with your guide." });
      setIsShareDialogOpen(false);
      setSharingItineraryId(null);
      setSelectedGuideId(null);
      // Invalidate shared itineraries query so the list updates
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "shared-itineraries"] });
    } catch (error) {
      toast({ title: "Failed to share itinerary", description: error instanceof Error ? error.message : "An error occurred.", variant: "destructive" });
    }
  };
  
  const onSubmit = (data: TripFormValues) => {
    createTrip.mutate({ ...data, places });
  };

  return (
    <div className="h-full flex flex-col pb-14">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-2xl font-bold font-sans">Trip Planner</h2>
      </div>
      
      {showForm ? (
        <div className="p-4 flex-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Create New Trip</h3>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0" 
              onClick={() => setShowForm(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              <span className="sr-only">Close</span>
            </Button>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <Label>Trip Title</Label>
                    <FormControl>
                      <Input placeholder="e.g. Weekend in Mumbai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <Label>Description (Optional)</Label>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your trip plans..." 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-3">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? (
                                format(new Date(field.value), "dd-MM-yyyy")
                              ) : (
                                <span>Select date</span>
                              )}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="ml-auto h-4 w-4 opacity-50"
                              >
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                <path d="M16 2v4" />
                                <path d="M8 2v4" />
                                <path d="M3 10h18" />
                              </svg>
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Label>End Date (Optional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? (
                                format(new Date(field.value), "dd-MM-yyyy")
                              ) : (
                                <span>Select date</span>
                              )}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="ml-auto h-4 w-4 opacity-50"
                              >
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                <path d="M16 2v4" />
                                <path d="M8 2v4" />
                                <path d="M3 10h18" />
                              </svg>
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const startDate = form.getValues("startDate");
                              return date < new Date() || (startDate && date <= startDate);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <Label>Trip Type</Label>
                <Select value={tripType} onValueChange={setTripType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a trip type" />
                  </SelectTrigger>
                  <SelectContent>
                    {tripTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Places UI */}
              <div className="space-y-2">
                <Label>Add Places</Label>
                <div className="flex gap-2">
                  <Input placeholder="Place name" value={newPlace.name} onChange={e => setNewPlace({ ...newPlace, name: e.target.value })} />
                  <Input placeholder="Description" value={newPlace.description} onChange={e => setNewPlace({ ...newPlace, description: e.target.value })} />
                  <Button type="button" onClick={handleAddPlace}>Add</Button>
                </div>
                {places.length > 0 && (
                  <div className="border rounded-md divide-y mt-2">
                    {places.map((place, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2">
                        <div>
                          <div className="font-medium">{place.name}</div>
                          <div className="text-sm text-gray-500">{place.description}</div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="text-red-500 h-8 w-8 p-0" onClick={() => handleRemovePlace(idx)}>
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-[#DC143C] hover:bg-[#B01030] text-white"
                disabled={createTrip.isPending}
              >
                {createTrip.isPending ? "Creating..." : "Create Trip"}
              </Button>
            </form>
          </Form>
        </div>
      ) : (
        <div className="p-4 flex-1">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Plan a New Trip</h3>
            <p className="text-gray-600 text-sm mb-3">Create and organize your Maharashtra adventure</p>
            <Button 
              className="bg-[#DC143C] hover:bg-[#B01030] text-white flex items-center"
              onClick={() => setShowForm(true)}
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
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Create Trip
            </Button>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Your Saved Attractions</h3>
            <p className="text-gray-600 text-sm mb-3">View and manage places you've bookmarked</p>
            <Button 
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center"
              onClick={() => setLocation('/search')}
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
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
              View Saved Places
            </Button>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Shared With Me</h3>
            <p className="text-gray-600 text-sm mb-3">Itineraries shared with you by guides</p>
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
                  <div key={itinerary.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                    <h4 className="font-medium">{itinerary.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{itinerary.description}</p>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-gray-600">
                        {itinerary.startDate ? format(new Date(itinerary.startDate), "dd MMM yyyy") : ""}
                        {itinerary.endDate ? ` - ${format(new Date(itinerary.endDate), "dd MMM yyyy")}` : ""}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => setLocation(`/itinerary/${itinerary.id}`)}>View Details</Button>
                    </div>
                  </div>
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
                <p className="text-gray-500 text-sm">When a guide shares an itinerary, it will appear here</p>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Upcoming Trips</h3>
            
            {isLoading ? (
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
            ) : itineraries && itineraries.length > 0 ? (
              <div className="space-y-3">
                {itineraries.map((itinerary: Itinerary) => (
                  <div key={itinerary.id} className="bg-white rounded-lg shadow-md p-4">
                    <h4 className="font-medium">{itinerary.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{itinerary.description}</p>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-gray-600">
                        {itinerary.startDate ? format(new Date(itinerary.startDate), "dd MMM yyyy") : ""}
                        {itinerary.endDate ? ` - ${format(new Date(itinerary.endDate), "dd MMM yyyy")}` : ""}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setLocation(`/itinerary/${itinerary.id}`)}>View Details</Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setSharingItineraryId(itinerary.id);
                          setIsShareDialogOpen(true);
                          fetchConnectedGuides();
                        }}>Share</Button>
                      </div>
                    </div>
                  </div>
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
                <p className="text-gray-600">You don't have any upcoming trips</p>
                <p className="text-gray-500 text-sm">Plan your first adventure using the options above</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Share Itinerary Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Itinerary</DialogTitle>
            <DialogDescription>Select a guide to share this itinerary with.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {isFetchingConnections ? (
              <p>Loading connections...</p>
            ) : connectedGuides.length > 0 ? (
              <Select onValueChange={value => setSelectedGuideId(value || null)} value={selectedGuideId || ""}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a guide" />
                </SelectTrigger>
                <SelectContent>
                  {connectedGuides.map((guide) => (
                    <SelectItem key={guide.id} value={guide.id}>
                      {guide.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-gray-500">No connected guides found. You can only share itineraries with guides you are connected to.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleShareItinerary} disabled={!selectedGuideId || isFetchingConnections} className="bg-green-600 hover:bg-green-700">Share Itinerary</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default TripPlanner;
