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
        const icon = L.divIcon({
          className: "custom-div-icon",
          html: `<div class="marker-pin bg-[#DC143C] w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md"></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
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