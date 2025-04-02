import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define a base user type
type BaseUser = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  userType: 'tourist' | 'guide';
  createdAt: Date;
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
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Make sure the isGuide property is set for existing users
        if (parsedUser.isGuide === undefined) {
          parsedUser.isGuide = parsedUser.userType === 'guide';
          localStorage.setItem("user", JSON.stringify(parsedUser));
        }
        
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<User> => {
    try {
      setIsLoading(true);
      
      // Use fetch directly
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      
      // Parse the response body
      const data = await response.json();
      
      // Check if login was successful
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      
      // Add the isGuide property based on userType
      const userData: User = {
        ...data,
        isGuide: data.userType === 'guide'
      };
      
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
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
  return context;
}