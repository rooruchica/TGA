// @ts-ignore
// eslint-disable-next-line
interface Window { google: any; }

import { useEffect, useRef } from "react";

const GOOGLE_MAPS_API_KEY = "AIzaSyDP_WWujZfWVS5zVnThVnZP7cFLCicWuwI";

const loadGoogleMapsScript = (callback: () => void) => {
  if (typeof (window as any).google === 'object' && typeof (window as any).google.maps === 'object') {
    callback();
    return;
  }
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
  script.async = true;
  script.onload = callback;
  document.body.appendChild(script);
};

interface LatLng { lat: number; lng: number; }
interface Marker {
  position: LatLng;
  title?: string;
  popup?: string;
  markerType?: string;
  customIcon?: boolean;
  color?: string;
}

interface MapViewProps {
  center?: LatLng;
  zoom?: number;
  markers?: Marker[];
  onMapClick?: (latlng: LatLng) => void;
  onMarkerClick?: (marker: Marker) => void;
  className?: string;
  routePolyline?: LatLng[];
  onMapLoad?: (map: any) => void;
  customMarkerIcons?: Record<string, string>;
}

const BLUE_DOT_SVG =
  'data:image/svg+xml;utf8,<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="10" fill="%23007AFF" fill-opacity="0.9" stroke="white" stroke-width="3"/></svg>';

const MapView = ({
  center = { lat: 19.076, lng: 72.8777 },
  zoom = 12,
  markers = [],
  onMapClick,
  onMarkerClick,
  className = "",
  routePolyline = [],
  onMapLoad,
  customMarkerIcons = {},
}: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markerInstances = useRef<any[]>([]);
  const polylineInstance = useRef<any>(null);

  useEffect(() => {
    loadGoogleMapsScript(() => {
      if (!mapRef.current) return;
      if (!mapInstance.current) {
        mapInstance.current = new (window as any).google.maps.Map(mapRef.current, {
          center,
        zoom,
        });
        if (onMapLoad) onMapLoad(mapInstance.current);
      } else {
        mapInstance.current.setCenter(center);
        mapInstance.current.setZoom(zoom);
      }

      // Clear old markers
      markerInstances.current.forEach((m: any) => m.setMap(null));
      markerInstances.current = [];

      // Add new markers
      markers.forEach((marker: Marker) => {
        let icon = undefined;
        if (marker.customIcon) {
          if (marker.color === 'blue') {
            icon = {
              url: BLUE_DOT_SVG,
              scaledSize: new (window as any).google.maps.Size(32, 32),
            };
          } else if (marker.markerType && customMarkerIcons[marker.markerType]) {
            icon = {
              url: customMarkerIcons[marker.markerType],
              scaledSize: new (window as any).google.maps.Size(32, 32),
            };
          }
        }
        const gMarker = new (window as any).google.maps.Marker({
          position: marker.position,
          map: mapInstance.current,
          title: marker.title,
          icon,
        });
        if (marker.popup) {
          const infowindow = new (window as any).google.maps.InfoWindow({ content: marker.popup });
          gMarker.addListener('click', () => infowindow.open(mapInstance.current, gMarker));
        }
        if (onMarkerClick) {
          gMarker.addListener('click', () => onMarkerClick(marker));
        }
        markerInstances.current.push(gMarker);
      });

      // Draw polyline for route if provided
      if (polylineInstance.current) {
        polylineInstance.current.setMap(null);
        polylineInstance.current = null;
      }
      if (routePolyline && routePolyline.length > 1) {
        polylineInstance.current = new (window as any).google.maps.Polyline({
          path: routePolyline,
          geodesic: true,
          strokeColor: '#007AFF',
          strokeOpacity: 0.95,
          strokeWeight: 7,
        });
        polylineInstance.current.setMap(mapInstance.current);
      }

      // Map click event
      if (onMapClick) {
        mapInstance.current.addListener('click', (e: any) => {
          onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });
      }
    });
    // eslint-disable-next-line
  }, [center, zoom, markers, routePolyline, customMarkerIcons]);
  
  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default MapView;