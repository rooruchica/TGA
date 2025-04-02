import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

// Define Coordinates type
export type Coordinates = {
  lat: number;
  lng: number;
};

// Props interface for MapView component
interface MapViewProps {
  center?: Coordinates;
  zoom?: number;
  markers?: Array<{
    position: Coordinates;
    title?: string;
    popup?: string;
    customIcon?: boolean;
    markerType?: 'attraction' | 'guide' | 'user' | 'poi';
  }>;
  onMapClick?: (coords: Coordinates) => void;
  bottomSheetOpen?: boolean;
  onBottomSheetOpenChange?: (open: boolean) => void;
  bottomSheetContent?: React.ReactNode;
  className?: string;
  enableDragging?: boolean;
}

const MapView: React.FC<MapViewProps> = ({
  center = { lat: 19.0760, lng: 72.8777 }, // Default to Mumbai
  zoom = 10,
  markers = [],
  onMapClick,
  bottomSheetOpen = false,
  onBottomSheetOpenChange,
  bottomSheetContent,
  className,
  enableDragging = true,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      // Create map instance
      const map = L.map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom,
        zoomControl: false,
        dragging: enableDragging,
        tap: enableDragging,
      });
      
      // Add tile layer (OpenStreetMap)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      
      // Add zoom control to top right
      L.control.zoom({ position: "topright" }).addTo(map);
      
      // Create markers layer group
      markersLayerRef.current = L.layerGroup().addTo(map);
      
      // Setup map click event
      if (onMapClick) {
        map.on("click", (e) => {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }
      
      // Store map instance
      mapInstanceRef.current = map;
      setIsMapReady(true);
      
      // Cleanup on component unmount
      return () => {
        map.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      };
    }
  }, [center.lat, center.lng, zoom, onMapClick, enableDragging]);
  
  // Update markers when they change
  useEffect(() => {
    if (isMapReady && mapInstanceRef.current && markersLayerRef.current) {
      // Clear existing markers
      markersLayerRef.current.clearLayers();
      
      // Add new markers
      markers.forEach((marker) => {
        // Define marker color and icon based on marker type
        let bgColor = '#DC143C'; // Default color - crimson
        let iconHtml = '';
        
        if (marker.customIcon) {
          switch (marker.markerType) {
            case 'user':
              bgColor = '#4285F4'; // Blue for user location
              iconHtml = `<div class="marker-pin bg-[${bgColor}] w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white pulse-animation">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>`;
              break;
            case 'guide':
              bgColor = '#34A853'; // Green for guides
              iconHtml = `<div class="marker-pin bg-[${bgColor}] w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>`;
              break;
            case 'attraction':
              bgColor = '#FBBC05'; // Yellow for attractions
              iconHtml = `<div class="marker-pin bg-[${bgColor}] w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
              </div>`;
              break;
            default:
              // Default icon for POIs
              iconHtml = `<div class="marker-pin bg-[${bgColor}] w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>`;
          }
        } else {
          // Default icon
          iconHtml = `<div class="marker-pin bg-[${bgColor}] w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md"></div>`;
        }
        
        const icon = L.divIcon({
          className: "custom-div-icon",
          html: iconHtml,
          iconSize: marker.markerType === 'user' ? [40, 40] : [30, 30],
          iconAnchor: marker.markerType === 'user' ? [20, 20] : [15, 15],
        });
        
        const markerInstance = L.marker([marker.position.lat, marker.position.lng], { icon })
          .addTo(markersLayerRef.current!);
        
        if (marker.popup) {
          markerInstance.bindPopup(marker.popup);
        } else if (marker.title) {
          markerInstance.bindPopup(marker.title);
        }
      });
    }
  }, [markers, isMapReady]);
  
  // Update map center and zoom when they change
  useEffect(() => {
    if (isMapReady && mapInstanceRef.current) {
      mapInstanceRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center.lat, center.lng, zoom, isMapReady]);
  
  return (
    <div className={`relative flex-1 ${className}`}>
      <div ref={mapRef} className="w-full h-full z-0" />
      
      {bottomSheetContent && (
        <Sheet open={bottomSheetOpen} onOpenChange={onBottomSheetOpenChange}>
          <SheetContent 
            side="bottom" 
            className="h-auto max-h-[80%] overflow-auto rounded-t-xl p-0"
          >
            <div className="pt-2 pb-1 flex justify-center">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            {bottomSheetContent}
          </SheetContent>
        </Sheet>
      )}
      
      {/* Recenter button */}
      <Button
        size="icon"
        variant="secondary"
        className="absolute bottom-4 right-4 z-10 h-10 w-10 rounded-full shadow-md bg-white hover:bg-gray-100"
        onClick={() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([center.lat, center.lng], zoom);
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
          className="h-5 w-5"
        >
          <path d="M21 3 3 21" />
          <path d="M21 21 3 3" />
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </Button>
    </div>
  );
};

export default MapView;