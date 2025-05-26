import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { 
  users, User, InsertUser,
  guideProfiles, GuideProfile, InsertGuideProfile,
  places, Place, InsertPlace,
  itineraries, Itinerary, InsertItinerary,
  itineraryPlaces, ItineraryPlace, InsertItineraryPlace,
  bookings, Booking, InsertBooking,
  connections, Connection, InsertConnection,
  savedPlaces, SavedPlace, InsertSavedPlace
} from '@shared/schema';
import { IStorage } from './storage';
import { eq, and, or } from 'drizzle-orm';

// Get database connection string from environment variables
const DATABASE_URL = process.env.DATABASE_URL;

// Create postgres client with proper error handling
const client = postgres(DATABASE_URL || '');
// Create drizzle client
export const db = drizzle(client);

// Import seed function for maharashtra tourism data
import { seedDatabase } from './data/seed-database';

// Initialize the DB
export async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    // Check if users table has data
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length === 0) {
      console.log('Seeding database with Maharashtra tourism data...');
      await seedDatabase();
    } else {
      console.log('Database already has users, skipping seed process');
    }
    
    console.log('Database initialization complete');
    console.log('Database ready');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// PostgreSQL database storage implementation
export class PostgresStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getGuideProfile(userId: number): Promise<GuideProfile | undefined> {
    const result = await db.select().from(guideProfiles).where(eq(guideProfiles.userId, userId));
    return result[0];
  }

  async createGuideProfile(guideProfile: InsertGuideProfile): Promise<GuideProfile> {
    const result = await db.insert(guideProfiles).values(guideProfile).returning();
    return result[0];
  }

  async getAvailableGuides(): Promise<(User & { guideProfile: GuideProfile })[]> {
    // Join users and guideProfiles
    const result = await db
      .select()
      .from(users)
      .innerJoin(guideProfiles, eq(users.id, guideProfiles.userId))
      .where(eq(users.userType, 'guide'));

    return result.map(row => ({
      ...row.users,
      guideProfile: row.guide_profiles
    }));
  }

  async getPlace(id: number): Promise<Place | undefined> {
    const result = await db.select().from(places).where(eq(places.id, id));
    return result[0];
  }

  async getPlaces(category?: string): Promise<Place[]> {
    if (category) {
      return await db.select().from(places).where(eq(places.category, category));
    }
    return await db.select().from(places);
  }

  async createPlace(place: InsertPlace): Promise<Place> {
    const result = await db.insert(places).values(place).returning();
    return result[0];
  }

  async getItineraries(userId: number): Promise<Itinerary[]> {
    return await db.select().from(itineraries).where(eq(itineraries.userId, userId));
  }

  async getItinerary(id: number): Promise<Itinerary | undefined> {
    const result = await db.select().from(itineraries).where(eq(itineraries.id, id));
    return result[0];
  }

  async createItinerary(itinerary: InsertItinerary): Promise<Itinerary> {
    const result = await db.insert(itineraries).values(itinerary).returning();
    return result[0];
  }

  async getItineraryPlaces(itineraryId: number): Promise<ItineraryPlace[]> {
    return await db.select().from(itineraryPlaces).where(eq(itineraryPlaces.itineraryId, itineraryId));
  }

  async addPlaceToItinerary(itineraryPlace: InsertItineraryPlace): Promise<ItineraryPlace> {
    const result = await db.insert(itineraryPlaces).values(itineraryPlace).returning();
    return result[0];
  }

  async getBookings(userId: number, type?: string): Promise<Booking[]> {
    if (type) {
      return await db.select().from(bookings).where(
        and(eq(bookings.userId, userId), eq(bookings.type, type))
      );
    }
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const result = await db.insert(bookings).values(booking).returning();
    return result[0];
  }

  async getConnections(userId: number): Promise<Connection[]> {
    return await db.select().from(connections).where(
      or(eq(connections.fromUserId, userId), eq(connections.toUserId, userId))
    );
  }

  async createConnection(connection: InsertConnection): Promise<Connection> {
    const result = await db.insert(connections).values(connection).returning();
    return result[0];
  }

  async updateConnectionStatus(id: number, status: string): Promise<Connection | undefined> {
    const result = await db
      .update(connections)
      .set({ status })
      .where(eq(connections.id, id))
      .returning();
    return result[0];
  }

  async getSavedPlaces(userId: number): Promise<SavedPlace[]> {
    return await db.select().from(savedPlaces).where(eq(savedPlaces.userId, userId));
  }

  async savePlaceForUser(savedPlace: InsertSavedPlace): Promise<SavedPlace> {
    const result = await db.insert(savedPlaces).values(savedPlace).returning();
    return result[0];
  }

  async removeSavedPlace(id: number): Promise<void> {
    await db.delete(savedPlaces).where(eq(savedPlaces.id, id));
  }
  
  // Update user location
  async updateUserLocation(userId: number, latitude: string, longitude: string): Promise<User> {
    const result = await db
      .update(users)
      .set({ 
        currentLatitude: latitude, 
        currentLongitude: longitude,
        lastLocationUpdate: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }
  
  // Get nearby guides within a given radius (not exact, approximation for performance)
  async getNearbyGuides(latitude: string, longitude: string, radiusKm: number = 10): Promise<User[]> {
    // Convert latitude/longitude to numbers
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    // Simple approximation: 1 degree of latitude is about 111 km
    // 1 degree of longitude varies by latitude, but we're using a simple approximation
    const latRadius = radiusKm / 111.0;
    const lonRadius = radiusKm / (111.0 * Math.cos(lat * Math.PI / 180));
    
    // Get guides with location data
    const result = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.userType, 'guide'),
          // Simple box filter as an approximation
          // For exact distances, we would calculate haversine distance in application code
          // Filter out guides without location data in application code
          eq(users.userType, 'guide') // duplicate to avoid LSP errors
        )
      );
    
    // Filter by distance in application code
    return result.filter(guide => {
      if (!guide.currentLatitude || !guide.currentLongitude) return false;
      
      const guideLat = parseFloat(guide.currentLatitude);
      const guideLon = parseFloat(guide.currentLongitude);
      
      // Quick check if in the bounding box
      if (Math.abs(guideLat - lat) > latRadius || Math.abs(guideLon - lon) > lonRadius) {
        return false;
      }
      
      // Calculate actual distance using haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = (guideLat - lat) * Math.PI / 180;
      const dLon = (guideLon - lon) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(guideLat * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      return distance <= radiusKm;
    });
  }
  
  // Get nearby places within a given radius
  async getNearbyPlaces(latitude: string, longitude: string, radiusKm: number = 10, category?: string): Promise<Place[]> {
    // Convert latitude/longitude to numbers
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    // Simple approximation: 1 degree of latitude is about 111 km
    const latRadius = radiusKm / 111.0;
    const lonRadius = radiusKm / (111.0 * Math.cos(lat * Math.PI / 180));
    
    // Get all places or filter by category
    let query = db.select().from(places);
    if (category) {
      query = query.where(eq(places.category, category));
    }
    
    const result = await query;
    
    // Filter by distance in application code
    return result.filter(place => {
      const placeLat = parseFloat(place.latitude);
      const placeLon = parseFloat(place.longitude);
      
      // Quick check if in the bounding box
      if (Math.abs(placeLat - lat) > latRadius || Math.abs(placeLon - lon) > lonRadius) {
        return false;
      }
      
      // Calculate actual distance using haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = (placeLat - lat) * Math.PI / 180;
      const dLon = (placeLon - lon) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(placeLat * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      return distance <= radiusKm;
    });
  }
}