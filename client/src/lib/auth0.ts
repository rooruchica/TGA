import { createAuth0Client } from '@auth0/auth0-spa-js';
import type { User } from '@/pages/App';
import { fetchApi } from './api-client';

// Auth0 configuration with actual credentials
const AUTH0_DOMAIN = 'dev-mzsae02min4hvqu8.us.auth0.com';
const AUTH0_CLIENT_ID = 'F2hU5dW4kyln6nzCUDFwvTubyDZX2npw';
const AUTH0_CLIENT_SECRET = 'bhTVSVO6wSJzSa0-7WZPmT9GPiSwgCXCLyyOz-HLYwwKu-0H6-Roy6R6c0WV4YUl';
const AUTH0_REDIRECT_URI = window.location.origin;

// Initialize Auth0 client
let auth0Client: any = null;

export const initAuth0 = async () => {
  if (!auth0Client) {
    auth0Client = await createAuth0Client({
      domain: AUTH0_DOMAIN,
      clientId: AUTH0_CLIENT_ID,
      authorizationParams: {
        redirect_uri: AUTH0_REDIRECT_URI
      }
    });
  }
  return auth0Client;
};

// Login with Auth0 phone passwordless
export const loginWithPhone = async (phoneNumber: string): Promise<string> => {
  try {
    const client = await initAuth0();
    
    // Start the passwordless flow
    await client.loginWithRedirect({
      authorizationParams: {
        connection: 'sms',
        phoneNumber: phoneNumber,
        prompt: 'login'
      }
    });
    
    // This will redirect the user away from your app to Auth0
    // When they return, you'll need to handle the callback
    
    return "Redirecting to Auth0...";
  } catch (error: any) {
    console.error("Auth0 phone login error:", error);
    throw new Error(error.message || "Auth0 phone authentication failed");
  }
};

// Handle Auth0 authentication callback
export const handleAuth0Callback = async (): Promise<User | null> => {
  try {
    const client = await initAuth0();
    
    // Check if this is a callback URL
    if (window.location.search.includes('code=')) {
      // Handle the redirect callback
      await client.handleRedirectCallback();
      
      // Get user info
      const isAuthenticated = await client.isAuthenticated();
      
      if (isAuthenticated) {
        const auth0User = await client.getUser();
        const token = await client.getTokenSilently();
        
        // Now connect with our backend to either login or register
        const backendUser = await fetchApi<User>("/api/auth/auth0-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            token,
            email: auth0User.email,
            name: auth0User.name,
            phoneNumber: auth0User.phone_number,
            authProvider: "auth0"
          }),
        });
        
        // Create user object with isGuide property
        const userData: User = {
          ...backendUser,
          isGuide: backendUser.userType === 'guide'
        };
        
        // Update localStorage
        localStorage.setItem("user", JSON.stringify(userData));
        
        // Update global auth state
        if ((window as any).auth) {
          (window as any).auth.user = userData;
          (window as any).auth.isAuthenticated = true;
        }
        
        return userData;
      }
    }
    
    return null;
  } catch (error: any) {
    console.error("Auth0 callback error:", error);
    throw new Error(error.message || "Auth0 authentication callback failed");
  }
};

// Check if user is authenticated with Auth0
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const client = await initAuth0();
    return await client.isAuthenticated();
  } catch (error) {
    console.error("Auth0 authentication check error:", error);
    return false;
  }
};

// Get Auth0 user profile
export const getUser = async () => {
  try {
    const client = await initAuth0();
    const isAuth = await client.isAuthenticated();
    
    if (isAuth) {
      return await client.getUser();
    }
    return null;
  } catch (error) {
    console.error("Auth0 get user error:", error);
    return null;
  }
};

// Logout from Auth0
export const logoutFromAuth0 = async () => {
  try {
    const client = await initAuth0();
    await client.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  } catch (error) {
    console.error("Auth0 logout error:", error);
  }
}; 