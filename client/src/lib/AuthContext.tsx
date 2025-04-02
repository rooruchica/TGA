import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define a base user type
type BaseUser = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  userType: string;
  createdAt: string | Date;
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

// Create the auth context
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
    
    try {
      const storedUser = localStorage.getItem("user");
      
      if (storedUser) {
        console.log("Found stored user data");
        const parsedUser = JSON.parse(storedUser);
        
        // Make sure the isGuide property is set
        const userData: User = {
          ...parsedUser,
          isGuide: parsedUser.userType === 'guide'
        };
        
        setUser(userData);
        console.log("User loaded from localStorage");
      } else {
        console.log("No stored user found");
      }
    } catch (error) {
      console.error("Error loading user:", error);
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
      console.log("AuthProvider initialization complete");
    }
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<User> => {
    console.log("Login attempt for:", username);
    setIsLoading(true);
    
    try {
      // Make the API request
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      console.log("API response status:", response.status);
      
      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Authentication failed");
      }
      
      // Parse successful response
      const data = await response.json();
      console.log("Login success, data:", data);
      
      // Create the user object with isGuide property
      const userData: User = {
        ...data,
        isGuide: data.userType === 'guide'
      };
      
      // Update state and localStorage
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      
      return userData;
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
    setUser(null);
    localStorage.removeItem("user");
  };

  // Create context value
  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isLoading
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