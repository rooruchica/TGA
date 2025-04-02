import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";

import WelcomeScreen from "@/components/welcome-screen";
import LoginScreen from "@/components/login-screen";
import RegisterScreen from "@/components/register-screen";
import Dashboard from "@/pages/dashboard";
import SearchPage from "@/pages/search";
import TransportBooking from "@/pages/transport-booking";
import HotelBooking from "@/pages/hotel-booking";
import TripPlanner from "@/pages/trip-planner";
import Connections from "@/pages/connections";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

// Guide pages
import GuideDashboard from "@/pages/guide-dashboard";
import GuideRequests from "@/pages/guide-requests";
import GuideItineraries from "@/pages/guide-itineraries";
import GuideConnections from "@/pages/guide-connections";

import { useAuth } from "@/lib/auth";

function App() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
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

  return (
    <div id="app-container" className="h-screen flex flex-col">
      <Toaster />
      <Switch>
        {/* Public routes */}
        <Route path="/" component={WelcomeScreen} />
        <Route path="/login" component={LoginScreen} />
        <Route path="/register" component={RegisterScreen} />
        
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
                <Route path="/profile" component={Profile} />
              </>
            )}
            
            {/* Guide routes - only show if user is a guide */}
            {user.isGuide && (
              <>
                <Route path="/guide-dashboard" component={GuideDashboard} />
                <Route path="/guide-requests" component={GuideRequests} />
                <Route path="/guide-itineraries" component={GuideItineraries} />
                <Route path="/guide-connections" component={GuideConnections} />
                <Route path="/profile" component={Profile} />
              </>
            )}
          </>
        ) : (
          // Redirect to login if trying to access protected routes while not logged in
          <Route path="/:rest*">
            {(params) => {
              if (params.rest && !['', 'login', 'register'].includes(params.rest)) {
                window.location.href = '/login';
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
