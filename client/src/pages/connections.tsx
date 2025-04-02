import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import BottomNavigation from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Connections: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  
  const { data: connections, isLoading } = useQuery({
    queryKey: ['/api/users', user?.id, 'connections'],
    enabled: !!user,
  });

  return (
    <div className="h-full flex flex-col pb-14">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-2xl font-bold font-sans">Connections</h2>
      </div>
      
      {/* Content */}
      <div className="p-4 flex-1">
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Your Guide Connections</h3>
          <p className="text-gray-600 text-sm">Guides who have accepted your requests</p>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center mb-3">
                  <Skeleton className="w-16 h-16 rounded-full mr-3" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-3 w-24 mb-1" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j}>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : connections && connections.length > 0 ? (
          <div className="space-y-4">
            {connections
              .filter((connection) => connection.status === 'accepted')
              .map((connection) => (
                <div key={connection.id} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-8 h-8 text-gray-400"
                      >
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-lg">{connection.guide?.fullName}</h4>
                      <div className="flex items-center mb-1">
                        <div className="flex text-yellow-400 text-xs">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i}
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill={i < (connection.guideProfile?.rating || 0) ? "currentColor" : "none"}
                              stroke="currentColor"
                              className="w-3 h-3"
                            >
                              <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-600 ml-1">
                          ({Math.floor(Math.random() * 50) + 10} reviews)
                        </span>
                      </div>
                      <p className="text-[#DC143C] text-sm font-medium">
                        {connection.guideProfile?.specialties?.join(', ')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <p className="text-gray-600 text-sm">Location</p>
                      <p className="font-medium">{connection.guideProfile?.location}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Experience</p>
                      <p className="font-medium">{connection.guideProfile?.experience} years</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Languages</p>
                      <p className="font-medium">{connection.guideProfile?.languages?.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Contact</p>
                      <p className="font-medium">{connection.guide?.phone || 'Not available'}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      className="flex-1 bg-[#DC143C] hover:bg-[#B01030] text-white"
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
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      Call
                    </Button>
                    <Button 
                      className="flex-1 bg-white border border-[#DC143C] text-[#DC143C] hover:bg-gray-50"
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
                        <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
                        <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
                      </svg>
                      Message
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow-sm">
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p className="text-gray-600">You don't have any connections yet</p>
            <p className="text-gray-500 text-sm mb-4">Find guides to connect with</p>
            <Button 
              className="bg-[#DC143C] hover:bg-[#B01030] text-white"
              onClick={() => setLocation('/search')}
            >
              Find Guides
            </Button>
          </div>
        )}
        
        <div className="mt-6">
          <Button 
            className="w-full py-6 bg-white border border-[#DC143C] text-[#DC143C] hover:bg-gray-50"
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
              className="w-5 h-5 mr-2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            Find More Guides
          </Button>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Connections;
