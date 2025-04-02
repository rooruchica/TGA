import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define a base user type
type BaseUser = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  userType: 'tourist' | 'guide';
  createdAt: string | Date; // Allow string for initial parse from JSON
};

// User type with isGuide property
export interface User extends BaseUser {
  isGuide: boolean;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => { throw new Error("AuthProvider not initialized"); },
  logout: () => {},
  isLoading: false
});

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    console.log("AuthProvider initializing...");
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        console.log("Found stored user data, attempting to parse");
        const parsedUser = JSON.parse(storedUser);
        console.log("Parsed user:", parsedUser);
        
        // Make sure the isGuide property is set for existing users
        if (parsedUser.isGuide === undefined) {
          console.log("Setting isGuide property based on userType:", parsedUser.userType);
          parsedUser.isGuide = parsedUser.userType === 'guide';
          localStorage.setItem("user", JSON.stringify(parsedUser));
        }
        
        setUser(parsedUser);
        console.log("User successfully set from localStorage");
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        localStorage.removeItem("user");
      }
    } else {
      console.log("No stored user found");
    }
    setIsLoading(false);
    console.log("AuthProvider initialization complete, isLoading set to false");
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<User> => {
    try {
      console.log("Login attempt started for user:", username);
      setIsLoading(true);
      
      // Use fetch directly
      console.log("Sending login request to API");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      
      console.log("API response received, status:", response.status);
      
      // Parse the response body
      const data = await response.json();
      console.log("API response data:", data);
      
      // Check if login was successful
      if (!response.ok) {
        console.error("Login failed, API error:", data.message);
        throw new Error(data.message || "Login failed");
      }
      
      // Add the isGuide property based on userType
      console.log("Creating user data with isGuide property based on userType:", data.userType);
      const userData: User = {
        ...data,
        isGuide: data.userType === 'guide'
      };
      
      console.log("Setting user in state:", userData);
      setUser(userData);
      
      console.log("Storing user in localStorage");
      localStorage.setItem("user", JSON.stringify(userData));
      
      console.log("Login successful");
      return userData;
    } catch (error) {
      console.error("Login error details:", error);
      throw error;
    } finally {
      setIsLoading(false);
      console.log("Login process complete, isLoading set to false");
    }
  };

  // Logout function
  const logout = () => {
    console.log("Logging out user");
    setUser(null);
    localStorage.removeItem("user");
    console.log("User logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error("useAuth must be used within an AuthProvider");
  }
  return context;
}