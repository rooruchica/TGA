import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/bottom-navigation";
import MapView from "@/components/map-view";
import Categories from "@/components/home/categories";
import FeaturedPlaces from "@/components/home/featured-places";
import AvailableGuides from "@/components/home/available-guides";

const Dashboard: React.FC = () => {
  const [_, setLocation] = useLocation();
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
              placeholder="Search locations in Maharashtra" 
              className="w-full pl-9 rounded-full"
              onClick={() => setLocation('/search')}
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
          <ChatAssistant />
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
            <h2 className="text-2xl font-bold font-sans mb-4">Explore Maharashtra</h2>
            
            {/* Categories */}
            <Categories />
            
            {/* Featured Places */}
            <FeaturedPlaces places={places || []} isLoading={isLoadingPlaces} />
            
            {/* Available Guides */}
            <AvailableGuides />
          </div>
        }
      />
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Dashboard;
