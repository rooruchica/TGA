import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getApiUrl } from './api-client';

// Define a base user type
type BaseUser = {
  id: number | string;
  username?: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  profilePicture?: string;
  createdAt?: string | Date;
};

// User type with isGuide property
export interface User extends BaseUser {
  isGuide: boolean;
  userType?: 'guide' | 'tourist';
}

// Auth context type
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
  isLoggedIn: boolean;
}

// Create the auth context
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => { throw new Error("AuthProvider not initialized"); },
  logout: () => {},
  isLoading: false,
  isLoggedIn: false
});

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Set user in global window object for compatibility with existing components
const setGlobalUser = (user: User | null) => {
  if (user) {
    (window as any).auth = { user };
    console.log("Set global user in window.auth:", user);
  } else {
    (window as any).auth = null;
    console.log("Cleared global user from window.auth");
  }
};

// Helper function to create mock user data for demo logins
export const createMockUser = (role: 'tourist' | 'guide'): User => {
  return {
    id: role === 'guide' ? '101' : '102',
    username: role,
    name: role === 'guide' ? 'Guide Demo' : 'Tourist Demo',
    email: `${role}@example.com`,
    phone: '+91 9876543210',
    role: role,
    createdAt: new Date().toISOString(),
    isGuide: role === 'guide',
    userType: role
  };
};

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialization - check for stored user instead of auto-creating a guide
  useEffect(() => {
    console.log("AuthProvider initializing...");
    setIsLoading(true);
    
    try {
      // Look for stored user in localStorage
      const storedUser = localStorage.getItem("user");
      
      if (storedUser) {
        // Parse the stored user
        const userData = JSON.parse(storedUser);
        console.log("Found existing user in localStorage:", userData);
        
        // Set user in state
        setUser(userData);
        
        // Set in global window object
        setGlobalUser(userData);
      } else {
        console.log("No user found in localStorage");
        // No auto-login - user needs to log in manually
      }
    } catch (error) {
      console.error("Error loading stored user:", error);
    } finally {
      // Complete initialization
      setIsLoading(false);
      console.log("AuthProvider initialization complete");
    }
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<User> => {
    console.log("Login attempt for:", username);
    setIsLoading(true);
    
    try {
      // Use the getApiUrl function to ensure proper backend URL
      const loginUrl = getApiUrl('/api/auth/login');
      console.log("Using login URL:", loginUrl);
      
      // Make a real API request to the backend
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          password,
          // Also include email if username is in email format
          email: username.includes('@') ? username : undefined
        }),
        credentials: 'include'
      });
      
      // Check if request was successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      // Parse response data
      const userData = await response.json();
      
      // Create user object with proper properties
      const processedUser: User = {
        id: userData.id || userData._id,
        username: userData.username,
        name: userData.fullName || userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.userType,
        createdAt: userData.createdAt,
        isGuide: userData.userType === 'guide',
        userType: userData.userType
      };
      
      console.log("Login successful with user data:", processedUser);
      
      // Update state
      setUser(processedUser);
      
      // Set in global window object
      setGlobalUser(processedUser);
      
      // Save to localStorage
      localStorage.setItem("user", JSON.stringify(processedUser));
      
      return processedUser;
    } catch (error: any) {
      console.error("Login failed:", error.message || error);
      throw new Error(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    console.log("Logging out");
    
    // Clear user state
    setUser(null);
    
    // Clear from global window object
    setGlobalUser(null);
    
    // Remove from localStorage
    localStorage.removeItem("user");
    
    console.log("Logout complete");
  };

  // Debug output for user state changes
  useEffect(() => {
    console.log("User state changed:", user);
    if (user) {
      console.log("User type:", user.role);
      console.log("Is guide:", user.isGuide);
      console.log("Window auth object:", (window as any).auth);
    }
  }, [user]);

  // Create context value
  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isLoggedIn: !!user
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context;
}