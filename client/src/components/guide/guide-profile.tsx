import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import GuideBottomNavigation from "@/components/guide/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { StarIcon, CheckCircle2 } from "lucide-react";

interface GuideProfile {
  id: string;
  userId: string;
  location: string;
  specialties: string[];
  languages: string[];
  experience: number;
  rating: number;
  bio: string;
}

const GuideProfile: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Preview mode is always enabled
  const isPreviewMode = true;

  // Fetch guide profile
  const { data: profile, isLoading } = useQuery<GuideProfile>({
    queryKey: ['/api/guide', user?.id, 'profile'],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/guide/${user?.id}/profile`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  // Get current user from window.auth if not available from context
  const currentUser = user || (window as any).auth?.user;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pb-14">
      {/* Header with Preview Mode toggle */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-2xl font-bold">Guide Profile</h2>
        <div className="flex items-center">
          <Badge variant="outline" className="bg-red-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Preview Mode
          </Badge>
        </div>
      </div>

      {/* Profile Preview */}
      <div className="flex-1 overflow-y-auto p-4">
        <Card className="shadow-md mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              {/* Improved Avatar */}
              <div className="relative mb-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage 
                    src={currentUser?.profilePicture || "https://api.dicebear.com/9.x/notionists/svg?seed=Adrian"} 
                    alt={currentUser?.name || "Guide"} 
                    className="bg-red-50"
                  />
                  <AvatarFallback className="bg-red-100 text-blue-700 text-2xl">
                    {currentUser?.name?.[0] || 'G'}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <h3 className="text-xl font-bold">{currentUser?.name || "Guide Name"}</h3>
              <p className="text-sm text-gray-500 mb-2">@{currentUser?.username || "username"}</p>
              
              {/* Rating */}
              <div className="flex items-center justify-center mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon 
                    key={i}
                    className={`h-5 w-5 ${i < (profile?.rating || 4.5) 
                      ? "text-yellow-400 fill-yellow-400" 
                      : "text-gray-300"}`}
                  />
                ))}
                <span className="ml-2 font-semibold text-gray-700">{profile?.rating || 4.5}</span>
              </div>
              
              {/* Location */}
              <p className="text-gray-600 mb-4 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 mr-1 text-gray-500"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {profile?.location || "Maharashtra, India"}
              </p>
            </div>
            
            {/* Bio */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-gray-700">About Me</h4>
              <p className="text-gray-600">{profile?.bio || "I'm a passionate tour guide with extensive knowledge of Maharashtra's culture, history, and hidden gems."}</p>
            </div>
            
            {/* Experience */}
            <div className="mb-4">
              <h4 className="font-semibold mb-2 text-gray-700">Experience</h4>
              <p className="text-gray-600">{profile?.experience || 5} years as a professional guide</p>
            </div>
            
            {/* Specialties */}
            <div className="mb-4">
              <h4 className="font-semibold mb-2 text-gray-700">Specialties</h4>
              <div className="flex flex-wrap gap-2">
                {(profile?.specialties || ["Historical Tours", "Cultural Experiences", "Adventure Tours"]).map((specialty, i) => (
                  <Badge key={i} variant="secondary" className="bg-red-50 text-blue-700 hover:bg-red-100">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Languages */}
            <div className="mb-4">
              <h4 className="font-semibold mb-2 text-gray-700">Languages</h4>
              <div className="flex flex-wrap gap-2">
                {(profile?.languages || ["English", "Hindi", "Marathi"]).map((language, i) => (
                  <Badge key={i} variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
                    {language}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* How tourists will see your profile */}
            <div className="mt-8 border-t pt-6">
              <h4 className="font-semibold text-center mb-4 text-gray-700">How tourists will see your profile</h4>
              <div className="bg-white border rounded-lg p-4 flex items-center">
                <Avatar className="h-16 w-16 mr-4">
                  <AvatarImage 
                    src={currentUser?.profilePicture || "https://api.dicebear.com/9.x/notionists/svg?seed=Adrian"} 
                    alt={currentUser?.name || "Guide"} 
                  />
                  <AvatarFallback>{currentUser?.name?.[0] || 'G'}</AvatarFallback>
                </Avatar>
                <div>
                  <h5 className="font-semibold">{currentUser?.name || "Guide Name"}</h5>
                  <div className="flex items-center mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon 
                        key={i}
                        className={`h-4 w-4 ${i < (profile?.rating || 4.5) 
                          ? "text-yellow-400 fill-yellow-400" 
                          : "text-gray-300"}`}
                      />
                    ))}
                    <span className="ml-1 text-sm font-medium">{profile?.rating || 4.5}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <GuideBottomNavigation />
    </div>
  );
};

export default GuideProfile;
