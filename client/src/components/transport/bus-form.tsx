import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { POPULAR_ROUTES } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";

const busBookingSchema = z.object({
  from: z.string().min(1, "Origin is required"),
  to: z.string().min(1, "Destination is required"),
  departureDate: z.date({
    required_error: "Departure date is required",
  }),
  returnDate: z.date().optional(),
  passengers: z.string().min(1, "Number of passengers is required"),
  busType: z.enum(["all", "ac", "sleeper"], {
    required_error: "Bus type is required",
  }),
});

type BusBookingFormValues = z.infer<typeof busBookingSchema>;

const BusForm: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<BusBookingFormValues>({
    resolver: zodResolver(busBookingSchema),
    defaultValues: {
      from: "Mumbai",
      to: "Pune",
      passengers: "1 Passenger",
      busType: "all",
    },
  });
  
  const onSubmit = async (data: BusBookingFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (!user) {
        setLocation('/login');
        return;
      }
    
    try {
      setIsSubmitting(true);
      
      const bookingData = {
        userId: user.id,
        type: "transport",
        from: data.from,
        to: data.to,
        departureDate: data.departureDate,
        returnDate: data.returnDate,
        passengers: parseInt(data.passengers.split(' ')[0]),
        bookingDetails: JSON.stringify({
          busType: data.busType,
          roundTrip: !!data.returnDate,
        }),
      };
      
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      
      if (response.ok) {
        toast({
          title: "Booking successful",
          description: "Your bus ticket has been booked",
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
    <div className="p-4">
      <h3 className="text-lg font-medium mb-1">Search Buses</h3>
      <p className="text-gray-600 mb-4 text-sm">Find the best travel options</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="from"
            render={({ field }) => (
              <FormItem>
                <Label>From</Label>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select origin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Mumbai">Mumbai</SelectItem>
                    <SelectItem value="Pune">Pune</SelectItem>
                    <SelectItem value="Nashik">Nashik</SelectItem>
                    <SelectItem value="Aurangabad">Aurangabad</SelectItem>
                    <SelectItem value="Kolhapur">Kolhapur</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="to"
            render={({ field }) => (
              <FormItem>
                <Label>To</Label>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Mumbai">Mumbai</SelectItem>
                    <SelectItem value="Pune">Pune</SelectItem>
                    <SelectItem value="Nashik">Nashik</SelectItem>
                    <SelectItem value="Aurangabad">Aurangabad</SelectItem>
                    <SelectItem value="Kolhapur">Kolhapur</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex space-x-3">
            <FormField
              control={form.control}
              name="departureDate"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <Label>Departure Date</Label>
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
              name="returnDate"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <Label>Return Date (Optional)</Label>
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
                          const departureDate = form.getValues("departureDate");
                          return date < new Date() || (departureDate && date <= departureDate);
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
          
          <FormField
            control={form.control}
            name="passengers"
            render={({ field }) => (
              <FormItem>
                <Label>Passengers</Label>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select number of passengers" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1 Passenger">1 Passenger</SelectItem>
                    <SelectItem value="2 Passengers">2 Passengers</SelectItem>
                    <SelectItem value="3 Passengers">3 Passengers</SelectItem>
                    <SelectItem value="4+ Passengers">4+ Passengers</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="busType"
            render={({ field }) => (
              <FormItem>
                <Label>Bus Type</Label>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all" className="cursor-pointer font-normal">All Types</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="ac" id="ac" />
                      <Label htmlFor="ac" className="cursor-pointer font-normal">AC</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="sleeper" id="sleeper" />
                      <Label htmlFor="sleeper" className="cursor-pointer font-normal">Sleeper</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
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
            {isSubmitting ? "Searching..." : "Search Buses"}
          </Button>
        </form>
      </Form>
      
      <div className="mt-6">
        <h4 className="text-lg font-medium mb-3">Popular Routes</h4>
        <div className="grid grid-cols-2 gap-2">
          {POPULAR_ROUTES.map((route, index) => (
            <button 
              key={index} 
              className="text-sm text-gray-700 py-2 hover:text-[#DC143C] text-left"
              onClick={() => {
                form.setValue("from", route.from);
                form.setValue("to", route.to);
              }}
            >
              {route.from} — {route.to}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusForm;
