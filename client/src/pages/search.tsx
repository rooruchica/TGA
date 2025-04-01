import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNavigation from "@/components/bottom-navigation";
import MapView from "@/components/map-view";
import POICategories from "@/components/search/poi-categories";
import { PlaceCategory, GeoapifyPlace, getPlacesNearby } from "@/lib/geoapify";

const SearchPage: React.FC = () => {
  const [_, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<PlaceCategory | null>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(true);
  const [selectedTab, setSelectedTab] = useState("poi");
  const [mapCenter, setMapCenter] = useState({ lat: 19.0760, lng: 72.8777 }); // Mumbai by default
  const [placesNearby, setPlacesNearby] = useState<GeoapifyPlace[]>([]);
  
  const { data: attractions } = useQuery({
    queryKey: ['/api/places', { category: 'attraction' }],
    enabled: selectedTab === 'attractions',
  });
  
  const { data: guides } = useQuery({
    queryKey: ['/api/guides'],
    enabled: selectedTab === 'guides',
  });
  
  const handleCategorySelect = async (category: PlaceCategory) => {
    setActiveCategory(category);
    
    try {
      const places = await getPlacesNearby(mapCenter, category);
      setPlacesNearby(places);
    } catch (error) {
      console.error("Error fetching places:", error);
    }
  };
  
  return (
    <div className="h-full flex flex-col pb-14">
      {/* Header */}
      <div className="bg-white border-b p-3">
        <div className="relative">
          <Input 
            type="text" 
            placeholder="Search attractions, guides, or POIs..." 
            className="w-full pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
      </div>
      
      {/* Category Tabs */}
      <div className="flex border-b overflow-x-auto whitespace-nowrap">
        <button className="px-4 py-3 text-gray-600 font-medium flex items-center">
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
            <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12" />
            <circle cx="17" cy="7" r="5" />
          </svg> 
          Medical Stores
        </button>
        <button className="px-4 py-3 text-gray-600 font-medium flex items-center">
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
            <path d="M3 15v2a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-2" />
            <path d="M4 11h16" />
            <path d="M10 11 9 4c0-.5.5-1 1-1h4c.5 0 1 .5 1 1l-1 7" />
          </svg> 
          Restaurants
        </button>
        <button className="px-4 py-3 text-[#DC143C] font-medium border-b-2 border-[#DC143C] flex items-center">
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
            <path d="M2 20h20" />
            <path d="M5 4h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
            <path d="M6 10v4" />
            <path d="M18 10v4" />
            <path d="M10 2v2" />
            <path d="M14 2v2" />
          </svg> 
          Hotels
        </button>
      </div>
      
      {/* Map View */}
      <MapView
        center={mapCenter}
        zoom={13}
        bottomSheetOpen={bottomSheetOpen}
        onBottomSheetOpenChange={setBottomSheetOpen}
        markers={placesNearby.map((place) => ({
          position: { lat: place.lat, lng: place.lon },
          title: place.name || "Point of Interest",
          popup: `<b>${place.name || "Point of Interest"}</b><br>${place.address_line1 || ""}`,
        }))}
        onMapClick={(coords) => {
          setMapCenter(coords);
          if (activeCategory) {
            handleCategorySelect(activeCategory);
          }
        }}
        bottomSheetContent={
          <div>
            <Tabs defaultValue="poi" value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="flex justify-around p-3 border-b">
                <TabsTrigger value="attractions">Attractions</TabsTrigger>
                <TabsTrigger value="guides">Guides</TabsTrigger>
                <TabsTrigger value="poi">POI</TabsTrigger>
              </TabsList>
              
              <TabsContent value="attractions">
                <div className="p-4 pb-16">
                  <h3 className="text-lg font-medium mb-3">Attractions in Maharashtra</h3>
                  {attractions?.length > 0 ? (
                    <div className="space-y-4">
                      {attractions.map((attraction) => (
                        <div 
                          key={attraction.id}
                          className="bg-white rounded-lg shadow-md p-3 flex"
                        >
                          <div 
                            className="w-16 h-16 rounded-lg bg-gray-200 mr-3 bg-cover bg-center"
                            style={{ backgroundImage: `url(${attraction.imageUrl || ''})` }}
                          ></div>
                          <div>
                            <h4 className="font-medium">{attraction.name}</h4>
                            <p className="text-xs text-gray-600">{attraction.location}</p>
                            <p className="text-xs text-gray-600 mt-1">{attraction.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No attractions found</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="guides">
                <div className="p-4 pb-16">
                  <h3 className="text-lg font-medium mb-3">Available Guides</h3>
                  {guides?.length > 0 ? (
                    <div className="space-y-4">
                      {guides.map((guide) => (
                        <div 
                          key={guide.id}
                          className="bg-white rounded-lg shadow-md p-3 flex items-center"
                        >
                          <div className="w-12 h-12 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-6 h-6 text-gray-400"
                            >
                              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{guide.fullName}</h4>
                            <p className="text-xs text-gray-600">
                              {guide.guideProfile?.specialties?.join(', ')}
                            </p>
                            <div className="flex items-center mt-1">
                              <div className="flex text-yellow-400 text-xs">
                                {[...Array(Math.floor(guide.guideProfile?.rating || 0))].map((_, i) => (
                                  <svg 
                                    key={i}
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 24 24" 
                                    fill="currentColor" 
                                    className="w-3 h-3"
                                  >
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                  </svg>
                                ))}
                                {guide.guideProfile?.rating && guide.guideProfile.rating % 1 !== 0 && (
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 24 24" 
                                    fill="currentColor" 
                                    className="w-3 h-3"
                                  >
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            <button className="w-10 h-10 bg-[#DC143C] rounded-full text-white flex items-center justify-center shadow-md">
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
                                <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
                                <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No guides found</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="poi">
                <POICategories onCategorySelect={handleCategorySelect} />
              </TabsContent>
            </Tabs>
          </div>
        }
      />
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default SearchPage;
