// API configuration for the application
// In production, we use the BACKEND_URL from env, falling back to relative URL to ensure it works correctly when deployed
// In development, we use localhost:10000
export const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_BACKEND_URL || 'https://tga-8py8.onrender.com') // Use Render URL in production
  : 'http://localhost:10000';

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