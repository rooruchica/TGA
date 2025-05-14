import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import fixLeafletMapErrors from "@/lib/leaflet-fix";

// Define the types for the marker position
export interface LatLng {
  lat: number;
  lng: number;
}

// Define MarkerType enum for different marker icons
export type MarkerType = 'attraction' | 'guide' | 'user' | 'poi';

export interface IMarker {
  id?: string | number;
  position: LatLng;
  title?: string;
  popup?: string;
  customIcon?: boolean;
  markerType?: MarkerType;
  isLive?: boolean;
  userId?: string | number;
  directionsUrl?: string; // URL for Google Maps directions
}

// Props interface for MapView component
interface MapViewProps {
  center?: LatLng;
  zoom?: number;
  markers?: IMarker[];
  onMapClick?: (latlng: LatLng) => void;
  onMarkerClick?: (marker: IMarker) => void;
  bottomSheetOpen?: boolean;
  onBottomSheetOpenChange?: (isOpen: boolean) => void;
  bottomSheetContent?: React.ReactNode;
  className?: string;
  enableDragging?: boolean;
}

// Define map controller interface for ref
interface MapController {
  setView: (center: [number, number], zoom: number) => void;
  getZoom: () => number | null;
  getCenter: () => { lat: number, lng: number } | null;
  panTo: (center: [number, number]) => void;
}

// Add error handling for map initialization
const tryInitMap = (container: HTMLElement, options: L.MapOptions): L.Map | null => {
  try {
    // Apply Leaflet fixes before initializing
    fixLeafletMapErrors();
    
    // Create map with error handling
    return L.map(container, {
      ...options,
      // Set fadeAnimation to false to avoid _leaflet_pos errors
      fadeAnimation: false
    });
  } catch (error) {
    console.error('[MapView] Error initializing map:', error);
    return null;
  }
};

