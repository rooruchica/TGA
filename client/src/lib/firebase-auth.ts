import { 
  GoogleAuthProvider, 
  signInWithRedirect, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  PhoneAuthProvider,
  signOut,
  UserCredential
} from "firebase/auth";
import { auth } from "./firebase";
import { fetchApi } from "./api-client";
import type { User } from "@/pages/App";

// Initialize RecaptchaVerifier
let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initialize the reCAPTCHA verifier
 * @param containerId - The ID of the container element
 */
export const initRecaptcha = (containerId: string) => {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
  }
  return recaptchaVerifier;
};

/**
 * Sign in with Google
 * After successful Firebase auth, connect with our backend
 */
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
    // The redirect will take the user away from the app, and you need to handle the result after redirect
    // You may want to handle the result in your app's entry point or a dedicated callback handler
    throw new Error("Redirecting to Google sign-in. Please complete the sign-in and return to the app.");
  } catch (error: any) {
    console.error("Google sign in error:", error);
    throw new Error(error.message || "Google authentication failed");
  }
};

/**
 * Start phone number authentication
 * @param phoneNumber - The phone number to authenticate
 * @param recaptchaContainerId - The ID of the reCAPTCHA container
 */
export const startPhoneAuth = async (phoneNumber: string, recaptchaContainerId: string): Promise<string> => {
  try {
    const verifier = initRecaptcha(recaptchaContainerId);
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    return confirmationResult.verificationId;
  } catch (error: any) {
    console.error("Phone auth error:", error);
    throw new Error(error.message || "Phone authentication failed");
  }
};

/**
 * Verify OTP code and complete phone authentication
 * @param verificationId - The verification ID from startPhoneAuth
 * @param otp - The OTP code entered by the user
 */
export const verifyOtp = async (verificationId: string, otp: string): Promise<User> => {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, otp);
    const result = await auth.signInWithCredential(credential);
    
    // Get user info from Phone auth
    const { user } = result;
    const idToken = await user.getIdToken();
    
    // Connect with our backend
    const backendUser = await fetchApi<User>("/api/auth/firebase-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        idToken,
        phoneNumber: user.phoneNumber,
        authProvider: "phone"
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
  } catch (error: any) {
    console.error("OTP verification error:", error);
    throw new Error(error.message || "OTP verification failed");
  }
};

/**
 * Sign out from Firebase
 */
export const firebaseSignOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Firebase sign out error:", error);
  }
}; 