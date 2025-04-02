import { useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BusForm from "@/components/transport/bus-form";

const TransportBooking: React.FC = () => {
  const [_, setLocation] = useLocation();
  
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
        <h2 className="text-xl font-medium">Transport Booking</h2>
      </div>
      
      <Tabs defaultValue="buses">
        <TabsList className="w-full border-b">
          <TabsTrigger value="trains" className="flex-1 py-3">
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
              <path d="M4 11V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
              <rect width="20" height="8" x="2" y="11" rx="2" />
              <path d="M4 19h16" />
              <path d="M9 3v10" />
              <path d="M9 19v2" />
              <path d="M15 19v2" />
              <path d="M15 3v10" />
            </svg>
            Trains
          </TabsTrigger>
          <TabsTrigger value="buses" className="flex-1 py-3">
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
              <path d="M8 6v6" />
              <path d="M15 6v6" />
              <path d="M2 12h19.6" />
              <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5c-.2-.6-.8-1-1.4-1H5c-.6 0-1.2.4-1.4 1l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1 .8 2.8.8 2.8h3" />
              <circle cx="7" cy="18" r="2" />
              <circle cx="17" cy="18" r="2" />
            </svg>
            Buses
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="trains" className="p-4">
          <h3 className="text-lg font-medium mb-1">Search Trains</h3>
          <p className="text-gray-600 mb-4 text-sm">Find train routes across Maharashtra</p>
          
          <div className="text-center py-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-12 h-12 mx-auto text-gray-300 mb-3"
            >
              <path d="M4 11V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
              <rect width="20" height="8" x="2" y="11" rx="2" />
              <path d="M4 19h16" />
              <path d="M9 3v10" />
              <path d="M9 19v2" />
              <path d="M15 19v2" />
              <path d="M15 3v10" />
            </svg>
            <p className="text-gray-600">Train booking coming soon</p>
            <Button
              onClick={() => setLocation('/login')}
              className="mt-4"
              variant="outline"
            >
              Login to Continue
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="buses">
          <BusForm />
        </TabsContent>
      </Tabs>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default TransportBooking;
