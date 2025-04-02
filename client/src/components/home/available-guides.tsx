import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AvailableGuides() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: guides, isLoading } = useQuery({
    queryKey: ['guides'],
    queryFn: async () => {
      const response = await fetch('/api/guides');
      if (!response.ok) throw new Error('Failed to fetch guides');
      return response.json();
    }
  });

  if (isLoading) {
    return <div className="text-center p-4">Loading guides...</div>;
  }

  if (!guides?.length) {
    return <div className="text-center p-4">No guides available at the moment.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {guides.map((guide) => (
        <Card key={guide.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={guide.imageUrl} />
                <AvatarFallback>{guide.fullName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold">{guide.fullName}</h3>
                <p className="text-sm text-gray-500">{guide.guideProfile?.location}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-yellow-500">★</span>
                  <span className="text-sm">{guide.guideProfile?.rating || 'New'}</span>
                </div>
              </div>
              <Button variant="outline" size="sm">View Profile</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}