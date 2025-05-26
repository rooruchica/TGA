// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCbUSEUbqRaSBNo0A4WbNvRyq_hNf5k7wk",
  authDomain: "tga2-d5a08.firebaseapp.com",
  projectId: "tga2-d5a08",
  storageBucket: "tga2-d5a08.firebasestorage.app",
  messagingSenderId: "371057160104",
  appId: "1:371057160104:web:17f7d44d0db063f391379d",
  measurementId: "G-PDWVRK7VL1"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);

export default app; 