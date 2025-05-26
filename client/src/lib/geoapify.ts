import { apiRequest } from "./queryClient";

const GEOAPIFY_API_KEY = "1b6a6068e8704c89813a9c10591c4881";

// Places types to search for
export enum PlaceCategory {
  ATTRACTION = "tourism.attraction",
  HOTEL = "accommodation.hotel",
  RESTAURANT = "catering.restaurant",
  MEDICAL = "healthcare.pharmacy",
  ATM = "service.financial.atm",
  SHOPPING = "commercial.shopping_mall"
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeoapifyPlace {
  place_id: string;
  name?: string;
  address_line1?: string;
  address_line2?: string;
  categories?: string[];
  lat: number;
  lon: number;
  distance?: number;
}

interface GeoapifyResponse {
  features: Array<{
    type: string;
    properties: GeoapifyPlace;
    geometry: {
      type: string;
      coordinates: [number, number];
    };
  }>;
}

// Get places around a location
export const getPlacesNearby = async (
  center: Coordinates,
  category: PlaceCategory,
  radius = 5000,
  limit = 20
): Promise<GeoapifyPlace[]> => {
  try {
    const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${center.lng},${center.lat},${radius}&limit=${limit}&apiKey=${GEOAPIFY_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json() as GeoapifyResponse;
    
    return data.features.map(feature => ({
      ...feature.properties,
      lat: feature.properties.lat,
      lon: feature.properties.lon
    }));
  } catch (error) {
    console.error("Error fetching places:", error);
    return [];
  }
};

// Geocode an address to coordinates
export const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${GEOAPIFY_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates;
      return { lat, lng };
    }
    
    return null;
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
};

// Reverse geocode coordinates to address
export const reverseGeocode = async (coords: Coordinates): Promise<string | null> => {
  try {
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${coords.lat}&lon=${coords.lng}&apiKey=${GEOAPIFY_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].properties.formatted;
    }
    
    return null;
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return null;
  }
};

// Get route between two points
export const getRoute = async (
  from: Coordinates,
  to: Coordinates,
  mode = "drive"
): Promise<any> => {
  try {
    const url = `https://api.geoapify.com/v1/routing?waypoints=${from.lat},${from.lng}|${to.lat},${to.lng}&mode=${mode}&apiKey=${GEOAPIFY_API_KEY}`;
    
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error("Error getting route:", error);
    return null;
  }
};
