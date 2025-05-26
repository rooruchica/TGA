import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api-client";
import { checkServerAndShowError } from "@/lib/check-server";


// Import components
import WelcomeScreen from "@/components/welcome-screen";
import LoginScreen from "@/components/login-screen";
import RegisterScreen from "@/components/register-screen";

// Import tourist pages
import Dashboard from "@/pages/dashboard";
import SearchPage from "@/pages/search";
import TransportBooking from "@/pages/transport-booking";
import HotelBooking from "@/pages/hotel-booking";
import TripPlanner from "@/pages/trip-planner";
import Connections from "@/pages/connections";
import Profile from "@/pages/profile";
import GuideProfile from "@/pages/guide-profile";
import NotFound from "@/pages/not-found";
import ItineraryDetails from "@/pages/itinerary/[id]";

// Import guide pages
import GuideDashboard from "@/pages/guide-dashboard";
import GuideRequests from "@/pages/guide-requests";
import GuideItineraries from "@/pages/guide-itineraries";
import GuideConnections from "@/pages/guide-connections";

// Import Auth0 demo page
import Auth0DemoPage from "@/pages/auth0-demo-page";



// Define user type
export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  userType: string;
  isGuide: boolean;
  createdAt: string | Date;
}

// Authentication context directly in App
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const [serverChecked, setServerChecked] = useState(false);
  
  // Check if backend server is running
  useEffect(() => {
    async function checkServer() {
      const isServerRunning = await checkServerAndShowError();
      setServerChecked(true);
      if (!isServerRunning) {
        setIsLoading(false);
      }
    }
    
    checkServer();
  }, []);
  
  // Check if user is already logged in (only after server check)
  useEffect(() => {
    if (!serverChecked) return;
    
    try {
      const storedUser = localStorage.getItem("user");
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id) {
            setUser({
              ...parsedUser,
              isGuide: parsedUser.userType === 'guide'
            });
            console.log("User loaded from localStorage:", parsedUser.id);
          } else {
            console.error("Invalid user data in localStorage:", parsedUser);
            localStorage.removeItem("user");
          }
        } catch (parseError) {
          console.error("Error parsing user data:", parseError);
          localStorage.removeItem("user");
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  }, [serverChecked]);
  
  // Login function
  const login = async (username: string, password: string): Promise<User> => {
    setIsLoading(true);
    
    try {
      // Check if username is an email
      const email = username.includes('@') ? username : undefined;
      
      const data = await fetchApi<User>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email }),
      });
      
      // Create user object with isGuide property
      const userData: User = {
        ...data,
        isGuide: data.userType === 'guide'
      };
      
      // Update state and localStorage
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      
      return userData;
    } catch (error: any) {
      throw new Error(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setLocation("/");
  };
  
  // Export authentication functions and state to window
  // This makes auth state accessible globally for all components
  useEffect(() => {
    console.log("Setting global auth state with user:", user);
    (window as any).auth = { 
      user, 
      login, 
      logout, 
      setUser,
      isAuthenticated: !!user
    };
  }, [user]);
  
  // Redirect users based on their role after login
  useEffect(() => {
    if (!isLoading && user) {
      const currentPath = window.location.pathname;
      
      // If user is at root, login, or register page, redirect to appropriate dashboard
      if (['/', '/login', '/register'].includes(currentPath)) {
        if (user.isGuide) {
          setLocation('/guide-dashboard');
        } else {
          setLocation('/dashboard');
        }
      }
      
      // If guide tries to access tourist pages or tourist tries to access guide pages, redirect
      const guidePaths = ['/guide-dashboard', '/guide-requests', '/guide-itineraries', '/guide-connections'];
      const touristPaths = ['/dashboard', '/search', '/transport-booking', '/hotel-booking', '/trip-planner', '/connections'];
      
      if (user.isGuide && touristPaths.includes(currentPath)) {
        setLocation('/guide-dashboard');
      } else if (!user.isGuide && guidePaths.includes(currentPath)) {
        setLocation('/dashboard');
      }
    }
  }, [user, isLoading, setLocation]);

  // Pass login function to login screen through props
  const LoginScreenWithAuth = () => <LoginScreen login={login} />;
  
  // Show loading state
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div id="app-container" className="h-screen flex flex-col">
      <Switch>
        {/* Public routes */}
        <Route path="/" component={WelcomeScreen} />
        <Route path="/login" component={LoginScreenWithAuth} />
        <Route path="/register" component={RegisterScreen} />
        <Route path="/auth0-demo" component={Auth0DemoPage} />
        
        
        {/* Protected routes - only accessible when logged in */}
        {user ? (
          <>
            {/* Tourist routes - only show if user is not a guide */}
            {!user.isGuide && (
              <>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/search" component={SearchPage} />
                <Route path="/transport-booking" component={TransportBooking} />
                <Route path="/hotel-booking" component={HotelBooking} />
                <Route path="/trip-planner" component={TripPlanner} />
                <Route path="/connections" component={Connections} />
                <Route path="/profile" component={() => <Profile user={user} logout={logout} />} />
                <Route path="/itinerary/:id" component={ItineraryDetails} />
              </>
            )}
            
            {/* Guide routes - only show if user is a guide */}
            {user.isGuide && (
              <>
                <Route path="/guide-dashboard" component={GuideDashboard} />
                <Route path="/guide-requests" component={GuideRequests} />
                <Route path="/guide-itineraries" component={GuideItineraries} />
                <Route path="/guide-connections" component={GuideConnections} />
                <Route path="/guide-profile" component={GuideProfile} />
                <Route path="/itinerary/:id" component={ItineraryDetails} />
              </>
            )}
          </>
        ) : (
          // Redirect to login if trying to access protected routes while not logged in
          <Route path="/:rest*">
            {(params: any) => {
              if (params.rest && !['', 'login', 'register', 'auth0-demo'].includes(params.rest)) {
                setLocation('/login');
                return null;
              }
              return <NotFound />;
            }}
          </Route>
        )}
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

export default App;
