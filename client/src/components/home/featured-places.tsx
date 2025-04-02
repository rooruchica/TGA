import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Place } from "@shared/schema";
import { useState } from 'react';

interface FeaturedPlacesProps {
  places: Place[];
  isLoading: boolean;
}

const FeaturedPlaces: React.FC<FeaturedPlacesProps> = ({ places, isLoading }) => {
  const [_, setLocation] = useLocation();
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState('');

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>

        <div className="flex space-x-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-40 rounded-lg overflow-hidden shadow-md">
              <Skeleton className="w-full h-24" />
              <div className="p-2">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Filter for all attractions without limiting to 5
  const featuredPlaces = places.filter(place => 
    ['attraction', 'monument', 'heritage', 'landmark'].includes(place.category)
  );

  return (
    <>
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Featured Places</h3>
        <button 
          onClick={() => setLocation('/search')}
          className="text-[#DC143C] text-sm"
        >
          View All
        </button>
      </div>

      <div className="flex space-x-3 overflow-x-auto pb-2">
        {featuredPlaces.length > 0 ? (
          featuredPlaces.map((place) => (
            <div key={place.id} className="flex-shrink-0 w-40 rounded-lg overflow-hidden shadow-md">
              <div 
                className="w-full h-24 bg-gray-200 bg-cover bg-center"
                style={{ backgroundImage: `url(${place.imageUrl || ''})` }}
              ></div>
              <div className="p-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">{place.name}</h4>
                    <p className="text-xs text-gray-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3 h-3 mr-1 text-gray-500"
                      >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {place.location}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedPlace(place.name);
                      setInfoDialogOpen(true);
                    }}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 py-4 text-center w-full">No featured places available</p>
        )}
      </div>
    </div>
    {infoDialogOpen && (
      <InfoDialog placeName={selectedPlace} onClose={() => setInfoDialogOpen(false)} />
    )}
    </>
  );
};

const InfoDialog = ({placeName, onClose}: {placeName: string; onClose: () => void}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h3 className="text-lg font-bold mb-2">{placeName}</h3>
        <p>Information about {placeName} would be fetched here from the Wikipedia API.</p>
        <button onClick={onClose} className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Close
        </button>
      </div>
    </div>
  );
}

export default FeaturedPlaces;