import { useState } from "react";
import { fetchApi } from "@/lib/api-client"; // Assuming you have a fetchApi helper
import { useToast } from "@/hooks/use-toast"; // For user feedback
import { useLocation } from "wouter";

interface EmailLoginFormProps {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function EmailLoginForm({
  className = "",
  onSuccess,
  onError
}: EmailLoginFormProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [formattedEmailState, setFormattedEmailState] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Handle email submission
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let currentFormattedEmail = email.trim();
      setFormattedEmailState(currentFormattedEmail);

      // Call backend to send OTP via Email
      const response = await fetchApi<{ message: string, sid?: string }>("/api/auth/email/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentFormattedEmail }),
      });
      setVerificationId(response.sid || 'sent'); // Use 'sent' as a simple flag if SID isn't returned or needed client-side for this step
      toast({
        title: "OTP Sent",
        description: "An OTP has been sent to your email address.",
      });
    } catch (error) {
      console.error("Email auth error:", error);
      setError(error instanceof Error ? error.message : "Failed to send OTP");
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationId) return;
    
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetchApi<{ message: string, user?: any, isNewUser?: boolean }>('/api/auth/email/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formattedEmailState, code: otp }),
      });

      if (response.user) {
        // OTP Verified, handle login
        toast({
          title: 'Login Successful',
          description: 'You have been successfully logged in.',
        });

        // Update global auth state and localStorage (similar to App.tsx login)
        if ((window as any).auth && (window as any).auth.setUser) {
          const userData = {
            ...response.user,
            isGuide: response.user.userType === 'guide',
          };
          (window as any).auth.setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }

        // Call onSuccess or redirect
        if (onSuccess) {
          onSuccess();
        } else {
          if (response.user.userType && response.user.userType.toLowerCase() === 'guide') {
            setLocation('/guide-dashboard');
          } else {
            setLocation('/dashboard');
          }
        }
        return;
      } else if (response.isNewUser) {
        toast({
          title: 'Verification Successful',
          description: 'Email verified. Please complete your registration.',
        });
        setError('Email verified, but no account exists. Please register.');
        return;
      } else {
        throw new Error(response.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError(error instanceof Error ? error.message : 'Failed to verify OTP');
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* reCAPTCHA container removed as Twilio handles its own verification flow */}
      
      {error && (
        <div className="p-2 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {!verificationId ? (
        // Email form
        <form onSubmit={handleSendOtp} className="space-y-3">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              We'll send a verification code to this email.
            </p>
          </div>
          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-red-300"
          >
            {isLoading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      ) : (
        // OTP verification form
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              Enter OTP
            </label>
            <div className="mt-1">
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                required
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setVerificationId(null)}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading || otp.length < 4} // Twilio OTPs are often 6 digits, adjust if necessary
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-red-300"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}