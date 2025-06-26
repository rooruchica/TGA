import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { getDb } from './db';
import { 
  userSchema,
  guideProfileSchema,
  placeSchema,
  itinerarySchema,
  itineraryPlaceSchema,
  bookingSchema,
  connectionSchema,
  savedPlaceSchema
} from "@shared/schema";
import { z } from 'zod';
import { ZodError } from "zod-validation-error";
import { Mistral } from '@mistralai/mistralai';
import { Router } from "express";
import { ObjectId } from "mongodb";
import path from "path";
import nodemailer from 'nodemailer';

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || 'jRuxrXPaXaoCLMEarL3mJQH9GaGDjuZJ' });

// Nodemailer configuration - REMINDER: User needs to set EMAIL_USER and EMAIL_PASS in .env
// Also, ensure the email service allows less secure app access or use OAuth2
const emailUser = process.env.EMAIL_USER; // e.g., your-email@gmail.com
const emailPass = process.env.EMAIL_PASS; // e.g., your-email-password or app-specific password

let transporter: nodemailer.Transporter;
if (emailUser && emailPass) {
  transporter = nodemailer.createTransport({
    service: 'gmail', // Or your email provider
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
} else {
  console.warn('Email user or password not configured. Email OTP functionality will not work. Please set EMAIL_USER and EMAIL_PASS environment variables.');
}

const router = Router();

// Helper function to calculate distance between two coordinates in kilometers using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to generate random coordinates near a given location
// WARNING: DO NOT USE FOR NEARBY GUIDES API - This will generate random locations that change on every request
// This should only be used for development, testing, or initial data seeding
function generateRandomLocationNearby(baseLat: number, baseLng: number, maxDistanceKm: number = 5): { lat: number, lng: number } {
  // Convert max distance from km to degrees (approximate)
  const maxLat = maxDistanceKm / 111.32; // 1 degree latitude is approx 111.32 km
  const maxLng = maxDistanceKm / (111.32 * Math.cos(baseLat * Math.PI / 180)); // Longitude degrees vary by latitude
  
  // Generate random offsets
  const latOffset = (Math.random() * 2 - 1) * maxLat;
  const lngOffset = (Math.random() * 2 - 1) * maxLng;
  
  return {
    lat: baseLat + latOffset,
    lng: baseLng + lngOffset
  };
}

// Temporary in-memory store for OTPs
// In a production environment, consider using a database (e.g., Redis or MongoDB)
const emailOtps: { [email: string]: { code: string, expiresAt: number } } = {};

export async function registerRoutes(app: Express): Promise<Server> {
  // Add right after the existing middleware but before route definitions
  app.use((req, res, next) => {
    // Set CORS headers
    const origin = req.headers.origin || '';
    // Allow requests from any origin in development, or from the deployed domain in production
    res.header('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' ? req.headers.origin : '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });

  // Direct route to serve test_api.html
  app.get("/test-api", (req, res) => {
    res.sendFile(path.resolve(import.meta.dirname, "../public/test_api.html"));
  });

  // Nearby guides endpoint - returns 4-5 guides near the tourist's location
  app.get("/api/nearby/guides", async (req, res) => {
    try {
      // Get latitude and longitude from query parameters
      const userLat = parseFloat(req.query.latitude as string);
      const userLng = parseFloat(req.query.longitude as string);
      
      // Validate coordinates
      if (isNaN(userLat) || isNaN(userLng)) {
        return res.status(400).json({ message: "Invalid coordinates provided" });
      }
      
      console.log(`[NEARBY GUIDES API] Request for guides near lat=${userLat}, lng=${userLng}`);
      
      // Fetch all guides from the database
      const guides = await db.collection('users').find({ userType: "guide" }).toArray();
      
      if (!guides || guides.length === 0) {
        console.log("[NEARBY GUIDES API] No guides found in database");
        return res.status(404).json({ message: "No guides found" });
      }
      
      console.log(`[NEARBY GUIDES API] Found ${guides.length} guides in database`);
      
      // Log location data for debugging
      guides.forEach((guide, index) => {
        console.log(`[NEARBY GUIDES API] Guide ${index + 1}: ${guide.fullName} (${guide.username})`);
        console.log(`  ID: ${guide._id}`);
        console.log(`  Has latitude: ${guide.currentLatitude ? '✓ ' + guide.currentLatitude : '✗ MISSING'}`);
        console.log(`  Has longitude: ${guide.currentLongitude ? '✓ ' + guide.currentLongitude : '✗ MISSING'}`);
      });
      
      // Convert MongoDB _id to id for each guide and prepare for frontend
      const formattedGuides = guides.map(guide => {
        // Extract the guide's actual location data (DON'T generate random locations)
        const guideLat = parseFloat(guide.currentLatitude || "0");
        const guideLon = parseFloat(guide.currentLongitude || "0");
        
        // Only calculate distance if guide has location data
        const distance = guideLat && guideLon ? 
          calculateDistance(userLat, userLng, guideLat, guideLon) : 
          Number.MAX_SAFE_INTEGER; // Put guides without location at the end
        
        return {
          ...guide,
          id: guide._id.toString(),
          // Explicitly preserve the actual coordinates in the response
          currentLatitude: guideLat,
          currentLongitude: guideLon,
          distance: distance,
          // Remove MongoDB _id and password for security
          _id: undefined,
          password: undefined
        };
      });
      
      // Get guide profiles
      const guideIds = formattedGuides.map(g => g.id);
      const guideProfiles = await db.collection('guideProfiles').find({
        userId: { $in: guideIds }
      }).toArray();
      
      // Create a map of profiles by userId for quick lookup
      const profileMap = new Map();
      guideProfiles.forEach(profile => {
        profileMap.set(profile.userId, {
          ...profile,
          id: profile._id.toString(),
          _id: undefined
        });
      });
      
      // Add guide profiles to guides
      const guidesWithProfiles = formattedGuides.map(guide => ({
        ...guide,
        guideProfile: profileMap.get(guide.id) || null
      }));
      
      // Sort guides by distance
      guidesWithProfiles.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      // Return guides with valid location data, up to a reasonable limit
      const nearbyGuides = guidesWithProfiles
        .filter(guide => guide.distance !== Number.MAX_SAFE_INTEGER)
        .slice(0, 10); // Return up to 10 guides
      
      console.log(`[NEARBY GUIDES API] Returning ${nearbyGuides.length} guides with valid locations`);
      
      return res.json(nearbyGuides);
    } catch (error) {
      console.error("Error fetching nearby guides:", error);
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("============ REGISTRATION REQUEST ============");
      console.log("Registration request body:", JSON.stringify(req.body, null, 2));
      
      // Add defaults and sanitize data
      const sanitizedData = {
        ...req.body,
        // Ensure these fields exist with correct types
        username: req.body.username || '',
        email: req.body.email || '',
        password: req.body.password || '',
        fullName: req.body.fullName || '',
        phone: req.body.phone || '',
        userType: req.body.userType || 'tourist',
      };
      
      console.log("Sanitized data:", JSON.stringify(sanitizedData, null, 2));
      
      // Check if we're receiving the expected fields
      if (!sanitizedData.username || !sanitizedData.email || !sanitizedData.password) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          received: Object.keys(sanitizedData) 
        });
      }
      
      try {
        // Use loose schema validation and strip unknown properties
        const userData = userSchema.omit({ id: true, createdAt: true }).parse(sanitizedData);
        console.log("Parsed user data:", JSON.stringify(userData, null, 2));
        
        try {
          // Check for existing user by email instead of username
          const existingUser = await storage.getUserByEmail(userData.email);
          console.log("Existing user check:", existingUser ? "User exists" : "User doesn't exist");
          
          if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
          }

          try {
            // If registering as a guide, add location data
            if (userData.userType === "guide") {
              // Define fixed locations for guides in Maharashtra
              const guideLocations = [
                { lat: 18.92, lng: 72.83 }, // Mumbai
                { lat: 18.52, lng: 73.85 }, // Pune
                { lat: 19.99, lng: 73.78 }, // Nashik
                { lat: 19.15, lng: 72.82 }, // Thane
                { lat: 18.40, lng: 76.58 }, // Latur
                { lat: 16.70, lng: 74.24 }, // Kolhapur
                { lat: 20.12, lng: 79.95 }, // Chandrapur
                { lat: 21.14, lng: 79.08 }, // Nagpur
                { lat: 19.09, lng: 74.74 }, // Ahmednagar
                { lat: 19.87, lng: 75.34 }  // Aurangabad
              ];
              
              // Choose a random location
              const randomLocation = guideLocations[Math.floor(Math.random() * guideLocations.length)];
              
              console.log(`Assigning location to guide: ${randomLocation.lat}, ${randomLocation.lng}`);
              
              // Add location data to the user data
              userData.currentLatitude = randomLocation.lat.toString();
              userData.currentLongitude = randomLocation.lng.toString();
              userData.lastLocationUpdate = new Date();
              
              console.log("Updated user data with location:", JSON.stringify({
                currentLatitude: userData.currentLatitude,
                currentLongitude: userData.currentLongitude,
                lastLocationUpdate: userData.lastLocationUpdate
              }, null, 2));
            }
            
            // Skip the storage layer for guide creation for now
            let user;
            if (userData.userType === "guide") {
              // Create the user directly in MongoDB to ensure location data is preserved
              console.log("Creating guide directly in MongoDB");
              const result = await db.collection('users').insertOne({
                ...userData,
                createdAt: new Date()
              });
              
              if (!result.insertedId) {
                throw new Error("Failed to create user - no insertedId returned");
              }
              
              // Get the newly created user from the database
              user = await db.collection('users').findOne({ _id: result.insertedId });
              
              if (!user) {
                throw new Error("Failed to retrieve created user");
              }
              
              // Convert MongoDB _id to id string format
              user = {
                ...user,
                id: user._id.toString()
              };
              
              console.log("Guide created directly in MongoDB:", JSON.stringify({
                id: user.id,
                username: (user as any).username,
                currentLatitude: (user as any).currentLatitude,
                currentLongitude: (user as any).currentLongitude
              }, null, 2));
            } else {
              // Use normal storage layer for non-guide users
              console.log("Creating user with data:", JSON.stringify(userData, null, 2));
              user = await storage.createUser(userData);
            }
            
            console.log("User created with ID:", user.id);
            console.log("User data after creation:", JSON.stringify(user, null, 2));

            // Add a direct database update for guide location if needed
            if (userData.userType === "guide" && userData.currentLatitude && userData.currentLongitude) {
              try {
                console.log("Ensuring guide location is set with direct database update");
                const updateResult = await db.collection('users').updateOne(
                  { _id: new ObjectId(user.id) },
                  { 
                    $set: { 
                      currentLatitude: userData.currentLatitude,
                      currentLongitude: userData.currentLongitude,
                      lastLocationUpdate: userData.lastLocationUpdate
                    } 
                  }
                );
                
                console.log(`Location update result: matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}`);
                
                // Get the user again to make sure we have updated data
                const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(user.id) });
                if (updatedUser) {
                  console.log("User after location update:", JSON.stringify({
                    id: updatedUser._id,
                    currentLatitude: updatedUser.currentLatitude,
                    currentLongitude: updatedUser.currentLongitude
                  }, null, 2));
                  
                  // Update our local user object with the latest data
                  (user as any).currentLatitude = updatedUser.currentLatitude;
                  (user as any).currentLongitude = updatedUser.currentLongitude;
                }
              } catch (locationUpdateError) {
                console.error("Error updating guide location:", locationUpdateError);
              }
            }

            // If user is a guide, create guide profile
            if (userData.userType === "guide" && req.body.guideProfile) {
              try {
                console.log("Creating guide profile for user:", user.id);
                const guideProfileData = guideProfileSchema.omit({ id: true }).parse({
                  ...req.body.guideProfile,
                  userId: user.id
                });

                await storage.createGuideProfile(guideProfileData);
                console.log("Guide profile created");
              } catch (guideProfileError) {
                console.error("Error creating guide profile:", guideProfileError);
                // Continue since the user was already created
              }
            }

            // Don't return password
            const { password, ...userWithoutPassword } = user as any;

            // For guides, explicitly ensure the location data is included in the response
            if (userData.userType === "guide") {
              (userWithoutPassword as any).currentLatitude = userData.currentLatitude;
              (userWithoutPassword as any).currentLongitude = userData.currentLongitude;
              
              console.log("Ensuring guide location data is included in response:", JSON.stringify({
                currentLatitude: userWithoutPassword.currentLatitude,
                currentLongitude: userWithoutPassword.currentLongitude
              }, null, 2));
            }

            console.log("Registration successful");
            console.log("User returning with data:", JSON.stringify(userWithoutPassword, null, 2));
            console.log("============ END REGISTRATION REQUEST ============");
            return res.status(201).json(userWithoutPassword);
          } catch (createUserError) {
            console.error("Error creating user:", createUserError);
            return res.status(500).json({ message: "Error creating user", error: String(createUserError) });
          }
        } catch (getUserError) {
          console.error("Error checking for existing user:", getUserError);
          return res.status(500).json({ message: "Error checking for existing user", error: String(getUserError) });
        }
      } catch (parseError) {
        console.error("Error parsing user data:", parseError);
        if (parseError instanceof z.ZodError) {
          console.error("Validation errors:", JSON.stringify(parseError.errors, null, 2));
          return res.status(400).json({ message: "Invalid data", errors: parseError.errors });
        }
        return res.status(400).json({ message: "Error parsing user data", error: String(parseError) });
      }
    } catch (outerError) {
      console.error("Unhandled registration error:", outerError);
      console.error("============ END REGISTRATION REQUEST WITH ERROR ============");
      return res.status(500).json({ message: "Server error", error: String(outerError) });
    }
  });

  // User location update endpoint
  app.post("/api/user/location", async (req, res) => {
    try {
      const { userId, latitude, longitude } = req.body;
      
      if (!userId || !latitude || !longitude) {
        return res.status(400).json({ message: "User ID, latitude, and longitude are required" });
      }
      
      // Validate coordinates
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }
      
      // Update user's location in the database
      const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            currentLatitude: latitude,
            currentLongitude: longitude,
            lastLocationUpdate: new Date()
          } 
        }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json({ message: "Location updated successfully" });
    } catch (error) {
      console.error("Error updating user location:", error);
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("============ LOGIN REQUEST ============");
      console.log("Login request body:", JSON.stringify(req.body, null, 2));
      
      // Extract credentials from request body
      const { username, password, email } = req.body;
      
      // Check if required fields are provided
      if ((!username && !email) || !password) {
        console.error("Missing required fields");
        return res.status(400).json({ message: "Email/username and password are required" });
      }
      
      let user = null;
      
      // First try to find by username if provided
      if (username) {
        console.log("Looking up user by username:", username);
        user = await db.collection('users').findOne({ username });
        console.log("Username lookup result:", user ? "Found" : "Not found");
      }
      
      // If no user found and email provided, try by email
      if (!user && email) {
        console.log("Looking up user by email:", email);
        user = await db.collection('users').findOne({ email });
        console.log("Email lookup result:", user ? "Found" : "Not found");
      }
      
      // DEVELOPMENT MODE: Auto-create guide user if attempting to log in as 'guide'
      if (!user && username === 'guide' && password === 'guide' && process.env.NODE_ENV !== 'production') {
        console.log("DEVELOPMENT MODE: Creating test guide user automatically");
        
        // Create guide user
        const guideUser = {
          username: 'guide',
          email: 'guide@example.com',
          password: 'guide',
          fullName: 'Test Guide',
          phone: '9876543210',
          userType: 'guide',
          createdAt: new Date(),
          currentLatitude: '18.92',
          currentLongitude: '72.83'
        };
        
        const result = await db.collection('users').insertOne(guideUser);
        const guideId = result.insertedId;
        
        console.log("Created test guide user with ID:", guideId.toString());
        
        // Create guide profile
        const guideProfile = {
          userId: guideId.toString(),
          location: 'Mumbai, Maharashtra',
          experience: 5,
          languages: ['English', 'Hindi', 'Marathi'],
          specialties: ['Historical sites', 'Local cuisine', 'Adventure tours'],
          rating: 4.8,
          bio: 'Experienced guide specializing in Mumbai tours.'
        };
        
        await db.collection('guideProfiles').insertOne(guideProfile);
        
        // Get the created user
        user = await db.collection('users').findOne({ _id: guideId });
        console.log("Using newly created guide user");
      }
      
      // Check if user was found
      if (!user) {
        console.error("User not found");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Convert MongoDB _id to id and ensure it's a string
      const userId = user._id.toString();
      console.log("Converted user ID:", userId);
      console.log("User type:", user.userType);
      console.log("Stored password:", user.password);
      console.log("Provided password:", password);
      
      // Create user object with string ID while preserving all properties
      let userWithStringId: any; // Use 'any' type to bypass TypeScript checks
      try {
        // Try to validate with schema
        userWithStringId = userSchema.parse({ 
          ...user, 
          id: userId,
          _id: undefined // Remove MongoDB _id
        });
      } catch (validationError) {
        console.warn("Schema validation failed, using raw user data:", validationError);
        // Fall back to raw user data if validation fails
        userWithStringId = { 
          ...user, 
          id: userId,
          _id: undefined // Remove MongoDB _id
        };
      }
      
      console.log("User found:", userWithStringId.username);
      
      // Verify password
      if (userWithStringId.password !== password) {
        console.error(`Invalid password. Expected: ${userWithStringId.password}, Received: ${password}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Create response without password
      const { password: _, ...userWithoutPassword } = userWithStringId as any;

      console.log("Login successful for user:", (userWithoutPassword as any).username);
      console.log("User details to be returned:", JSON.stringify(userWithoutPassword, null, 2));
      console.log("============ END LOGIN REQUEST ============");
      
      // Return user data in the format expected by client
      return res.json(userWithoutPassword);
      
    } catch (error) {
      console.error("Login error:", error);
      console.error("============ END LOGIN REQUEST WITH ERROR ============");
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      
      console.log(`Looking up user by ID: ${userId}`);
      
      // Try to fetch user by ObjectId directly
      try {
        // Try to fetch the user with ObjectId
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        
        if (!user) {
          console.log(`User not found with ID: ${userId}`);
          return res.status(404).json({ message: "User not found" });
        }
        
        // Convert to a user object with string ID
        const convertedUser = {
          ...user,
          id: user._id.toString(),
          _id: undefined
        };
        
        // Don't return password
        const { password, ...userWithoutPassword } = convertedUser as any;
        
        console.log(`Found user: ${(userWithoutPassword as any).username}`);
        return res.json(userWithoutPassword);
      } catch (err) {
        console.error(`Error looking up user by ID: ${userId}`, err);
        return res.status(404).json({ message: "User not found or invalid ID format" });
      }
    } catch (error) {
      console.error("Error in /api/users/:id endpoint:", error);
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });

  // Trip routes
  app.get("/api/trips/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const trips = await storage.getItinerary(userId.toString());
      return res.json(trips);
    } catch (error) {
      console.error("Error fetching trips:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/trips", async (req, res) => {
    try {
      const tripData = {
        userId: req.body.userId,
        title: req.body.title,
        description: req.body.description,
        startDate: req.body.startDate,
        endDate: req.body.endDate
      };
      const trip = await storage.createItinerary(tripData);
      return res.status(201).json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Guide routes
  app.get("/api/guides", async (req, res) => {
    try {
      console.log("Fetching guides...");
      // Get all users with userType 'guide' directly from MongoDB
      const guides = await db.collection('users').find({ userType: 'guide' }).toArray();
      
      // Map the guides to include guide profiles
      const guidesWithProfiles = await Promise.all(guides.map(async (guide) => {
        // Convert MongoDB _id to id
        const guideId = guide._id.toString();
        
        try {
          // Find guide profile
          const guideProfile = await db.collection('guideProfiles').findOne({ userId: guideId });
          
          // Remove sensitive information
          const { password, ...guideWithoutPassword } = guide;
          
          return {
            ...guideWithoutPassword,
            id: guideId,
            guideProfile
          };
        } catch (err) {
          console.error(`Error fetching profile for guide ${guideId}:`, err);
          // Return guide without profile
          const { password, ...guideWithoutPassword } = guide;
          return {
            ...guideWithoutPassword,
            id: guideId
          };
        }
      }));
      
      console.log(`Found ${guidesWithProfiles.length} guides`);
      return res.json(guidesWithProfiles);
    } catch (error) {
      console.error("Error fetching guides:", error);
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });

  app.get("/api/guides/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(userId.toString());

      if (!user || user.userType !== "guide") {
        return res.status(404).json({ message: "Guide not found" });
      }

      const guideProfile = await storage.getGuideProfile(userId.toString());

      if (!guideProfile) {
        return res.status(404).json({ message: "Guide profile not found" });
      }

      // Don't return password
      const { password, ...userWithoutPassword } = user;

      return res.json({
        ...userWithoutPassword,
        guideProfile
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Places routes
  app.get("/api/places", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const places = await storage.getPlaces();
      return res.json(places);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/places/:id", async (req, res) => {
    try {
      const placeId = parseInt(req.params.id);

      if (isNaN(placeId)) {
        return res.status(400).json({ message: "Invalid place ID" });
      }

      const place = await storage.getPlace(placeId.toString());

      if (!place) {
        return res.status(404).json({ message: "Place not found" });
      }

      return res.json(place);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/places", async (req, res) => {
    try {
      const placeData = placeSchema.parse(req.body);
      const { id, ...placeWithoutId } = placeData;
      const place = await storage.createPlace(placeWithoutId);
      return res.status(201).json(place);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Add this endpoint after the places routes
  app.post("/api/places/:id/wikimedia", async (req, res) => {
    try {
      const placeId = req.params.id;
      const {
        wikimediaThumbnailUrl,
        wikimediaDescription,
        wikimediaArtist,
        wikimediaAttributionUrl,
        wikimediaLicense,
        wikimediaLicenseUrl
      } = req.body;
      
      if (!placeId) {
        return res.status(400).json({ message: "Place ID is required" });
      }
      
      // Update the place with Wikimedia information
      await db.collection('places').updateOne(
        { _id: new ObjectId(placeId) },
        { 
          $set: { 
            wikimediaThumbnailUrl,
            wikimediaDescription,
            wikimediaArtist,
            wikimediaAttributionUrl,
            wikimediaLicense,
            wikimediaLicenseUrl
          },
          // Set imageUrl only if it doesn't exist
          $setOnInsert: {
            imageUrl: wikimediaThumbnailUrl
          }
        },
        { upsert: true }
      );
      
      // Get the updated place
      const updatedPlace = await db.collection('places').findOne({ _id: new ObjectId(placeId) });
      
      if (!updatedPlace) {
        return res.status(404).json({ message: "Place not found after update" });
      }
      
      // Convert MongoDB _id to id for response
      const { _id, ...placeData } = updatedPlace;
      
      return res.json({
        ...placeData,
        id: _id.toString()
      });
    } catch (error) {
      console.error("Error updating place with Wikimedia data:", error);
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });

  // Itinerary routes
  app.get("/api/users/:userId/itineraries", async (req, res) => {
    try {
      const userId = req.params.userId;
      console.log("Fetching itineraries for user ID:", userId);

      if (!userId) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Search in MongoDB by the userId field in itineraries
      const itineraries = await db.collection('itineraries').find({ userId }).toArray();
      console.log(`Found ${itineraries.length} itineraries for user ${userId}`);
      
      // Map MongoDB documents to expected format with id field
      const formattedItineraries = itineraries.map(itinerary => {
        const { _id, ...rest } = itinerary;
        return {
          id: _id.toString(),
          ...rest
        };
      });

      return res.json(formattedItineraries);
    } catch (error) {
      console.error("Error fetching itineraries:", error);
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });

  app.post("/api/itineraries", async (req, res) => {
    try {
      console.log("Creating itinerary with data:", JSON.stringify(req.body, null, 2));
      const itineraryData = itinerarySchema.parse(req.body);
      console.log("Parsed itinerary data:", JSON.stringify(itineraryData, null, 2));
      const itinerary = await storage.createItinerary(itineraryData);
      console.log("Created itinerary:", JSON.stringify(itinerary, null, 2));
      return res.status(201).json(itinerary);
    } catch (error) {
      console.error("Error creating itinerary:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/itineraries/:id/places", async (req, res) => {
    try {
      const itineraryId = req.params.id;

      if (!itineraryId || !ObjectId.isValid(itineraryId)) {
        return res.status(400).json({ message: "Invalid itinerary ID format" });
      }

      const itineraryPlaces = await storage.getItineraryPlaces(itineraryId);

      // Get full place details for each itinerary place
      const placesWithDetails = await Promise.all(
        itineraryPlaces.map(async (itineraryPlace) => {
          const place = await storage.getPlace(itineraryPlace.placeId);
          return {
            ...itineraryPlace,
            place
          };
        })
      );

      return res.json(placesWithDetails);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/itineraries/:id/places", async (req, res) => {
    try {
      const itineraryId = req.params.id;

      if (!itineraryId || !ObjectId.isValid(itineraryId)) {
        return res.status(400).json({ message: "Invalid itinerary ID format" });
      }

      const itineraryPlaceData = itineraryPlaceSchema.parse({
        ...req.body,
        itineraryId: itineraryId // Pass the string ID
      });

      const itineraryPlace = await storage.createItineraryPlace(itineraryPlaceData);
      return res.status(201).json(itineraryPlace);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/itineraries/:itineraryId/share", async (req, res) => {
    try {
      const { itineraryId } = req.params;
      const { recipientUserId } = req.body;

      if (!itineraryId || !recipientUserId) {
        return res.status(400).json({ message: "Missing itineraryId or recipientUserId" });
      }

      // Fetch the itinerary
      const itinerary = await storage.getItinerary(itineraryId);
      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      // Add recipientUserId to sharedWith if not already present
      let sharedWith = itinerary.sharedWith || [];
      if (!sharedWith.includes(recipientUserId)) {
        sharedWith = [...sharedWith, recipientUserId];
        await storage.updateItinerary(itineraryId, { sharedWith });
      }

      return res.status(200).json({ message: "Itinerary shared successfully" });
    } catch (error) {
      console.error("Error sharing itinerary:", error);
      return res.status(500).json({ message: "Server error while sharing itinerary" });
    }
  });

  // Booking routes
  app.get("/api/bookings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const type = req.query.type as string | undefined;

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const booking = await storage.getBooking(userId.toString());
      return res.json(booking);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = bookingSchema.parse(req.body);
      const booking = await storage.createBooking(bookingData);
      res.json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(400).json({ error: "Invalid booking data" });
    }
  });

  // Connection routes
  app.get("/api/users/:userId/connections", async (req, res) => {
    try {
      const { userId } = req.params;
      const rawId = req.query.raw; // For debugging
      const status = req.query.status as string | undefined; // For filtering by status

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      console.log(`[API] Fetching connections for user ${userId}, raw param: ${rawId || 'none'}`);
      console.log(`[API] User ID type: ${typeof userId}`);
      
      // Get all connections for this user, optionally filtered by status
      const connections = await storage.getConnections(userId as string, status);
      console.log(`[API] Fetching connections with status: ${status || 'any'}`);
      console.log(`[API] Found ${connections.length} connections for user ${userId}`);
      
      // Debug output for each connection
      if (connections.length > 0) {
        connections.forEach((connection, index) => {
          console.log(`[API] Connection ${index + 1}: ID=${connection.id}, ` +
            `fromUserId=${connection.fromUserId} (${typeof connection.fromUserId}), ` +
            `toUserId=${connection.toUserId} (${typeof connection.toUserId}), ` +
            `status=${connection.status}, ` +
            `isSender=${connection.fromUserId.toString() === userId.toString()}, ` +
            `isRecipient=${connection.toUserId.toString() === userId.toString()}`);
        });
      }

      // Get user details for each connection with improved error handling
      const connectionsWithUsers = await Promise.all(
        connections.map(async (connection) => {
          try {
            // Get the users involved in this connection
          const fromUser = await storage.getUser(connection.fromUserId);
          const toUser = await storage.getUser(connection.toUserId);

            // Remove sensitive data
            const { password: fromPassword, ...fromUserWithoutPassword } = fromUser || {};
            const { password: toPassword, ...toUserWithoutPassword } = toUser || {};

            // Check if either user is a guide and fetch guide profile if needed
            let guideProfile = null;
            
            // If toUser is a guide, get their guide profile
            if (toUserWithoutPassword && typeof toUserWithoutPassword === 'object' && 'userType' in toUserWithoutPassword && toUserWithoutPassword.userType === 'guide') {
              try {
                if (toUserWithoutPassword.id) {
                guideProfile = await storage.getGuideProfile(toUserWithoutPassword.id);
                console.log(`[API] Found guide profile for user ${toUserWithoutPassword.id}`);
                }
              } catch (profileError) {
                console.error(`[API] Error fetching guide profile for ${toUserWithoutPassword.id}:`, profileError);
              }
            }
            
            // If fromUser is a guide, get their guide profile
            if (!guideProfile && fromUserWithoutPassword && typeof fromUserWithoutPassword === 'object' && 'userType' in fromUserWithoutPassword && fromUserWithoutPassword.userType === 'guide') {
              try {
                if (fromUserWithoutPassword.id) {
                guideProfile = await storage.getGuideProfile(fromUserWithoutPassword.id);
                console.log(`[API] Found guide profile for user ${fromUserWithoutPassword.id}`);
                }
              } catch (profileError) {
                console.error(`[API] Error fetching guide profile for ${fromUserWithoutPassword.id}:`, profileError);
              }
            }

          return {
            ...connection,
            fromUser: fromUserWithoutPassword,
            toUser: toUserWithoutPassword,
              guideProfile: guideProfile
          };
          } catch (error) {
            console.error(`[API] Error processing connection ${connection.id}:`, error);
            // Return the connection without user details rather than failing completely
            return connection;
          }
        })
      );

      console.log(`[API] Returning ${connectionsWithUsers.length} processed connections`);
      return res.json(connectionsWithUsers);
    } catch (error) {
      console.error("[API] Error getting connections:", error);
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });

  app.patch("/api/connections/:connectionId", async (req, res) => {
    const { connectionId } = req.params;
      const { status } = req.body;
    
    console.log(`[PATCH /api/connections/${connectionId}] Request to update connection status to ${status}`);
    
    if (!connectionId) {
      console.log('[PATCH /api/connections] Missing connectionId parameter');
      return res.status(400).json({ message: 'Connection ID is required' });
    }
    
    if (!status || !['accepted', 'rejected'].includes(status)) {
      console.log(`[PATCH /api/connections] Invalid status: ${status}`);
      return res.status(400).json({ message: 'Status must be "accepted" or "rejected"' });
    }

    try {
      // Fetch the connection to make sure it exists
      const connection = await storage.getConnection(connectionId);

      if (!connection) {
        console.log(`[PATCH /api/connections] Connection ${connectionId} not found`);
        return res.status(404).json({ message: 'Connection not found' });
      }

      // Get the current user from the request
      const userId = req.body.userId;
      if (!userId) {
        console.log('[PATCH /api/connections] Missing userId from request');
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Check if this user is the guide (toUser) in the connection
      const isGuide = connection.toUserId.toString() === userId.toString();
      
      console.log(`[PATCH /api/connections] Connection details:`, {
        connectionId: connection.id,
        status: connection.status,
        fromUserId: connection.fromUserId,
        toUserId: connection.toUserId,
        currentUserId: userId,
        isGuide: isGuide
      });

      if (!isGuide) {
        console.log(`[PATCH /api/connections] User ${userId} is not the guide and cannot update this connection`);
        return res.status(403).json({ message: 'Only the guide can accept or reject connection requests' });
      }

      // Ensure the connection is in 'pending' status before updating
      if (connection.status !== 'pending') {
        console.log(`[PATCH /api/connections] Cannot update connection with status ${connection.status}`);
        return res.status(400).json({ message: `Connection is already ${connection.status}` });
      }

      // Update the connection status
      const updatedConnection = await storage.updateConnectionStatus(connectionId, status);

      console.log(`[PATCH /api/connections] Successfully updated connection ${connectionId} to ${status}`);
      return res.json(updatedConnection);
    } catch (error) {
      console.error('[PATCH /api/connections] Error updating connection:', error);
      return res.status(500).json({ message: 'Failed to update connection', error: String(error) });
    }
  });

  // Saved places routes
  app.get("/api/users/:userId/saved-places", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const savedPlaces = await storage.getSavedPlaces(userId.toString());

      // Get full place details for each saved place
      const placesWithDetails = await Promise.all(
        savedPlaces.map(async (savedPlace) => {
          const place = await storage.getPlace(savedPlace.placeId);
          return {
            ...savedPlace,
            place
          };
        })
      );

      return res.json(placesWithDetails);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/saved-places", async (req, res) => {
    try {
      const savedPlaceData = savedPlaceSchema.parse(req.body);
      const savedPlace = await storage.createSavedPlace(savedPlaceData);
      return res.status(201).json(savedPlace);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/saved-places/:id", async (req, res) => {
    try {
      const savedPlaceId = parseInt(req.params.id);

      if (isNaN(savedPlaceId)) {
        return res.status(400).json({ message: "Invalid saved place ID" });
      }

      await storage.deleteSavedPlace(savedPlaceId.toString());
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Connection management routes
  app.post("/api/connections", async (req, res) => {
    try {
      console.log("[DEBUG] Received connection request:", req.body);
      const { fromUserId, toUserId, status, message, tripDetails, budget } = req.body;

      if (!fromUserId || !toUserId || !status || !message) {
        console.log("[DEBUG] Missing required fields:", { fromUserId, toUserId, status, message });
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Prevent self-connections
      if (fromUserId === toUserId) {
        console.log("[DEBUG] Attempted self-connection:", { fromUserId, toUserId });
        return res.status(400).json({ message: "Cannot connect with yourself" });
      }

      // Detailed logging for user lookup
      console.log("[DEBUG] Looking up fromUser with ID:", fromUserId);
      console.log("[DEBUG] Looking up toUser with ID:", toUserId);

      try {
        // Direct database queries to check users
        console.log("[DEBUG] Attempting to create ObjectIds");
        let fromUserObjectId, toUserObjectId;
        
        try {
          fromUserObjectId = new ObjectId(fromUserId);
          console.log("[DEBUG] Successfully created fromUser ObjectId");
        } catch (error) {
          console.error("[DEBUG] Invalid fromUserId format:", error);
          return res.status(400).json({ message: "Invalid fromUserId format" });
        }
        
        try {
          toUserObjectId = new ObjectId(toUserId);
          console.log("[DEBUG] Successfully created toUser ObjectId");
        } catch (error) {
          console.error("[DEBUG] Invalid toUserId format:", error);
          return res.status(400).json({ message: "Invalid toUserId format" });
        }

        // Query the database for both users
        console.log("[DEBUG] Querying database for users");
        const fromUserDb = await db.collection('users').findOne({ _id: fromUserObjectId });
        const toUserDb = await db.collection('users').findOne({ _id: toUserObjectId });
        
        console.log("[DEBUG] Database lookup results:", {
          fromUserFound: !!fromUserDb,
          fromUserDetails: fromUserDb ? {
            id: fromUserDb._id.toString(),
            type: fromUserDb.userType,
            username: fromUserDb.username
          } : null,
          toUserFound: !!toUserDb,
          toUserDetails: toUserDb ? {
            id: toUserDb._id.toString(),
            type: toUserDb.userType,
            username: toUserDb.username
          } : null
        });

        if (!fromUserDb || !toUserDb) {
          const missingUsers = [];
          if (!fromUserDb) missingUsers.push(`fromUser (${fromUserId})`);
          if (!toUserDb) missingUsers.push(`toUser (${toUserId})`);
          console.log("[DEBUG] Users not found:", missingUsers);
          return res.status(400).json({ 
            message: `Users not found: ${missingUsers.join(", ")}`,
            details: {
              fromUserFound: !!fromUserDb,
              toUserFound: !!toUserDb
            }
          });
        }

        // Validate user types
        console.log("[DEBUG] Validating user types:", {
          fromUserType: fromUserDb.userType,
          toUserType: toUserDb.userType
        });

        if (fromUserDb.userType !== 'tourist' || toUserDb.userType !== 'guide') {
          console.log("[DEBUG] Invalid user types for connection");
          return res.status(400).json({ 
            message: "Connections can only be created from tourist to guide",
            details: {
              fromUserType: fromUserDb.userType,
              toUserType: toUserDb.userType
            }
          });
        }

        // Create the connection
        console.log("[DEBUG] Creating connection in database");
      const connection = await storage.createConnection({
        fromUserId: fromUserId.toString(),
        toUserId: toUserId.toString(),
        status,
        message,
        tripDetails: tripDetails || 'No specific details provided',
        budget: budget || 'Not specified',
          createdAt: new Date()
      });
      
      console.log("[DEBUG] Connection created successfully:", connection);

        // Prepare response
      const responseData = {
        ...connection,
          fromUser: {
            ...fromUserDb,
            id: fromUserDb._id.toString(),
            _id: undefined,
            password: undefined
          },
          toUser: {
            ...toUserDb,
            id: toUserDb._id.toString(),
            _id: undefined,
            password: undefined
          }
      };
      
      console.log("[DEBUG] Sending successful response");
      return res.status(201).json(responseData);
    } catch (error) {
        console.error("[DEBUG] Error in connection creation:", error);
        return res.status(500).json({ 
          message: "Server error", 
          error: String(error),
          stack: (error as Error).stack
        });
      }
    } catch (error) {
      console.error("[DEBUG] Outer error in connection creation:", error);
      return res.status(500).json({ 
        message: "Server error", 
        error: String(error),
        stack: (error as Error).stack
      });
    }
  });

  app.get("/api/connections", async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Don't attempt to parse as integer, MongoDB uses string IDs
      const connections = await storage.getConnections(userId as string);
      console.log(`[DEBUG] Found ${connections.length} connections for user ${userId}`);

      // Get user details for each connection
      const connectionsWithUsers = await Promise.all(
        connections.map(async (connection) => {
          const fromUser = await storage.getUser(connection.fromUserId);
          const toUser = await storage.getUser(connection.toUserId);

          const { password: fromPassword, ...fromUserWithoutPassword } = fromUser || {};
          const { password: toPassword, ...toUserWithoutPassword } = toUser || {};

          return {
            ...connection,
            fromUser: fromUserWithoutPassword,
            toUser: toUserWithoutPassword
          };
        })
      );

      return res.json(connectionsWithUsers);
    } catch (error) {
      console.error("Error getting connections:", error);
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });

  app.patch("/api/connections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id || !status) {
        return res.status(400).json({ message: "Connection ID and status are required" });
      }

      // Ensure status is valid
      if (!['pending', 'accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value. Must be 'pending', 'accepted', or 'rejected'" });
      }

      console.log(`Updating connection ${id} to status: ${status}`);
      const connection = await storage.updateConnectionStatus(id, status);

      if (!connection) {
        console.log(`Connection ${id} not found`);
        return res.status(404).json({ message: "Connection not found" });
      }

      console.log(`Successfully updated connection ${id}`);
      return res.json(connection);
    } catch (error) {
      console.error("Error updating connection:", error);
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });

  // Geolocation routes
  app.post("/api/user/location", async (req, res) => {
    try {
      const { userId, latitude, longitude } = req.body;

      if (!userId || !latitude || !longitude) {
        return res.status(400).json({ message: "User ID, latitude, and longitude are required" });
      }

      const parsedUserId = parseInt(userId);

      if (isNaN(parsedUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.updateUserLocation(parsedUserId, latitude, longitude);

      // Don't return password
      const { password, ...userWithoutPassword } = user;

      return res.json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/nearby/places", async (req, res) => {
    try {
      const { latitude, longitude, radius, category } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }

      const radiusKm = radius ? parseInt(radius as string) : undefined;

      const places = await storage.getNearbyPlaces(
        latitude as string, 
        longitude as string, 
        radiusKm,
        category as string | undefined
      );

      return res.json(places);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Chat endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages } = req.body;
      const systemPrompt = {
        role: 'system',
        content: `You are a helpful and knowledgeable Maharashtra tour guide assistant. Answer questions about Maharashtra tourism, places, travel, or culture. If the question is off-topic, politely refuse. Be specific and helpful.`
      };
      const chatMessages = [
        systemPrompt,
        ...(Array.isArray(messages) ? messages : [{ role: 'user', content: String(messages) }])
      ];
      console.log('Sending to Mistral:', JSON.stringify(chatMessages, null, 2)); // Debug log
      const chatResponse = await mistral.chat.complete({
        model: 'mistral-large-latest',
        messages: chatMessages,
        maxTokens: 180 // Slightly longer for richer answers
      });
      console.log('Mistral response:', chatResponse); // Debug log

      if (
        chatResponse &&
        Array.isArray(chatResponse.choices) &&
        chatResponse.choices.length > 0 &&
        chatResponse.choices[0].message &&
        typeof chatResponse.choices[0].message.content === "string"
      ) {
        res.json({ response: chatResponse.choices[0].message.content });
      } else {
        res.status(500).json({ error: 'No response from assistant' });
      }
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Failed to get response from assistant' });
    }
  });

  // Add this near the end of the registerRoutes function
  app.get("/api/debug/collections", async (req, res) => {
    try {
      const collections = await db.listCollections().toArray();
      const collectionData: Record<string, any> = {};
      
      // Get sample data from each collection
      for (const collection of collections) {
        const data = await db.collection(collection.name).find().limit(3).toArray();
        collectionData[collection.name] = {
          count: await db.collection(collection.name).countDocuments(),
          samples: data
        };
      }
      
      return res.json({
        collections: collections.map(c => c.name),
        data: collectionData
      });
    } catch (error) {
      console.error("Error getting collections:", error);
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });

  // Test route to check MongoDB connection
  app.get("/api/test/mongodb", async (req, res) => {
    try {
      console.log("Testing MongoDB connection...");
      
      // Test inserting a document
      const testCollection = db.collection('test_collection');
      const result = await testCollection.insertOne({ test: true, date: new Date() });
      
      // Test finding the document
      const document = await testCollection.findOne({ _id: result.insertedId });
      
      // Clean up
      await testCollection.deleteOne({ _id: result.insertedId });
      
      return res.json({ 
        success: true, 
        message: "MongoDB connection is working properly", 
        insertedId: result.insertedId.toString(),
        found: document !== null
      });
    } catch (error) {
      console.error("MongoDB connection test failed:", error);
      return res.status(500).json({ 
        success: false, 
        message: "MongoDB connection test failed", 
        error: String(error) 
      });
    }
  });

  app.delete("/api/itineraries/:id", async (req, res) => {
    try {
      const itineraryId = req.params.id;
      console.log("Deleting itinerary with ID:", itineraryId);

      if (!itineraryId) {
        return res.status(400).json({ message: "Invalid itinerary ID" });
      }

      // Delete the itinerary from MongoDB
      const result = await db.collection('itineraries').deleteOne({ _id: new ObjectId(itineraryId) });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Itinerary not found" });
      }
      
      // Also delete any associated itinerary places
      await db.collection('itineraryPlaces').deleteMany({ itineraryId });
      
      console.log(`Deleted itinerary ${itineraryId} successfully`);
      return res.status(200).json({ message: "Itinerary deleted successfully" });
    } catch (error) {
      console.error("Error deleting itinerary:", error);
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });

  // Message routes
  app.get("/api/messages", async (req, res) => {
    try {
      const { connectionId } = req.query;
      
      if (!connectionId) {
        return res.status(400).json({ message: "Connection ID is required" });
      }
      
      // In a real app, you would fetch messages from a database
      // For this MVP, we'll return simulated messages
      const messages = [
        {
          id: 1,
          connectionId: parseInt(connectionId as string),
          senderId: 1, // Replace with actual sender ID
          receiverId: 2, // Replace with actual receiver ID
          content: "Hello! I'm interested in booking your services.",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: true
        },
        {
          id: 2,
          connectionId: parseInt(connectionId as string),
          senderId: 2, // Replace with actual sender ID
          receiverId: 1, // Replace with actual receiver ID
          content: "Hi there! I'd be happy to guide you. What dates are you planning to visit?",
          timestamp: new Date(Date.now() - 3500000).toISOString(),
          read: true
        },
        {
          id: 3,
          connectionId: parseInt(connectionId as string),
          senderId: 1, // Replace with actual sender ID
          receiverId: 2, // Replace with actual receiver ID
          content: "I'm planning to visit from October 10-15. Would you be available?",
          timestamp: new Date(Date.now() - 3400000).toISOString(),
          read: true
        },
        {
          id: 4,
          connectionId: parseInt(connectionId as string),
          senderId: 2, // Replace with actual sender ID
          receiverId: 1, // Replace with actual receiver ID
          content: "Yes, I'm available during those dates. I'd be happy to show you around!",
          timestamp: new Date(Date.now() - 3300000).toISOString(),
          read: true
        }
      ];
      
      return res.json(messages);
    } catch (error) {
      console.error("Error getting messages:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/messages", async (req, res) => {
    try {
      const { connectionId, senderId, receiverId, content } = req.body;
      
      if (!connectionId || !senderId || !receiverId || !content) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // In a real app, you would save the message to a database
      // For this MVP, we'll return a simulated message
      const newMessage = {
        id: Date.now(),
        connectionId,
        senderId,
        receiverId,
        content,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      return res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error creating message:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/connections/:id", async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      
      if (isNaN(connectionId)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      const connection = await storage.getConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      // Get user details for the connection
      const fromUser = await storage.getUser(connection.fromUserId);
      const toUser = await storage.getUser(connection.toUserId);
      
      // Remove passwords
      const fromUserWithoutPassword = fromUser ? 
        { ...fromUser, password: undefined } : 
        undefined;
      
      const toUserWithoutPassword = toUser ? 
        { ...toUser, password: undefined } : 
        undefined;
      
      return res.json({
        ...connection,
        fromUser: fromUserWithoutPassword,
        toUser: toUserWithoutPassword
      });
    } catch (error) {
      console.error("Error getting connection:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Add this near the end of the registerRoutes function
  app.get("/api/debug/connections", async (req, res) => {
    try {
      console.log("[DEBUG] Fetching all connections for debugging");
      
      // Get all connections from database
      const connections = await db.collection('connections').find().toArray();
      
      // Format the connections
      const formattedConnections = connections.map(conn => ({
        ...conn,
        id: conn._id.toString(),
        _id: undefined
      }));
      
      console.log(`[DEBUG] Found ${formattedConnections.length} total connections in database`);
      
      // Get count of pending connections
      const pendingCount = formattedConnections.filter(conn => {
        return typeof conn === 'object' && conn !== null && 'status' in conn && conn.status === 'pending';
      }).length;
      
      return res.json({
        message: "Debug connections endpoint",
        totalConnections: formattedConnections.length,
        pendingConnections: pendingCount,
        connections: formattedConnections
      });
    } catch (error) {
      console.error("[DEBUG] Error fetching connections for debug:", error);
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });

  // Add a debug endpoint specifically for connections
  app.get("/api/debug/user-connections/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      console.log("[DEBUG] Debug endpoint - Fetching connections for user ID:", userId);

      // Get direct connections from the database using the storage layer
      const connections = await storage.getConnections(userId);
      console.log(`[DEBUG] Found ${connections.length} connections through storage layer`);

      // Also try a direct database query
      const rawConnections = await db.collection('connections').find({
        $or: [
          { fromUserId: userId },
          { toUserId: userId },
        ]
      }).toArray();

      console.log(`[DEBUG] Found ${rawConnections.length} connections through direct query`);

      // Format the connections
      const formattedConnections = rawConnections.map(conn => {
        const { _id, ...rest } = conn;
        return {
          ...rest,
          id: _id.toString(),
          fromUserId: rest.fromUserId.toString(),
          toUserId: rest.toUserId.toString()
        };
      });

      return res.json({
        userId,
        storageLayerCount: connections.length,
        directQueryCount: rawConnections.length,
        connections: formattedConnections
      });
    } catch (error) {
      console.error("[DEBUG] Error in debug endpoint:", error);
      return res.status(500).json({ 
        message: "Server error", 
        error: String(error),
        stack: (error as Error).stack 
      });
    }
  });

  // Messages endpoints
  app.get("/api/connections/:connectionId/messages", async (req, res) => {
    try {
      const { connectionId } = req.params;
      
      if (!connectionId) {
        return res.status(400).json({ message: "Connection ID is required" });
      }
      
      // Get messages for this connection
      const messages = await storage.getMessagesByConnectionId(connectionId);
      
      console.log(`[GET /api/connections/${connectionId}/messages] Returning ${messages.length} messages`);
      return res.json(messages);
    } catch (error) {
      console.error("Error getting messages:", error);
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });
  
  app.post("/api/connections/:connectionId/messages", async (req, res) => {
    try {
      const { connectionId } = req.params;
      const { content, senderId, recipientId } = req.body;
      
      if (!connectionId || !senderId || !recipientId || !content) {
        return res.status(400).json({ 
          message: "Missing required fields",
          received: { connectionId, senderId, recipientId, contentLength: content?.length || 0 }
        });
      }
      
      // Create a new message
      const newMessage = {
        id: `msg_${Date.now()}`,
        connectionId,
        senderId,
        recipientId,
        content,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      // Save the message
      const savedMessage = await storage.createMessage(newMessage);
      
      console.log(`[POST /api/connections/${connectionId}/messages] Created new message from ${senderId} to ${recipientId}`);
      return res.status(201).json(savedMessage);
    } catch (error) {
      console.error("Error creating message:", error);
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });

  // Debug Routes - ONLY FOR DEVELOPMENT USE
  app.get('/api/debug/guides', async (req, res) => {
    try {
      // Security check - only allow in development
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Debug endpoints are disabled in production' });
      }

      // Check for debug mode header for additional security
      if (!req.headers['x-debug-mode']) {
        return res.status(403).json({ message: 'Debug mode header required' });
      }

      const db = await getDb();
      const guideUsers = await db.collection('users').find({ userType: 'guide' }).toArray();
      
      // Remove sensitive information
      const safeGuides = guideUsers.map((guide: any) => {
        const { password, ...safeGuide } = guide;
        return safeGuide;
      });
      
      console.log(`Debug endpoint: Found ${safeGuides.length} guide users`);
      res.json(safeGuides);
    } catch (error) {
      console.error('Error in debug guide endpoint:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Debug endpoint to create a guide user
  app.post('/api/debug/create-guide', async (req, res) => {
    try {
      // Security check - only allow in development
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Debug endpoints are disabled in production' });
      }

      // Check for debug mode header for additional security
      if (!req.headers['x-debug-mode']) {
        return res.status(403).json({ message: 'Debug mode header required' });
      }

      const db = await getDb();
      
      // Use provided data or defaults
      const { 
        username = 'guide', 
        password = 'guide',
        email = 'guide@example.com',
        fullName = 'Test Guide',
        phone = '9876543210'
      } = req.body;

      // Check if the user already exists
      const existingUser = await db.collection('users').findOne({ 
        $or: [{ username }, { email }] 
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: 'User already exists', 
          user: { 
            username: existingUser.username,
            email: existingUser.email,
            fullName: existingUser.fullName,
            userType: existingUser.userType,
            id: existingUser._id.toString()
          } 
        });
      }

      // Create new user
      const newUser = {
        username,
        password, // In a real app, you'd hash this
        email,
        fullName,
        phone,
        userType: 'guide',
        createdAt: new Date()
      };

      const result = await db.collection('users').insertOne(newUser);
      const userId = result.insertedId;

      // Create a guide profile
      const guideProfile = {
        userId: userId,
        location: 'Mumbai',
        experience: '5 years',
        languages: ['English', 'Hindi', 'Marathi'],
        specialties: ['Historical Sites', 'Food Tours', 'Nature Walks'],
        rating: 4.8,
        bio: 'Experienced guide for Maharashtra tours with local knowledge.'
      };

      await db.collection('guideProfiles').insertOne(guideProfile);

      console.log(`Debug endpoint: Created guide user with username: ${username}, id: ${userId}`);
      
      // Return user details (without password)
      const { password: _, ...safeUser } = newUser;
      res.status(201).json({ 
        message: 'Guide user created successfully',
        user: {
          ...safeUser,
          id: userId.toString()
        },
        credentials: {
          username,
          password
        }
      });
    } catch (error) {
      console.error('Error creating guide user:', error);
      res.status(500).json({ message: 'Server error', error: typeof error === 'object' && error !== null && 'message' in error ? error.message : String(error) });
    }
  });

  // Firebase Authentication endpoint
  app.post("/api/auth/firebase-auth", async (req, res) => {
    try {
      console.log("============ FIREBASE AUTH REQUEST ============");
      console.log("Firebase auth request body:", JSON.stringify(req.body, null, 2));
      
      const { idToken, email, displayName, phoneNumber, authProvider } = req.body;
      
      // Validate required fields based on auth provider
      if (!idToken) {
        return res.status(400).json({ message: "Missing Firebase ID token" });
      }
      
      // For phone auth, we need a phone number
      if (authProvider === 'phone' && !phoneNumber) {
        return res.status(400).json({ message: "Missing phone number for phone authentication" });
      }
      
      // For Google auth, we need an email
      if (authProvider === 'google' && !email) {
        return res.status(400).json({ message: "Missing email for Google authentication" });
      }
      
      // First, check if user exists
      let user = null;
      
      if (authProvider === 'google' && email) {
        // Try to find user by email for Google auth
        user = await db.collection('users').findOne({ email });
      } else if (authProvider === 'phone' && phoneNumber) {
        // Try to find user by phone for phone auth
        user = await db.collection('users').findOne({ phone: phoneNumber });
      }
      
      if (user) {
        // User exists, return user data
        console.log(`User found with ${authProvider} auth:`, user._id);
        
        // Return user data
        return res.json({
          id: user._id.toString(),
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          userType: user.userType,
          createdAt: user.createdAt
        });
      } else {
        // User doesn't exist, create a new user as tourist by default
        // Generate a username from email or phone
        let username = '';
        let fullName = displayName || '';
        
        if (authProvider === 'google' && email) {
          username = email.split('@')[0];
        } else if (authProvider === 'phone' && phoneNumber) {
          // Use last 6 digits of phone number as username
          username = `user_${phoneNumber.replace(/\D/g, '').slice(-6)}`;
        }
        
        // Create a new user with tourist role
        const newUser = {
          username,
          fullName,
          email: email || '',
          phone: phoneNumber || '',
          userType: 'tourist', // Default to tourist role
          createdAt: new Date()
        };
        
        const result = await db.collection('users').insertOne(newUser);
        
        console.log(`New user created with ${authProvider} auth:`, result.insertedId);
        
        // Return new user data
        return res.status(201).json({
          id: result.insertedId.toString(),
          username: newUser.username,
          fullName: newUser.fullName,
          email: newUser.email,
          phone: newUser.phone,
          userType: newUser.userType,
          createdAt: newUser.createdAt
        });
      }
    } catch (error) {
      console.error("Error in Firebase authentication:", error);
      return res.status(500).json({ 
        message: "Authentication failed", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Email OTP Routes
  // Send Email OTP
  app.post("/api/auth/email/send-otp", async (req, res) => {
    if (!transporter) {
      return res.status(500).json({ message: "Email service not configured. Check server configuration." });
    }
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    try {
      // Check if user exists with this email
      const existingUser = await db.collection('users').findOne({ email });
      if (!existingUser) {
        console.log(`Attempt to send OTP to unregistered email: ${email}`);
        // For now, we allow sending OTP even if user is not registered, to support a registration flow later if needed.
        // If strict login-only is required, uncomment the next lines:
        // return res.status(404).json({ message: "Email not registered. Please sign up first." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
      const expiresAt = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

      emailOtps[email] = { code: otp, expiresAt };
      console.log(`[EMAIL OTP SENT] Email: ${email}, OTP: ${otp}`); // Log the OTP

      const mailOptions = {
        from: emailUser, // sender address
        to: email, // list of receivers
        subject: 'Your OTP Code', // Subject line
        text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`, // plain text body
        html: `<p>Your OTP code is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`, // html body
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email OTP sent to: ${email}`);
      res.status(200).json({ message: "OTP sent successfully to your email." });

    } catch (error: any) {
      console.error("Error sending email OTP:", error);
      res.status(500).json({ message: error.message || "Failed to send OTP" });
    }
  });

  // Verify Email OTP
  app.post("/api/auth/email/verify-otp", async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: "Email and OTP code are required" });
    }

    try {
      const storedOtpData = emailOtps[email];

      if (!storedOtpData) {
        return res.status(400).json({ message: "OTP not found or expired. Please request a new one." });
      }

      if (Date.now() > storedOtpData.expiresAt) {
        delete emailOtps[email]; // Clean up expired OTP
        return res.status(400).json({ message: "OTP has expired. Please request a new one." });
      }

      if (storedOtpData.code !== code) {
        return res.status(400).json({ message: "Invalid OTP code." });
      }

      // OTP is correct. Now, find the user or proceed with registration if applicable.
      const user = await db.collection('users').findOne({ email });

      if (!user) {
        // If we reach here, it means OTP was verified for an email not yet in the user database.
        // This could be part of a registration flow where email is verified first.
        // For now, let's assume we need to create the user if they don't exist.
        // Or, if only login is supported, return an error.
        // For this example, let's return a success and let the client handle user creation/login logic based on this.
        // A more robust solution would handle user creation here or have separate registration/login flows.
        console.log(`OTP verified for ${email}, but no user found. Client should handle next steps (e.g., prompt for registration details).`);
        // To strictly enforce login for existing users:
        // delete emailOtps[email]; // Clean up used OTP
        // return res.status(404).json({ message: "User not found with this email. Please register first." });
        
        // For a flow where email verification precedes registration:
        delete emailOtps[email]; // Clean up used OTP
        return res.status(200).json({
          message: "Email OTP verified successfully. Email is valid.",
          email: email,
          isNewUser: true // Indicate to client that this email is not yet registered
        });
      }

      // User exists, log them in (simplified for now)
      console.log(`User ${user._id} attempting login via Email OTP.`);
      delete emailOtps[email]; // Clean up used OTP

      // Placeholder for JWT token generation or session creation
      // const token = generateYourJwtToken(user);

      res.status(200).json({
        message: "OTP verified successfully. User logged in.",
        user: {
          id: user._id.toString(),
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          userType: user.userType,
          createdAt: user.createdAt
        },
        isNewUser: false
        // token: token // Include JWT if using token-based auth
      });

    } catch (error: any) {
      console.error("Error verifying email OTP:", error);
      res.status(500).json({ message: error.message || "Failed to verify OTP" });
    }
  });

  // Auth0 Authentication endpoint
  app.post("/api/auth/auth0-auth", async (req, res) => {
    try {
      console.log("============ AUTH0 AUTH REQUEST ============");
      console.log("Auth0 auth request body:", JSON.stringify(req.body, null, 2));
      
      const { token, email, name, phoneNumber, authProvider } = req.body;
      
      // Validate required fields
      if (!token) {
        return res.status(400).json({ message: "Missing Auth0 token" });
      }
      
      // First, check if user exists
      let user = null;
      
      if (email) {
        // Try to find user by email for email-based auth
        user = await db.collection('users').findOne({ email });
      } else if (phoneNumber) {
        // Try to find user by phone for phone auth
        user = await db.collection('users').findOne({ phone: phoneNumber });
      }
      
      if (user) {
        // User exists, return user data
        console.log(`User found with Auth0 auth:`, user._id);
        
        // Return user data
        return res.json({
          id: user._id.toString(),
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          userType: user.userType,
          createdAt: user.createdAt
        });
      } else {
        // User doesn't exist, create a new user as tourist by default
        // Generate a username from email or phone
        let username = '';
        let fullName = name || '';
        
        if (email) {
          username = email.split('@')[0];
        } else if (phoneNumber) {
          // Use last 6 digits of phone number as username
          username = `user_${phoneNumber.replace(/\D/g, '').slice(-6)}`;
        }
        
        // Create a new user with tourist role
        const newUser = {
          username,
          fullName,
          email: email || '',
          phone: phoneNumber || '',
          userType: 'tourist', // Default to tourist role
          createdAt: new Date()
        };
        
        const result = await db.collection('users').insertOne(newUser);
        
        console.log(`New user created with Auth0 auth:`, result.insertedId);
        
        // Return new user data
        return res.status(201).json({
          id: result.insertedId.toString(),
          username: newUser.username,
          fullName: newUser.fullName,
          email: newUser.email,
          phone: newUser.phone,
          userType: newUser.userType,
          createdAt: newUser.createdAt
        });
      }
    } catch (error) {
      console.error("Error in Auth0 authentication:", error);
      return res.status(500).json({ 
        message: "Authentication failed", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // New endpoint: Get itineraries shared with a user
  app.get("/api/users/:userId/shared-itineraries", async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      // Find all itineraries where sharedWith includes userId
      const itineraries = await db.collection('itineraries').find({ sharedWith: userId }).toArray();
      // Format the itineraries to include id as string
      const formatted = itineraries.map(itinerary => {
        const { _id, ...rest } = itinerary;
        return { ...rest, id: _id.toString() };
      });
      return res.json(formatted);
    } catch (error) {
      console.error("Error fetching shared itineraries:", error);
      return res.status(500).json({ message: "Server error fetching shared itineraries" });
    }
  });

  // Add this endpoint to fetch a single itinerary by ID
  app.get('/api/itineraries/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ message: 'Itinerary ID is required' });
      const itinerary = await db.collection('itineraries').findOne({ _id: new ObjectId(id) });
      if (!itinerary) return res.status(404).json({ message: 'Itinerary not found' });
      const { _id, ...rest } = itinerary;
      return res.json({ ...rest, id: _id.toString() });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: String(error) });
    }
  });

  app.get("/api/itineraries/:id", async (req, res) => {
    try {
      const itineraryId = req.params.id;
      if (!itineraryId || !ObjectId.isValid(itineraryId)) {
        return res.status(400).json({ message: "Invalid itinerary ID format" });
      }
      const itinerary = await storage.getItinerary(itineraryId);
      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }
      return res.json(itinerary);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Add a test endpoint for Mistral API connectivity
  app.get('/api/test-mistral', async (req, res) => {
    try {
      const response = await mistral.chat.complete({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'What is the capital of Maharashtra?' }
        ]
      });
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

export default router;
