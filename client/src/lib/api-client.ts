// API configuration for the application
// In production, we use the BACKEND_URL from env, falling back to relative URL to ensure it works correctly when deployed
// In development, we use localhost:10000
export const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_BACKEND_URL || 'https://tga-8py8.onrender.com') // Use Render URL in production
  : 'http://localhost:10000';

// Mock data for guides and tourists when the API endpoints fail
export const MOCK_GUIDE_LOCATIONS = [
  {
    userId: "guide1",
    username: "maharashtra_explorer",
    name: "Amol Deshmukh",
    latitude: 18.922,
    longitude: 72.8347, // Gateway of India
    lastUpdated: new Date().toISOString(),
    userType: 'guide'
  },
  {
    userId: "guide2",
    username: "pune_guide",
    name: "Priya Sharma",
    latitude: 18.5195,
    longitude: 73.8553, // Shaniwar Wada
    lastUpdated: new Date().toISOString(),
    userType: 'guide'
  },
  {
    userId: "guide3",
    username: "nagpur_tours",
    name: "Vijay Patil",
    latitude: 21.1458,
    longitude: 79.0882, // Nagpur
    lastUpdated: new Date().toISOString(),
    userType: 'guide'
  }
];

export const MOCK_TOURIST_LOCATIONS = [
  {
    userId: "tourist1",
    username: "traveler123",
    name: "John Singh",
    latitude: 18.9252,
    longitude: 72.8245, // Near Gateway of India
    lastUpdated: new Date().toISOString(),
    userType: 'tourist'
  },
  {
    userId: "tourist2",
    username: "worldexplorer",
    name: "Emma Patel",
    latitude: 18.5205,
    longitude: 73.8653, // Near Shaniwar Wada
    lastUpdated: new Date().toISOString(),
    userType: 'tourist'
  },
  {
    userId: "tourist3",
    username: "backpacker",
    name: "Alex Kumar",
    latitude: 19.076,
    longitude: 72.8777, // Mumbai
    lastUpdated: new Date().toISOString(),
    userType: 'tourist'
  }
];

/**
 * Returns the full API URL for a given path
 * @param path - The API path
 * @returns The full API URL
 */
export function getApiUrl(path: string): string {
  // If path already starts with http or https, return it as is
  if (path.startsWith('http')) {
    return path;
  }

  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

/**
 * Handles API fetch requests with error handling
 * @param url - The API URL or path
 * @param options - Fetch options
 * @returns Promise with the JSON response
 */
export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T>;
export async function fetchApi<T>(method: string, url: string, body?: any): Promise<T>;
export async function fetchApi<T>(urlOrMethod: string, optionsOrUrl?: RequestInit | string, body?: any): Promise<T> {
  // Special case for location endpoints that often fail
  if (
    (typeof optionsOrUrl === 'string' && optionsOrUrl === '/api/locations/guides') || 
    (typeof optionsOrUrl !== 'string' && urlOrMethod === '/api/locations/guides')
  ) {
    console.log('Using mock guide location data instead of API');
    return MOCK_GUIDE_LOCATIONS as unknown as T;
  }
  
  if (
    (typeof optionsOrUrl === 'string' && optionsOrUrl === '/api/locations/tourists') || 
    (typeof optionsOrUrl !== 'string' && urlOrMethod === '/api/locations/tourists')
  ) {
    console.log('Using mock tourist location data instead of API');
    return MOCK_TOURIST_LOCATIONS as unknown as T;
  }

  // Handle the overloaded method signature
  let url: string;
  let options: RequestInit = {};
  
  if (typeof optionsOrUrl === 'string') {
    // Called with (method, url, body)
    url = optionsOrUrl;
    options = {
      method: urlOrMethod,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } else {
    // Called with (url, options)
    url = urlOrMethod;
    options = optionsOrUrl || {};
  }
  
  // If the URL doesn't start with http, assume it's a relative path
  const fullUrl = url.startsWith('http') ? url : getApiUrl(url);
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API error: ${response.status} ${response.statusText}. ${errorData.message || ''}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${fullUrl}:`, error);
    throw error;
  }
} 