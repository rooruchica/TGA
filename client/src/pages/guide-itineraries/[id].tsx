import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Itinerary } from '@shared/schema';

const tripTypes = [
  'historical', 'food', 'adventure', 'cultural', 'picnic', 'nature', 'other'
];

const EditGuideItinerary: React.FC = () => {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    tripType: 'other',
    places: [] as { name: string; description: string }[],
  });
  const [newPlace, setNewPlace] = useState({ name: '', description: '' });

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
        setForm({
          title: data.title || '',
          description: data.description || '',
          startDate: data.startDate ? format(new Date(data.startDate), 'yyyy-MM-dd') : '',
          endDate: data.endDate ? format(new Date(data.endDate), 'yyyy-MM-dd') : '',
          tripType: data.tripType || 'other',
          places: Array.isArray(data.places) ? data.places : [],
        });
      } catch (e) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchItinerary();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddPlace = () => {
    if (!newPlace.name) return;
    setForm({ ...form, places: [...form.places, newPlace] });
    setNewPlace({ name: '', description: '' });
  };

  const handleRemovePlace = (idx: number) => {
    const updated = [...form.places];
    updated.splice(idx, 1);
    setForm({ ...form, places: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/itineraries/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update itinerary');
      }
      toast({ title: 'Itinerary updated', description: 'Your itinerary has been updated successfully.' });
      setLocation('/guide-itineraries');
    } catch (error: any) {
      toast({ title: 'Failed to update itinerary', description: error.message || 'There was an error updating your itinerary.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

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
        <Button onClick={() => setLocation('/guide-itineraries')}>Back to Guide Itineraries</Button>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Itinerary</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" name="title" value={form.title} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" value={form.description} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <Input id="startDate" name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input id="endDate" name="endDate" type="date" value={form.endDate} onChange={handleChange} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tripType">Trip Type</Label>
          <select
            id="tripType"
            name="tripType"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.tripType}
            onChange={handleChange}
          >
            <option value="other">Select a trip type</option>
            {tripTypes.map((type) => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium mb-2">Add Places</h3>
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="placeName">Place Name</Label>
                <Input id="placeName" value={newPlace.name} onChange={e => setNewPlace({ ...newPlace, name: e.target.value })} />
              </div>
              <div className="flex-1">
                <Label htmlFor="placeDescription">Description</Label>
                <Input id="placeDescription" value={newPlace.description} onChange={e => setNewPlace({ ...newPlace, description: e.target.value })} />
              </div>
              <Button type="button" size="sm" onClick={handleAddPlace}>Add</Button>
            </div>
          </div>
          {form.places.length > 0 && (
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium">Added Places:</h4>
              <div className="border rounded-md divide-y">
                {form.places.map((place, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3">
                    <div>
                      <div className="font-medium">{place.name}</div>
                      <div className="text-sm text-gray-500">{place.description}</div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-500 h-8 w-8 p-0" onClick={() => handleRemovePlace(idx)}>&times;</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setLocation('/guide-itineraries')}>Cancel</Button>
          <Button type="submit" className="bg-[#DC143C] hover:bg-[#B01030] text-white" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </div>
  );
};

export default EditGuideItinerary; 