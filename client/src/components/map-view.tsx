import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Coordinates, GeoapifyPlace, getPlacesNearby, PlaceCategory } from "@/lib/geoapify";

interface MapViewProps {
  center?: Coordinates;
  zoom?: number;
  markers?: Array<{
    position: Coordinates;
    title?: string;
    popup?: string;
  }>;
  onMapClick?: (coords: Coordinates) => void;
  bottomSheetOpen?: boolean;
  onBottomSheetOpenChange?: (open: boolean) => void;
  bottomSheetContent?: React.ReactNode;
  className?: string;
  enableDragging?: boolean;
}

const MapView: React.FC<MapViewProps> = ({
  center = { lat: 19.0760, lng: 72.8777 }, // Mumbai coordinates as default
  zoom = 10,
  markers = [],
  onMapClick,
  bottomSheetOpen = true,
  onBottomSheetOpenChange,
  bottomSheetContent,
  className,
  enableDragging = true,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);

  // CSS Fix for marker icons
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([center.lat, center.lng], zoom);
      
      L.tileLayer("https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=1b6a6068e8704c89813a9c10591c4881", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Add click handler
      if (onMapClick) {
        map.on("click", (event) => {
          const { lat, lng } = event.latlng;
          onMapClick({ lat, lng });
        });
      }
      
      mapRef.current = map;
      setMapReady(true);
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  
  // Update map center and zoom when props change
  useEffect(() => {
    if (mapRef.current && mapReady) {
      mapRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom, mapReady]);
  
  // Handle markers
  useEffect(() => {
    if (mapRef.current && mapReady) {
      // Clear existing markers
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapRef.current?.removeLayer(layer);
        }
      });
      
      // Add new markers
      markers.forEach((marker) => {
        const { position, title, popup } = marker;
        const leafletMarker = L.marker([position.lat, position.lng]).addTo(mapRef.current!);
        
        if (popup) {
          leafletMarker.bindPopup(popup);
        } else if (title) {
          leafletMarker.bindPopup(title);
        }
      });
    }
  }, [markers, mapReady]);

  return (
    <div className={`relative flex-1 ${className || ""}`}>
      <div ref={mapContainerRef} className="absolute inset-0 bg-gray-200" />
      
      {/* Map Controls */}
      <div className="absolute top-2 right-2 flex flex-col z-10">
        <button 
          className="w-8 h-8 bg-white rounded-md shadow-md flex items-center justify-center mb-1"
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.locate({ setView: true, maxZoom: 16 });
            }
          }}
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
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
        </button>
        <button 
          className="w-8 h-8 bg-white rounded-md shadow-md flex items-center justify-center mb-1"
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.setZoom((mapRef.current.getZoom() || 10) + 1);
            }
          }}
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
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        </button>
        <button 
          className="w-8 h-8 bg-white rounded-md shadow-md flex items-center justify-center"
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.setZoom((mapRef.current.getZoom() || 10) - 1);
            }
          }}
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
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>
      
      {/* Bottom Sheet */}
      <BottomSheet
        open={bottomSheetOpen}
        onOpenChange={onBottomSheetOpenChange}
        snapPoints={[0.3, 0.6, 0.9]}
        defaultSnapPoint={0}
      >
        {bottomSheetContent}
      </BottomSheet>
    </div>
  );
};

export default MapView;
