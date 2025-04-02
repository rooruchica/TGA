import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNavigation from "@/components/guide/bottom-navigation";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const GuideRequests: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  
  // Query for connection requests
  const { data: connections, isLoading } = useQuery({
    queryKey: ['/api/connections'],
    queryFn: async () => {
      const response = await fetch(`/api/connections?userId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch connections');
      return response.json();
    },
  });
  
  // Filter connections based on active tab
  const filteredConnections = connections?.filter(
    (connection) => connection.status === activeTab
  ) || [];
  
  // Handle accepting a connection request
  const handleAccept = async (connectionId: number) => {
    try {
      await apiRequest('PATCH', `/api/connections/${connectionId}`, { status: 'accepted' });
      
      toast({
        title: "Request accepted",
        description: "You've successfully accepted the tourist's request.",
      });
      
      // Invalidate connections query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/guide/connections'] });
    } catch (error) {
      toast({
        title: "Failed to accept request",
        description: "There was an error accepting the request. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle rejecting a connection request
  const handleReject = async (connectionId: number) => {
    try {
      await apiRequest('PATCH', `/api/connections/${connectionId}`, { status: 'rejected' });
      
      toast({
        title: "Request rejected",
        description: "You've rejected the tourist's request.",
      });
      
      // Invalidate connections query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/guide/connections'] });
    } catch (error) {
      toast({
        title: "Failed to reject request",
        description: "There was an error rejecting the request. Please try again.",
        variant: "destructive",
      });
    }
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
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
      <p className="text-gray-500 text-center">
        {activeTab === 'pending' 
          ? "No pending requests yet" 
          : activeTab === 'accepted' 
            ? "No accepted requests yet" 
            : "No rejected requests yet"}
      </p>
      <p className="text-gray-400 text-sm text-center mt-1">
        {activeTab === 'pending' 
          ? "New requests will appear here" 
          : activeTab === 'accepted' 
            ? "Accepted requests will appear here" 
            : "Rejected requests will appear here"}
      </p>
    </div>
  );
  
  return (
    <div className="flex flex-col h-full pb-16">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Guide Requests</h1>
        <p className="text-gray-500 text-sm">Manage tourist requests for your guidance</p>
      </div>
      
      <Tabs defaultValue="pending" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
            <TabsTrigger value="accepted" className="flex-1">Accepted</TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1">Rejected</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <TabsContent value="pending" className="mt-0 space-y-4">
            {isLoading ? (
              <div className="p-4 text-center">Loading requests...</div>
            ) : filteredConnections.length === 0 ? (
              <EmptyState />
            ) : (
              filteredConnections.map((connection) => (
                <Card key={connection.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4">
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
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Pending
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            Requested on {new Date(connection.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm text-gray-600">
                        <p>Message: I'd like to have you as a guide for my trip to Maharashtra.</p>
                      </div>
                    </div>
                    
                    <div className="flex border-t">
                      <Button 
                        variant="ghost" 
                        className="flex-1 rounded-none py-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleReject(connection.id)}
                      >
                        Reject
                      </Button>
                      <div className="w-px bg-gray-200"></div>
                      <Button 
                        variant="ghost" 
                        className="flex-1 rounded-none py-3 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleAccept(connection.id)}
                      >
                        Accept
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="accepted" className="mt-0 space-y-4">
            {isLoading ? (
              <div className="p-4 text-center">Loading requests...</div>
            ) : filteredConnections.length === 0 ? (
              <EmptyState />
            ) : (
              filteredConnections.map((connection) => (
                <Card key={connection.id}>
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
                            Accepted
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Accepted on {new Date(connection.updatedAt || connection.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end space-x-2">
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
          
          <TabsContent value="rejected" className="mt-0 space-y-4">
            {isLoading ? (
              <div className="p-4 text-center">Loading requests...</div>
            ) : filteredConnections.length === 0 ? (
              <EmptyState />
            ) : (
              filteredConnections.map((connection) => (
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
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Rejected
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Rejected on {new Date(connection.updatedAt || connection.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      <Button 
                        variant="outline" 
                        className="text-sm"
                        onClick={() => handleAccept(connection.id)}
                      >
                        Reconsider
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </div>
      </Tabs>
      
      <BottomNavigation />
    </div>
  );
};

export default GuideRequests;