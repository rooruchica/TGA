import { useState, useEffect, useRef } from 'react';
import { Place } from '@shared/schema';
import { fetchWikimediaImage } from '@/lib/wikimedia-api';
import { API_BASE_URL } from '@/lib/api-client';

interface UseWikimediaOptions {
  updateDatabase?: boolean;
}

// Helper function to check deep equality of places arrays
function arePlacesEqual(placesA: Place[], placesB: Place[]): boolean {
  if (placesA === placesB) return true;
  if (placesA.length !== placesB.length) return false;
  
  // Compare place IDs in the arrays
  const idsA = placesA.map(p => p.id).sort();
  const idsB = placesB.map(p => p.id).sort();
  
  return idsA.every((id, index) => id === idsB[index]);
}

/**
 * A custom hook to enhance places with Wikimedia image information
 * @param places Array of places to enhance with Wikimedia images
 * @param options Configuration options
 * @returns Enhanced places with Wikimedia image information
 */
export function useWikimedia(places: Place[], options: UseWikimediaOptions = {}) {
  const [enhancedPlaces, setEnhancedPlaces] = useState<Place[]>(places);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Reference to previous places to avoid unnecessary processing
  const previousPlacesRef = useRef<Place[]>([]);

  useEffect(() => {
    // Skip if no places
    if (!places.length) {
      setEnhancedPlaces(places);
      return;
    }
    
    // Skip if places have not changed
    if (arePlacesEqual(places, previousPlacesRef.current)) {
      return;
    }
    
    // Update reference to current places
    previousPlacesRef.current = places;

    async function enhancePlacesWithWikimedia() {
      setIsLoading(true);
      setError(null);
      
      try {
        const updatedPlaces = [...places];
        let hasUpdates = false;

        // Only process attractions that don't already have Wikimedia info
        const placesToProcess = updatedPlaces.filter(
          place => 
            ['attraction', 'monument', 'heritage', 'landmark'].includes(place.category) && 
            !place.wikimediaThumbnailUrl
        );
        
        // Skip processing if no places need enhancement
        if (placesToProcess.length === 0) {
          setEnhancedPlaces(places);
          setIsLoading(false);
          return;
        }

        for (const place of placesToProcess) {
          const placeIndex = updatedPlaces.findIndex(p => p.id === place.id);
          if (placeIndex === -1) continue; // Skip if place not found

          try {
            // Create search term with location for better results
            const searchTerm = `${place.name} ${place.location} Maharashtra India`;
            const imageInfo = await fetchWikimediaImage(searchTerm);
            
            if (imageInfo) {
              // Update place in local array
              updatedPlaces[placeIndex] = {
                ...place,
                // Only set imageUrl if not already set
                imageUrl: place.imageUrl || imageInfo.thumbnailUrl,
                wikimediaThumbnailUrl: imageInfo.thumbnailUrl,
                wikimediaDescription: imageInfo.descriptionHtml,
                wikimediaArtist: imageInfo.artistName,
                wikimediaAttributionUrl: imageInfo.attributionUrl,
                wikimediaLicense: imageInfo.licenseName,
                wikimediaLicenseUrl: imageInfo.licenseUrl
              };
              hasUpdates = true;

              // Optionally update the database
              if (options.updateDatabase && place.id) {
                await fetch(`${API_BASE_URL}/api/places/${place.id}/wikimedia`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    wikimediaThumbnailUrl: imageInfo.thumbnailUrl,
                    wikimediaDescription: imageInfo.descriptionHtml,
                    wikimediaArtist: imageInfo.artistName,
                    wikimediaAttributionUrl: imageInfo.attributionUrl,
                    wikimediaLicense: imageInfo.licenseName,
                    wikimediaLicenseUrl: imageInfo.licenseUrl
                  }),
                });
              }
            }
          } catch (err) {
            console.error(`Error processing place ${place.name}:`, err);
            // Continue with next place even if this one fails
          }
        }

        if (hasUpdates) {
          setEnhancedPlaces(updatedPlaces);
        } else {
          setEnhancedPlaces(places);
        }
      } catch (err) {
        console.error('Error enhancing places with Wikimedia data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setEnhancedPlaces(places); // Fallback to original places
      } finally {
        setIsLoading(false);
      }
    }

    enhancePlacesWithWikimedia();
  }, [places, options.updateDatabase]);

  return {
    places: enhancedPlaces,
    isLoading,
    error
  };
} 