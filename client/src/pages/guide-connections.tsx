import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNavigation from "@/components/guide/bottom-navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const GuideConnections: React.FC = () => {
  const [activeTab, setActiveTab] = useState("accepted");
  const [selectedTourist, setSelectedTourist] = useState<any>(null);
  const [showTouristDetails, setShowTouristDetails] = useState(false);
  
  // Query for guide's accepted connections
  const { data: connections, isLoading } = useQuery({
    queryKey: ['/api/guide/connections', { status: 'accepted' }],
  });
  
  // Handle selecting a tourist for more details
  const handleSelectTourist = (tourist: any) => {
    setSelectedTourist(tourist);
    setShowTouristDetails(true);
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
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      <p className="text-gray-500 text-center">No connections yet</p>
      <p className="text-gray-400 text-sm text-center mt-1">
        {activeTab === 'accepted' 
          ? "When tourists accept your guidance, they'll appear here" 
          : "Your past connections will appear here"}
      </p>
    </div>
  );
  
  return (
    <div className="flex flex-col h-full pb-16">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">My Connections</h1>
        <p className="text-gray-500 text-sm">Manage your tourist connections</p>
      </div>
      
      <Tabs defaultValue="accepted" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="accepted" className="flex-1">Active</TabsTrigger>
            <TabsTrigger value="past" className="flex-1">Past</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <TabsContent value="accepted" className="mt-0 space-y-4">
            {isLoading ? (
              <div className="p-4 text-center">Loading connections...</div>
            ) : !connections || connections.length === 0 ? (
              <EmptyState />
            ) : (
              connections.map((connection) => (
                <Card key={connection.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src="" alt={connection.tourist?.fullName} />
                        <AvatarFallback>
                          {connection.tourist?.fullName?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{connection.tourist?.fullName}</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Connected since {new Date(connection.updatedAt || connection.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        className="text-sm h-9"
                        onClick={() => handleSelectTourist(connection.tourist)}
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
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        Details
                      </Button>
                      <Button variant="outline" className="text-sm h-9">
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
                          <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
                          <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
                        </svg>
                        Message
                      </Button>
                      <Button className="text-sm h-9 bg-[#DC143C] hover:bg-[#B01030]">
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
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <path d="M8 12h8" />
                          <path d="M12 8v8" />
                        </svg>
                        Create Tour
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="past" className="mt-0 space-y-4">
            <EmptyState />
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Tourist Details Dialog */}
      <Dialog open={showTouristDetails} onOpenChange={setShowTouristDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tourist Information</DialogTitle>
            <DialogDescription>
              Details about {selectedTourist?.fullName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTourist && (
            <div className="py-4">
              <div className="flex items-center mb-4">
                <Avatar className="h-16 w-16 mr-4">
                  <AvatarImage src="" alt={selectedTourist.fullName} />
                  <AvatarFallback className="text-lg">
                    {selectedTourist.fullName?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{selectedTourist.fullName}</h3>
                  <p className="text-gray-500">{selectedTourist.email}</p>
                  {selectedTourist.phone && (
                    <p className="text-gray-500">{selectedTourist.phone}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-gray-500 mr-2"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                  </svg>
                  <span>Joined on {new Date(selectedTourist.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-gray-500 mr-2"
                  >
                    <path d="M20 11.08V8l-6-6H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h6" />
                    <path d="M14 2v6h6" />
                    <circle cx="16" cy="16" r="6" />
                  </svg>
                  <span>0 Completed Tours</span>
                </div>
                
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-gray-500 mr-2"
                  >
                    <path d="m3 11 18-5v12L3 14v-3z" />
                    <path d="M11.6 16.8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                  </svg>
                  <span>Preferences: Not specified</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTouristDetails(false)}>
              Close
            </Button>
            <Button className="bg-[#DC143C] hover:bg-[#B01030]">
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
                <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
                <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
              </svg>
              Message Tourist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <BottomNavigation />
    </div>
  );
};

export default GuideConnections;