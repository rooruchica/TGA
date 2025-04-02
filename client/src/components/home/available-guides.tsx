
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function AvailableGuides() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [message, setMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: guides = [], isLoading } = useQuery({
    queryKey: ['guides'],
    queryFn: async () => {
      const response = await fetch('/api/guides');
      if (!response.ok) throw new Error('Failed to fetch guides');
      return response.json();
    }
  });

  const sendRequest = useMutation({
    mutationFn: async (guideId: number) => {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromUserId: user?.id,
          toUserId: guideId,
          status: 'pending',
          message: message,
          tripDetails: 'Looking for guidance in Maharashtra',
          budget: 'Flexible'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send request');
      }
    },
    onSuccess: () => {
      toast({
        title: "Request sent!",
        description: "Your request has been sent to the guide.",
      });
      setIsDialogOpen(false);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRequestGuide = (guide: any) => {
    setSelectedGuide(guide);
    setIsDialogOpen(true);
  };

  const handleSendRequest = () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message for the guide",
        variant: "destructive",
      });
      return;
    }
    sendRequest.mutate(selectedGuide.id);
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading guides...</div>;
  }

  if (!guides?.length) {
    return <div className="text-center p-4">No guides available at the moment.</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold px-4">Available Guides</h2>
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
                  <p className="text-sm text-gray-500">{guide.guideProfile?.location || 'Maharashtra'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-yellow-500">★</span>
                    <span className="text-sm">{guide.guideProfile?.rating || 'New'}</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRequestGuide(guide)}
                >
                  Request Guide
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogTitle>Request Guide</DialogTitle>
          <DialogDescription>
            Send a request to {selectedGuide?.fullName}. Once they accept, you'll be able to communicate directly.
          </DialogDescription>
          
          <div className="mt-4">
            <Textarea
              placeholder="Write a message to the guide describing your requirements..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendRequest} disabled={sendRequest.isPending}>
              {sendRequest.isPending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
