// Geolocation utility functions

/**
 * Gets the current position of the user
 * @returns Promise with coordinates
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    }
  });
};

/**
 * Calculates the distance between two coordinates in kilometers
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  // Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
};

/**
 * Converts degrees to radians
 */
const deg2rad = (deg: number): number => {
  return deg * (Math.PI/180);
};

/**
 * Randomly generates a location within a radius from a center point
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param radiusInKm Radius in kilometers
 * @returns Random coordinates {lat, lng}
 */
export const getRandomLocation = (
  centerLat: number, 
  centerLng: number, 
  radiusInKm: number
): {lat: number, lng: number} => {
  // Convert radius from kilometers to degrees
  const radiusInDegrees = radiusInKm / 111.32;
  
  // Generate random distance within radius
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  
  // Adjust the x-coordinate for the shrinking of the east-west distances
  const newLng = x / Math.cos(deg2rad(centerLat)) + centerLng;
  const newLat = y + centerLat;
  
  return {
    lat: newLat,
    lng: newLng
  };
};

/**
 * Format for displaying coordinates nicely
 * @param lat Latitude
 * @param lng Longitude
 * @returns Formatted string
 */
export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};