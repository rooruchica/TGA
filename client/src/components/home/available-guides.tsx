import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/utils";

export default function AvailableGuides() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: guides = [] } = useQuery({
    queryKey: ["guides"],
    queryFn: async () => {
      const response = await fetch(`${api}/guides`);
      if (!response.ok) {
        throw new Error("Failed to fetch guides");
      }
      return response.json();
    },
  });

  const handleRequestGuide = async (guideId: number) => {
    try {
      const response = await fetch(`${api}/connections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromUserId: user?.id,
          toUserId: guideId,
          status: "pending",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send request");
      }

      toast({
        title: "Request sent",
        description: "Your guide request has been sent successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send guide request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Available Guides</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guides.map((guide: any) => (
          <Card key={guide.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{guide.fullName}</h3>
                  {guide.guideProfile && (
                    <>
                      <p className="text-sm text-gray-600">{guide.guideProfile.location}</p>
                      <p className="text-sm text-gray-600">
                        Experience: {guide.guideProfile.experience} years
                      </p>
                      <p className="text-sm text-gray-600">
                        Languages: {guide.guideProfile.languages.join(", ")}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        {guide.guideProfile.bio}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full mt-4">Request Guide</Button>
                </DialogTrigger>
                <DialogContent>
                  <div className="p-4">
                    <h4 className="text-lg font-semibold mb-2">Confirm Guide Request</h4>
                    <p>Are you sure you want to request {guide.fullName} as your guide?</p>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const dialogClose = document.querySelector("[data-dialog-close]");
                          if (dialogClose instanceof HTMLElement) {
                            dialogClose.click();
                          }
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          handleRequestGuide(guide.id);
                          const dialogClose = document.querySelector("[data-dialog-close]");
                          if (dialogClose instanceof HTMLElement) {
                            dialogClose.click();
                          }
                        }}
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}