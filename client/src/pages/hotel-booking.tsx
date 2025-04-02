import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import BottomNavigation from "@/components/bottom-navigation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// App now holds authentication state instead of AuthContext

const hotelBookingSchema = z.object({
  location: z.string().min(1, "Location is required"),
  checkIn: z.date({
    required_error: "Check-in date is required",
  }),
  checkOut: z.date({
    required_error: "Check-out date is required",
  }),
  guests: z.string().min(1, "Number of guests is required"),
  rooms: z.string().min(1, "Number of rooms is required"),
}).refine(data => {
  return data.checkOut > data.checkIn;
}, {
  message: "Check-out date must be after check-in date",
  path: ["checkOut"],
});

type HotelBookingFormValues = z.infer<typeof hotelBookingSchema>;

const HotelBooking: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get user from window.auth (set in App.tsx)
  const user = (window as any).auth?.user;
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to book a hotel",
        variant: "destructive",
      });
      setLocation('/login');
    }
  }, [user, setLocation, toast]);
  
  const form = useForm<HotelBookingFormValues>({
    resolver: zodResolver(hotelBookingSchema),
    defaultValues: {
      location: "Mumbai, Maharashtra",
      guests: "2 Guests",
      rooms: "1 Room",
    },
  });
  
  const onSubmit = async (data: HotelBookingFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to book a hotel",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const bookingData = {
        userId: user.id,
        type: "hotel",
        from: data.location,
        departureDate: data.checkIn,
        returnDate: data.checkOut,
        passengers: parseInt(data.guests.split(' ')[0]),
        roomCount: parseInt(data.rooms.split(' ')[0]),
        bookingDetails: JSON.stringify({
          location: data.location,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          guests: data.guests,
          rooms: data.rooms,
        }),
      };
      
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      
      if (response.ok) {
        toast({
          title: "Booking successful",
          description: "Your hotel booking has been confirmed",
        });
        setLocation("/dashboard");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Booking failed");
      }
    } catch (error) {
      toast({
        title: "Booking failed",
        description: error instanceof Error ? error.message : "An error occurred during booking",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="h-full flex flex-col pb-14">
      {/* Header */}
      <div className="bg-[#DC143C] p-4 flex items-center text-white">
        <button 
          className="mr-2"
          onClick={() => setLocation('/dashboard')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-medium">Hotel Booking</h2>
      </div>
      
      <div className="p-4 flex-1">
        <h3 className="text-xl font-medium mb-1">Find the Perfect Stay</h3>
        <p className="text-gray-600 mb-4 text-sm">Search for hotels in your destination</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <Label>Location</Label>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex space-x-3">
              <FormField
                control={form.control}
                name="checkIn"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Label>Check-in</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? (
                              format(field.value, "dd-MM-yyyy")
                            ) : (
                              <span>dd-mm-yyyy</span>
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
                name="checkOut"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Label>Check-out</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? (
                              format(field.value, "dd-MM-yyyy")
                            ) : (
                              <span>dd-mm-yyyy</span>
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
                            const checkIn = form.getValues("checkIn");
                            return date < new Date() || (checkIn && date <= checkIn);
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
            
            <div className="flex space-x-3">
              <FormField
                control={form.control}
                name="guests"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Label>Guests</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of guests" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1 Guest">1 Guest</SelectItem>
                        <SelectItem value="2 Guests">2 Guests</SelectItem>
                        <SelectItem value="3 Guests">3 Guests</SelectItem>
                        <SelectItem value="4+ Guests">4+ Guests</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rooms"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Label>Rooms</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of rooms" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1 Room">1 Room</SelectItem>
                        <SelectItem value="2 Rooms">2 Rooms</SelectItem>
                        <SelectItem value="3+ Rooms">3+ Rooms</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full py-6 bg-[#DC143C] hover:bg-[#B01030] text-white"
              disabled={isSubmitting}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 mr-2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              {isSubmitting ? "Searching..." : "Search Hotels"}
            </Button>
          </form>
        </Form>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default HotelBooking;
