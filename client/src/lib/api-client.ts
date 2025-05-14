// API configuration for the application
export const API_BASE_URL = 'http://localhost:5000';

/**
 * Creates a full API URL by appending the path to the base URL
 * @param path - The API path, should start with a slash
 * @returns The complete API URL
 */
export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

/**
 * Handles API fetch requests with error handling
 * @param url - The API URL or path
 * @param options - Fetch options
 * @returns Promise with the JSON response
 */
export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  // If the URL doesn't start with http, assume it's a relative path
  const fullUrl = url.startsWith('http') ? url : getApiUrl(url);
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
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