import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const AvailableGuides: React.FC = () => {
  const [_, setLocation] = useLocation();
  
  const { data: guides, isLoading } = useQuery({
    queryKey: ['/api/guides'],
  });

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-3 mb-3">
            <div className="flex items-center">
              <Skeleton className="w-12 h-12 rounded-full mr-3" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-40 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="w-10 h-10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Available Guides</h3>
        <button 
          onClick={() => setLocation('/search')}
          className="text-[#DC143C] text-sm"
        >
          View All
        </button>
      </div>
      
      {guides && guides.length > 0 ? (
        guides.slice(0, 2).map((guide) => (
          <div key={guide.id} className="bg-white rounded-lg shadow-md p-3 mb-3 flex items-center">
            <div className="w-12 h-12 rounded-full bg-gray-200 mr-3 flex items-center justify-center overflow-hidden">
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
                      <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" />
                    </svg>
                  ))}
                  {guide.guideProfile?.rating && guide.guideProfile.rating % 1 !== 0 && (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      className="w-3 h-3"
                    >
                      <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-gray-600 ml-1">
                  ({Math.floor(Math.random() * 50) + 10} reviews)
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 text-sm font-medium mr-2">Available</span>
              <Button 
                size="icon"
                className="w-10 h-10 bg-[#DC143C] hover:bg-[#B01030] text-white rounded-full shadow-md"
                onClick={() => setLocation('/connections')}
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
                  <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
                  <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
                </svg>
              </Button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 py-4 text-center">No guides available at the moment</p>
      )}
    </div>
  );
};

export default AvailableGuides;
