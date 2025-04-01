import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertGuideProfileSchema, 
  insertPlaceSchema, 
  insertItinerarySchema,
  insertItineraryPlaceSchema,
  insertBookingSchema,
  insertConnectionSchema,
  insertSavedPlaceSchema 
} from "@shared/schema";
import { z } from 'zod';
import { ZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      // If user is a guide, create guide profile
      if (userData.userType === "guide" && req.body.guideProfile) {
        const guideProfileData = insertGuideProfileSchema.parse({
          ...req.body.guideProfile,
          userId: user.id
        });
        
        await storage.createGuideProfile(guideProfileData);
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Don't return password
      const { password: _, ...userWithoutPassword } = user;
      
      return res.json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      
      return res.json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Guide routes
  app.get("/api/guides", async (req, res) => {
    try {
      const guides = await storage.getAvailableGuides();
      
      // Map to remove passwords
      const guidesWithoutPasswords = guides.map(guide => {
        const { password, ...userWithoutPassword } = guide;
        return { ...userWithoutPassword, guideProfile: guide.guideProfile };
      });
      
      return res.json(guidesWithoutPasswords);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/guides/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user || user.userType !== "guide") {
        return res.status(404).json({ message: "Guide not found" });
      }
      
      const guideProfile = await storage.getGuideProfile(userId);
      
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
      const places = await storage.getPlaces(category);
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
      
      const place = await storage.getPlace(placeId);
      
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
      const placeData = insertPlaceSchema.parse(req.body);
      const place = await storage.createPlace(placeData);
      return res.status(201).json(place);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Itinerary routes
  app.get("/api/users/:userId/itineraries", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const itineraries = await storage.getItineraries(userId);
      return res.json(itineraries);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/itineraries", async (req, res) => {
    try {
      const itineraryData = insertItinerarySchema.parse(req.body);
      const itinerary = await storage.createItinerary(itineraryData);
      return res.status(201).json(itinerary);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/itineraries/:id/places", async (req, res) => {
    try {
      const itineraryId = parseInt(req.params.id);
      
      if (isNaN(itineraryId)) {
        return res.status(400).json({ message: "Invalid itinerary ID" });
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
      const itineraryId = parseInt(req.params.id);
      
      if (isNaN(itineraryId)) {
        return res.status(400).json({ message: "Invalid itinerary ID" });
      }
      
      const itineraryPlaceData = insertItineraryPlaceSchema.parse({
        ...req.body,
        itineraryId
      });
      
      const itineraryPlace = await storage.addPlaceToItinerary(itineraryPlaceData);
      return res.status(201).json(itineraryPlace);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Booking routes
  app.get("/api/users/:userId/bookings", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const type = req.query.type as string | undefined;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const bookings = await storage.getBookings(userId, type);
      return res.json(bookings);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(bookingData);
      return res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Connection routes
  app.get("/api/users/:userId/connections", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const connections = await storage.getConnections(userId);
      
      // Get full user details for each connection
      const connectionsWithDetails = await Promise.all(
        connections.map(async (connection) => {
          const tourist = await storage.getUser(connection.touristId);
          const guide = await storage.getUser(connection.guideId);
          const guideProfile = guide ? await storage.getGuideProfile(guide.id) : undefined;
          
          // Remove passwords
          const touristWithoutPassword = tourist ? 
            { ...tourist, password: undefined } : 
            undefined;
            
          const guideWithoutPassword = guide ? 
            { ...guide, password: undefined } : 
            undefined;
          
          return {
            ...connection,
            tourist: touristWithoutPassword,
            guide: guideWithoutPassword,
            guideProfile
          };
        })
      );
      
      return res.json(connectionsWithDetails);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/connections", async (req, res) => {
    try {
      const connectionData = insertConnectionSchema.parse(req.body);
      const connection = await storage.createConnection(connectionData);
      return res.status(201).json(connection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.patch("/api/connections/:id/status", async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(connectionId)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      if (!status || !['pending', 'accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedConnection = await storage.updateConnectionStatus(connectionId, status);
      
      if (!updatedConnection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      return res.json(updatedConnection);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Saved places routes
  app.get("/api/users/:userId/saved-places", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const savedPlaces = await storage.getSavedPlaces(userId);
      
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
      const savedPlaceData = insertSavedPlaceSchema.parse(req.body);
      const savedPlace = await storage.savePlaceForUser(savedPlaceData);
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
      
      await storage.removeSavedPlace(savedPlaceId);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
