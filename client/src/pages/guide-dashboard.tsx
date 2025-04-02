import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/guide/bottom-navigation";
import MapView from "@/components/map-view";
import GuideStats from "@/components/guide/guide-stats";
import RequestsPreview from "@/components/guide/requests-preview";
import UpcomingTours from "@/components/guide/upcoming-tours";
import { useAuth } from "@/lib/AuthContext";

const GuideDashboard: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const [bottomSheetOpen, setBottomSheetOpen] = useState(true);
  
  const { data: places, isLoading: isLoadingPlaces } = useQuery({
    queryKey: ['/api/places'],
  });
  
  return (
    <div className="h-full flex flex-col pb-14">
      {/* Header */}
      <div className="relative z-10 bg-white shadow-md">
        <div className="flex items-center p-3 bg-white">
          <button className="p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-gray-600"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
          <div className="flex-1 mx-2 relative">
            <Input 
              type="text" 
              placeholder="Find locations to guide" 
              className="w-full pl-9 rounded-full"
              onClick={() => setLocation('/guide-search')}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 absolute left-3 top-3 text-gray-500"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <button 
            className="w-10 h-10 flex items-center justify-center bg-[#DC143C] rounded-full text-white"
            onClick={() => setLocation('/guide-connections')}
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Map View */}
      <MapView
        bottomSheetOpen={bottomSheetOpen}
        onBottomSheetOpenChange={setBottomSheetOpen}
        markers={places?.map(place => ({
          position: { lat: parseFloat(place.latitude), lng: parseFloat(place.longitude) },
          title: place.name,
          popup: `<b>${place.name}</b><br>${place.location}`,
        }))}
        bottomSheetContent={
          <div className="p-4 pb-16">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-[#DC143C] flex items-center justify-center text-white mr-3">
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
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold">Welcome, {user?.fullName.split(' ')[0]}</h2>
                <p className="text-sm text-gray-500">Guide Dashboard</p>
              </div>
            </div>
            
            {/* Guide Stats */}
            <GuideStats />
            
            {/* Requests Preview */}
            <RequestsPreview />
            
            {/* Upcoming Tours */}
            <UpcomingTours />
          </div>
        }
      />
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default GuideDashboard;