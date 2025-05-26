import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { User } from "@/pages/App"; // Fixed import path
import GoogleLoginButton from "./google-login-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailLoginForm from "./email-login-form"; // Updated import
import { handleAuth0Callback } from "@/lib/auth0";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginScreenProps {
  login: (username: string, password: string) => Promise<User>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ login }) => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth0, setIsCheckingAuth0] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Check for Auth0 callback on page load
  useEffect(() => {
    const checkAuth0Callback = async () => {
      if (window.location.search.includes('code=')) {
        setIsCheckingAuth0(true);
        try {
          const user = await handleAuth0Callback();
          if (user) {
            toast({
              title: "Login successful",
              description: "Welcome back to Maharashtra Wanderer!",
            });
            
            // Redirect based on user role
            if (user.isGuide) {
              setLocation("/guide-dashboard");
            } else {
              setLocation("/dashboard");
            }
          }
        } catch (error) {
          console.error("Auth0 callback error:", error);
          toast({
            title: "Authentication failed",
            description: error instanceof Error ? error.message : "Failed to complete authentication",
            variant: "destructive",
          });
        } finally {
          setIsCheckingAuth0(false);
        }
      }
    };
    
    checkAuth0Callback();
  }, [setLocation, toast]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      console.log("Attempting login for:", data.username);
      
      // Use the username as both username and email
      // This ensures the server can check both fields
      const username = data.username;
      const email = data.username.includes('@') ? data.username : undefined;
      
      // Attempt login using the login function passed as prop
      const user = await login(username, data.password);
      console.log("Login successful:", user);
      
      toast({
        title: "Login successful",
        description: "Welcome back to Maharashtra Wanderer!",
      });
      
      // Redirect based on user role
      if (user.isGuide) {
        setLocation("/guide-dashboard");
      } else {
        setLocation("/dashboard");
      }
      
    } catch (error) {
      console.error("Login failed:", error);
      
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle authentication errors
  const handleAuthError = (error: Error) => {
    toast({
      title: "Authentication failed",
      description: error.message,
      variant: "destructive",
    });
  };

  // Handle successful authentication
  const handleAuthSuccess = () => {
    toast({
      title: "Login successful",
      description: "Welcome back to Maharashtra Wanderer!",
    });
    // Redirection is handled in the components
  };

  // If checking Auth0 callback, show loading
  if (isCheckingAuth0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white p-6">
        <h1 className="text-2xl font-bold font-sans mb-6">Maharashtra Wanderer</h1>
        <div className="text-center">
          <p className="mb-4">Completing authentication...</p>
          <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-white p-6">
      <h1 className="text-2xl font-bold font-sans mb-6">Maharashtra Wanderer</h1>
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">
          <h2 className="text-xl font-medium mb-4">Sign in to your account</h2>
          
          <div className="flex mb-6 border-b">
            <button className="py-2 px-4 border-b-2 border-[#DC143C] text-[#DC143C] font-medium">Login</button>
            <button 
              className="py-2 px-4 text-gray-500"
              onClick={() => setLocation('/register')}
            >
              Register
            </button>
          </div>
          
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="email">Email (OTP)</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
            </TabsList>
            
            <TabsContent value="password">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Username or Email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="password" placeholder="Password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full py-6 bg-[#DC143C] hover:bg-[#B01030] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </Form>
              

            </TabsContent>
            
            <TabsContent value="email">
              <EmailLoginForm onSuccess={handleAuthSuccess} onError={handleAuthError} />
            </TabsContent>
            
            <TabsContent value="social">
              <div className="space-y-4">
                <GoogleLoginButton 
                  onSuccess={handleAuthSuccess}
                  onError={handleAuthError}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;
