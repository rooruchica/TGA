// API client for making fetch requests with consistent error handling

// Base URL for API requests - use the deployed backend for all environments
export const API_BASE_URL = 'https://tga-8py8.onrender.com';

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

// Configuration for API requests
const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000; // 1 second between retries

/**
 * Sleep function for delay between retries
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Creates an AbortSignal with timeout
 * @param timeoutMs - Timeout in milliseconds
 */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(new Error('Request timeout')), timeoutMs);
  return controller.signal;
}

/**
 * Handles API fetch requests with error handling and retries
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
  
  // Add timeout if not already specified
  if (!options.signal) {
    options.signal = createTimeoutSignal(DEFAULT_TIMEOUT_MS);
  }
  
  // Initialize retry counter
  let retries = 0;
  let lastError: Error | null = null;
  
  // Try the request with retries
  while (retries <= MAX_RETRIES) {
    try {
      if (retries > 0) {
        console.log(`Retry attempt ${retries}/${MAX_RETRIES} for ${fullUrl}`);
        // Wait before retry (exponential backoff)
        await sleep(RETRY_DELAY_MS * retries);
      }
      
      console.log(`Fetching API (${retries > 0 ? 'retry ' + retries : 'initial'}): ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        // Add cache control to avoid stale responses
        cache: 'no-cache',
      });

      // Handle non-OK response
      if (!response.ok) {
        // Try to parse error response
        let errorMessage = `API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage += `. ${errorData.message || ''}`;
        } catch {
          // If we can't parse JSON, try to get response text
          try {
            const errorText = await response.text();
            if (errorText) errorMessage += `. ${errorText}`;
          } catch {
            // Ignore if we can't get text either
          }
        }
        
        // For certain status codes, don't retry (4xx client errors)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(errorMessage);
        }
        
        // For 5xx server errors, retry
        lastError = new Error(errorMessage);
        throw lastError;
      }

      // If no content, return empty object
      if (response.status === 204) {
        return {} as T;
      }
      
      // Check if the response has content
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        console.warn(`Response is not JSON: ${contentType}`);
        return {} as T;
      }
    } catch (error: any) {
      lastError = error;
      
      // Don't retry client aborts or timeouts
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        throw new Error(`Request failed: ${error.message}`);
      }
      
      // Don't retry if fetch is not available (offline)
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
        throw new Error('Network connection unavailable. Please check your internet connection.');
      }
      
      // If we've exhausted retries, throw the last error
      if (retries >= MAX_RETRIES) {
        break;
      }
      
      retries++;
    }
  }
  
  // If we get here, all retries failed
  console.error(`API request failed after ${MAX_RETRIES} retries for ${fullUrl}:`, lastError);
  throw lastError || new Error(`API request failed after ${MAX_RETRIES} retries`);
} 