// Convert to forwardRef
const MapView = forwardRef<MapController, MapViewProps>(({
  center = { lat: 19.076, lng: 72.8777 }, // Mumbai as default center
  zoom = 12,
  markers = [],
  onMapClick,
  onMarkerClick,
  bottomSheetOpen = true,
  onBottomSheetOpenChange,
  bottomSheetContent,
  className = "",
  enableDragging = true,
}, ref) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const [dragPosition, setDragPosition] = useState<number | null>(null);
  const [startDragY, setStartDragY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [bottomSheetHeight, setBottomSheetHeight] = useState<number>(
    bottomSheetOpen ? 300 : 80
  );

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    setView: (center: [number, number], zoom: number) => {
      if (mapRef.current) {
        mapRef.current.setView(center, zoom);
      }
    },
    getZoom: () => {
      if (mapRef.current) {
        return mapRef.current.getZoom();
      }
      return null;
    },
    getCenter: () => {
      if (mapRef.current) {
        const center = mapRef.current.getCenter();
        return { lat: center.lat, lng: center.lng };
      }
      return null;
    },
    panTo: (center: [number, number]) => {
      if (mapRef.current) {
        mapRef.current.panTo(center);
      }
    }
  }));

  // Function to force close the sheet
  const forceCloseSheet = () => {
    if (onBottomSheetOpenChange) {
      onBottomSheetOpenChange(false);
    }
    setBottomSheetHeight(80);
    setDragPosition(null);
    setStartDragY(null);
    setIsDragging(false);
  };
  
  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Create map instance
      mapRef.current = tryInitMap(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom,
        zoomControl: false,
        // @ts-ignore - 'tap' is valid in Leaflet but not in TypeScript definitions
        tap: true,
        // Enable touch gestures for mobile
        touchZoom: true,
        dragging: true,
        doubleClickZoom: true, 
        scrollWheelZoom: true,
        boxZoom: true,
        keyboard: true
      });
      
      // Add tile layer - using OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(mapRef.current!);
      
      // Add zoom control to top right
      L.control.zoom({ position: "topright" }).addTo(mapRef.current!);
      
      // Enhanced touch handling for mobile
      if (L.Browser.touch && L.Browser.mobile) {
        // Ensure pinch-to-zoom works smoothly
        mapRef.current.options.bounceAtZoomLimits = false;
        
        // Improve touch detection for markers
        const mapEl = mapContainerRef.current;
        if (mapEl) {
          mapEl.addEventListener('touchstart', (e) => {
            // Don't prevent default to allow normal touch gestures
            e.stopPropagation();
          }, { passive: true });
        }
      }
      
      // Handle map click events if callback provided
      if (onMapClick && mapRef.current) {
        mapRef.current.on("click", (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          onMapClick({ lat, lng });
        });
      }
    }

    // Cleanup function
      return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map center and zoom if props change
  useEffect(() => {
    if (mapRef.current) {
      console.log("Updating map center:", center);
      mapRef.current.setView([center.lat, center.lng], zoom);
      
      // Add or update user location marker
      if (markersRef.current['userLocation']) {
        markersRef.current['userLocation'].setLatLng([center.lat, center.lng]);
      } else {
        // Create a custom icon for user location
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: '<div class="user-location-dot"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        // Add user location marker
        markersRef.current['userLocation'] = L.marker([center.lat, center.lng], {
          icon: userIcon,
          zIndexOffset: 1000
        }).addTo(mapRef.current);
      }
    }
  }, [center, zoom]);

  // Add styles for user location marker
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .user-location-marker {
        background: none;
        border: none;
      }
      .user-location-dot {
        width: 20px;
        height: 20px;
        background-color: #4285F4;
        border: 4px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 2px #4285F4;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Helper function to validate coordinates
  const isValidLatLng = (lat: number, lng: number): boolean => {
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };

  // Create custom marker icons for different marker types
  const getMarkerIcon = (markerType: MarkerType = 'attraction', isLive: boolean = false) => {
    let iconUrl = '';
    let iconSize: [number, number] = [25, 41];
    
    switch (markerType) {
      case 'attraction':
        iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png';
        break;
      case 'guide':
        iconUrl = isLive 
          ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
          : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
        break;
      case 'user':
        iconUrl = isLive
          ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'
          : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';
        break;
      case 'poi':
        iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png';
        break;
      default:
        iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';
    }
    
    // Custom HTML icon for live tracking with pulsating effect
    if (isLive) {
      const pulseColor = markerType === 'guide' ? '#22c55e' : '#3b82f6';
      
      return L.divIcon({
        className: 'custom-live-marker',
        html: `
          <div class="live-marker-container">
            <div class="live-marker-pulse" style="background-color: ${pulseColor}"></div>
            <div class="live-marker-dot" style="background-color: ${pulseColor}"></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
    }
    
    return L.icon({
      iconUrl,
      iconSize,
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      shadowSize: [41, 41],
    });
  };

  // Update markers when props change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers except userLocation
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (id !== 'userLocation') {
        marker.remove();
        delete markersRef.current[id];
      }
    });

    // Add new markers
    markers.forEach((marker, index) => {
      const markerId = marker.id?.toString() || marker.userId?.toString() || `marker-${index}`;
      const { position, title = "", popup = "", customIcon = false, markerType = 'attraction', isLive = false } = marker;
      
      // Skip invalid coordinates to prevent errors
      if (!isValidLatLng(position.lat, position.lng)) {
        console.warn(`Invalid coordinates for marker ${markerId}: [${position.lat}, ${position.lng}]`);
        return;
      }

      // Use the appropriate icon based on marker type and live status
      const markerInstance = customIcon || isLive
        ? L.marker([position.lat, position.lng], { icon: getMarkerIcon(markerType, isLive) })
        : L.marker([position.lat, position.lng]);

      // Create a custom popup that includes live status if applicable
      const popupContent = isLive 
        ? `<div>
             <div class="font-bold">${title || 'Location'}</div>
             <div>${popup || ''}</div>
             <div class="mt-1 text-sm flex items-center">
               <span class="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
               <span class="text-green-600">Live location</span>
             </div>
           </div>`
        : popup;

      if (popupContent) {
        markerInstance.bindPopup(popupContent);
      }

      // Add marker to map
      markerInstance.addTo(mapRef.current!);

      // Handle marker click event if callback provided
      if (onMarkerClick) {
        markerInstance.on("click", () => {
          onMarkerClick(marker);
        });
      }

      // Store marker reference for future updates
      markersRef.current[markerId] = markerInstance;
    });
  }, [markers]);

  // Handle bottom sheet open/close
  useEffect(() => {
    setBottomSheetHeight(bottomSheetOpen ? 300 : 80);
  }, [bottomSheetOpen]);

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!enableDragging) return;
    
    // Only prevent default for mouse events to avoid breaking touch scrolling
    if (!("touches" in e)) {
      e.preventDefault();
    }
    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setStartDragY(clientY);
    setIsDragging(true);
    
    // Add a class to the body to prevent scrolling
    document.body.classList.add('bottom-sheet-dragging');
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (startDragY === null || !isDragging) return;
    
    // Only prevent default for mouse events to avoid breaking touch scrolling
    if (!("touches" in e)) {
      e.preventDefault();
    }
    
    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const deltaY = startDragY - clientY;
    
    // Calculate new position
    const newPosition = Math.max(
      80,
      Math.min(bottomSheetHeight + deltaY, 500)
    );
    
    setDragPosition(newPosition);
  };

  const handleDragEnd = () => {
    if (startDragY === null || !enableDragging) return;
    
    // Use dragPosition if available, otherwise fall back to the current bottomSheetHeight
    const threshold = 150;
    const currentPosition = dragPosition !== null ? dragPosition : bottomSheetHeight;
    const newOpen = currentPosition > threshold;
    
    if (onBottomSheetOpenChange) {
      onBottomSheetOpenChange(newOpen);
    }
    
    setBottomSheetHeight(newOpen ? 300 : 80);
    setDragPosition(null);
    setStartDragY(null);
    setIsDragging(false);
    
    // Remove the class from the body
    document.body.classList.remove('bottom-sheet-dragging');
  };

  // Properly handle global mouse move and mouse up for dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        const deltaY = startDragY! - e.clientY;
        const newPosition = Math.max(
          80,
          Math.min(bottomSheetHeight + deltaY, 500)
        );
        setDragPosition(newPosition);
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches && e.touches.length > 0) {
        const deltaY = startDragY! - e.touches[0].clientY;
        const newPosition = Math.max(
          80,
          Math.min(bottomSheetHeight + deltaY, 500)
        );
        setDragPosition(newPosition);
      }
    };

    const handleGlobalEnd = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    // Add global event listeners
    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalEnd);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
      document.addEventListener('touchend', handleGlobalEnd);
    }

    // Clean up
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isDragging, startDragY, bottomSheetHeight]);

  // Update height when bottomSheetOpen changes
  useEffect(() => {
    setBottomSheetHeight(bottomSheetOpen ? 300 : 80);
  }, [bottomSheetOpen]);

  // Add styles for live location marker
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .user-location-marker {
        background: none;
        border: none;
      }
      .user-location-dot {
        width: 20px;
        height: 20px;
        background-color: #4285F4;
        border: 4px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 2px #4285F4;
      }
      
      /* Live location marker styles */
      .custom-live-marker {
        background: none;
        border: none;
      }
      .live-marker-container {
        position: relative;
        width: 40px;
        height: 40px;
      }
      .live-marker-dot {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: #3b82f6;
        border: 3px solid white;
        box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
        z-index: 2;
      }
      .live-marker-pulse {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #3b82f6;
        opacity: 0.4;
        z-index: 1;
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0% {
          transform: translate(-50%, -50%) scale(0.5);
          opacity: 0.4;
        }
        70% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0;
        }
        100% {
          transform: translate(-50%, -50%) scale(0.5);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full leaflet-container"></div>
      
     
      
      {/* Fixed minimize button that's always visible when sheet is open */}
      {bottomSheetContent && bottomSheetOpen && (
        <Button
          size="sm"
          variant="secondary"
          className="absolute left-4 bottom-4 z-[46] rounded-full shadow-md bg-white opacity-80 hover:opacity-100 h-10 w-10 p-0"
          onClick={() => forceCloseSheet()}
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
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </Button>
      )}
      
      {/* Use the shadcn/ui Sheet component for the bottom sheet */}
      {bottomSheetContent && (
        <Sheet open={bottomSheetOpen} onOpenChange={onBottomSheetOpenChange}>
          <SheetContent 
            side="bottom" 
            className="h-[60vh] px-0 rounded-t-xl overflow-hidden bottom-sheet"
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-center py-2 border-b border-gray-100 bottom-sheet-drag relative z-[999]">
                <div 
                  className="w-16 h-2.5 bg-gray-400 rounded-full cursor-grab shadow-sm hover:bg-gray-500 transition-colors"
                  onMouseDown={enableDragging ? handleDragStart : undefined}
                  onTouchStart={enableDragging ? handleDragStart : undefined}
                  style={{ position: 'relative', top: 0, touchAction: 'none' }}
                ></div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {bottomSheetContent}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
});

export default MapView;