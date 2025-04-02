
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface AttractionInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attractionName: string;
}

export function AttractionInfoDialog({ isOpen, onClose, attractionName }: AttractionInfoDialogProps) {
  const [wikiData, setWikiData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && attractionName) {
      setIsLoading(true);
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(attractionName)}`)
        .then(res => res.json())
        .then(data => {
          setWikiData(data.extract);
          setIsLoading(false);
        })
        .catch(() => {
          setWikiData("Could not fetch information for this attraction.");
          setIsLoading(false);
        });
    }
  }, [isOpen, attractionName]);

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{attractionName}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[95%]" />
            </div>
          ) : (
            <p className="text-gray-700 leading-relaxed">{wikiData}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
