
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
import { Mistral } from '@mistralai/mistralai';

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || 'jRuxrXPaXaoCLMEarL3mJQH9GaGDjuZJ' });

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

  // Trip routes
  app.get("/api/trips/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const trips = await storage.getItineraries(userId);
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
      // Get all users
      const allUsers = await storage.getAvailableGuides();
      
      // Filter actual guides with profiles
      const guides = allUsers.filter(user => 
        user.userType === 'guide' && 
        user.guideProfile
      );
      
      // Map to remove sensitive data
      const guidesWithoutSensitiveData = guides.map(guide => {
        const { password, ...guideWithoutPassword } = guide;
        return guideWithoutPassword;
      });

      console.log(`Found ${guidesWithoutSensitiveData.length} guides`);
      return res.json(guidesWithoutSensitiveData);
    } catch (error) {
      console.error("Error fetching guides:", error);
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
          const fromUser = await storage.getUser(connection.fromUserId);
          const toUser = await storage.getUser(connection.toUserId);

          // Determine which user is a guide (if any)
          const guideUser = fromUser?.userType === 'guide' ? fromUser : 
                          toUser?.userType === 'guide' ? toUser : null;

          const guideProfile = guideUser ? await storage.getGuideProfile(guideUser.id) : undefined;

          // Remove passwords
          const fromUserWithoutPassword = fromUser ? 
            { ...fromUser, password: undefined } : 
            undefined;

          const toUserWithoutPassword = toUser ? 
            { ...toUser, password: undefined } : 
            undefined;

          return {
            ...connection,
            fromUser: fromUserWithoutPassword,
            toUser: toUserWithoutPassword,
            guideProfile
          };
        })
      );

      return res.json(connectionsWithDetails);
    } catch (error) {
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

  // Connection management routes
  app.post("/api/connections", async (req, res) => {
    try {
      const { fromUserId, toUserId, status, message, tripDetails, budget } = req.body;

      if (!fromUserId || !toUserId || !status || !message || !tripDetails) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Prevent self-connections
      if (fromUserId === toUserId) {
        return res.status(400).json({ message: "Cannot connect with yourself" });
      }

      const connection = await storage.createConnection({
        fromUserId,
        toUserId,
        status,
        message,
        tripDetails,
        budget
      });

      return res.status(201).json(connection);
    } catch (error) {
      console.error("Error creating connection:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/connections", async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const connections = await storage.getConnections(parseInt(userId as string));

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
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/connections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id || !status) {
        return res.status(400).json({ message: "Connection ID and status are required" });
      }

      const connection = await storage.updateConnectionStatus(parseInt(id), status);

      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }

      return res.json(connection);
    } catch (error) {
      console.error("Error updating connection:", error);
      return res.status(500).json({ message: "Server error" });
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

  app.get("/api/nearby/guides", async (req, res) => {
    try {
      const { latitude, longitude, radius } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }

      const radiusKm = radius ? parseInt(radius as string) : undefined;

      const guides = await storage.getNearbyGuides(
        latitude as string, 
        longitude as string, 
        radiusKm
      );

      // Map to remove passwords
      const guidesWithoutPasswords = await Promise.all(
        guides.map(async (guide) => {
          const guideProfile = await storage.getGuideProfile(guide.id);
          const { password, ...userWithoutPassword } = guide;
          return { 
            ...userWithoutPassword, 
            guideProfile 
          };
        })
      );

      return res.json(guidesWithoutPasswords);
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
      const { message } = req.body;
      
      const chatResponse = await mistral.chat.complete({
        model: 'mistral-large-latest',
        messages: [{
          role: 'system',
          content: 'You are a knowledgeable Maharashtra tour guide assistant. Help tourists with information about places, culture, travel tips, and local experiences in Maharashtra.'
        }, {
          role: 'user',
          content: message
        }]
      });

      res.json({ response: chatResponse.choices[0].message.content });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Failed to get response from assistant' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
