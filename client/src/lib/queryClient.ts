import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Ensure URL starts with '/api' to be correctly proxied
  const apiUrl = url.startsWith('/api') ? url : `/api${url}`;
  
  console.log(`Making ${method} request to: ${apiUrl}`);
  if (data) {
    console.log('Request payload:', JSON.stringify(data));
  }
  
  try {
    const res = await fetch(apiUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log(`Response status: ${res.status} ${res.statusText}`);
    
    // Clone the response to log the body while preserving the original
    if (!res.ok) {
      const clonedRes = res.clone();
      try {
        const errorText = await clonedRes.text();
        console.error(`Error response: ${errorText}`);
      } catch (e) {
        console.error('Could not read error response body');
      }
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`Request to ${apiUrl} failed:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
