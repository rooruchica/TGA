import { useState, useEffect } from 'react';
import { 
  initAuth0, 
  loginWithPhone, 
  logoutFromAuth0, 
  isAuthenticated as checkAuth0Authentication,
  getUser
} from '@/lib/auth0';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Auth0Demo() {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Initialize Auth0 client
        await initAuth0();
        
        // Check if user is authenticated
        const authStatus = await checkAuth0Authentication();
        setIsAuthenticated(authStatus);
        
        // Get user profile if authenticated
        if (authStatus) {
          const userProfile = await getUser();
          setUser(userProfile);
        }
      } catch (error) {
        console.error('Auth0 initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthentication();
  }, []);

  // Handle login
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Format phone number if needed
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone;
      }
      
      // Start Auth0 phone authentication
      await loginWithPhone(formattedPhone);
      
      // Note: The user will be redirected to Auth0 for authentication
      // The callback will be handled by the login screen component
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logoutFromAuth0();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Auth0 Authentication Demo</CardTitle>
        <CardDescription>
          Using domain: dev-mzsae02min4hvqu8.us.auth0.com
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAuthenticated ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-md">
              <h3 className="font-medium text-green-800">Logged In</h3>
              {user && (
                <div className="mt-2 text-sm text-green-700">
                  <p>Name: {user.name || 'Not available'}</p>
                  <p>Email: {user.email || 'Not available'}</p>
                  <p>Phone: {user.phone_number || 'Not available'}</p>
                </div>
              )}
            </div>
            <Button 
              onClick={handleLogout} 
              className="w-full"
              variant="destructive"
            >
              Log Out
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-gray-700">Not logged in</p>
            </div>
            <div className="space-y-2">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <Button 
                onClick={handleLogin} 
                className="w-full"
                disabled={!phoneNumber.trim()}
              >
                Log In with Phone
              </Button>
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 mt-4">
          <p>Auth0 Domain: dev-mzsae02min4hvqu8.us.auth0.com</p>
          <p>Client ID: F2hU5dW4kyln6nzCUDFwvTubyDZX2npw</p>
        </div>
      </CardContent>
    </Card>
  );
} 