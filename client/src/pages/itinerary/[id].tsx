import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useParams } from 'wouter';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Itinerary } from '@shared/schema';

const ItineraryDetails: React.FC = () => {
  const params = useParams();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [, setLocation] = useLocation();
  const user = (window as any).auth?.user;

  useEffect(() => {
    const fetchItinerary = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const response = await fetch(`/api/itineraries/${params.id}`);
        if (!response.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await response.json();
        setItinerary(data);
      } catch (e) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchItinerary();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <svg className="w-8 h-8 animate-spin text-[#DC143C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="4" />
        </svg>
        <p className="mt-4 text-gray-500">Loading itinerary...</p>
      </div>
    );
  }
  if (notFound || !itinerary) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <p className="text-xl font-semibold text-gray-700 mb-2">Itinerary Not Found</p>
        <Button onClick={() => setLocation(user?.userType === 'guide' ? '/guide-itineraries' : '/trip-planner')}>Back to Trip Planner</Button>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{itinerary.title}</h1>
      <p className="text-gray-600 mb-4">{itinerary.description}</p>
      <div className="mb-4">
        <span className="font-medium">Dates: </span>
        {itinerary.startDate ? format(new Date(itinerary.startDate), 'dd MMM yyyy') : ''}
        {itinerary.endDate && itinerary.endDate !== '1970-01-01T00:00:00.000Z' ? ` - ${format(new Date(itinerary.endDate), 'dd MMM yyyy')}` : ''}
      </div>
      <div className="mb-4">
        <span className="font-medium">Trip Type: </span>
        {itinerary.tripType ? itinerary.tripType.charAt(0).toUpperCase() + itinerary.tripType.slice(1) : 'Other'}
      </div>
      <div className="mb-4">
        <span className="font-medium">Places:</span>
        <ul className="list-disc ml-6 mt-2">
          {Array.isArray(itinerary.places) && itinerary.places.length > 0 ? (
            itinerary.places.map((place: any, idx: number) => (
              <li key={idx} className="mb-1">
                <span className="font-semibold">{place.name}</span>
                {place.description && <span className="ml-2 text-gray-500">- {place.description}</span>}
              </li>
            ))
          ) : (
            <li className="text-gray-500">No places added</li>
          )}
        </ul>
      </div>
      <Button onClick={() => setLocation(user?.userType === 'guide' ? '/guide-itineraries' : '/trip-planner')}>
        Back to Trip Planner
      </Button>
    </div>
  );
};

export default ItineraryDetails; 