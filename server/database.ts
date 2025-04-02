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

// Create postgres client
const client = postgres(DATABASE_URL);
// Create drizzle client
export const db = drizzle(client);

// Initialize the DB
export async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    // Check if users table has data
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length === 0) {
      console.log('Seeding database with initial data...');
      await seedDatabase();
    }
    
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Seed the database with initial data
async function seedDatabase() {
  try {
    // Create users
    const user1 = await db.insert(users).values({
      username: 'tourist1',
      password: 'password123',
      fullName: 'Tourist User',
      email: 'tourist1@example.com',
      phone: '+91 9876543210',
      userType: 'tourist'
    }).returning();

    const user2 = await db.insert(users).values({
      username: 'guide1',
      password: 'password123',
      fullName: 'Guide User',
      email: 'guide1@example.com',
      phone: '+91 9876543211',
      userType: 'guide'
    }).returning();

    const user3 = await db.insert(users).values({
      username: 'guide2',
      password: 'password123',
      fullName: 'Another Guide',
      email: 'guide2@example.com',
      phone: '+91 9876543212',
      userType: 'guide'
    }).returning();

    // Create guide profiles
    await db.insert(guideProfiles).values({
      userId: user2[0].id,
      location: 'Mumbai, Maharashtra',
      experience: 5,
      languages: ['English', 'Hindi', 'Marathi'],
      specialties: ['Historical Sites', 'Adventure', 'Cultural Tours'],
      rating: 4,
      bio: 'Experienced guide with knowledge of Maharashtra history and culture.'
    });

    await db.insert(guideProfiles).values({
      userId: user3[0].id,
      location: 'Pune, Maharashtra',
      experience: 3,
      languages: ['English', 'Hindi', 'Marathi', 'Gujarati'],
      specialties: ['Trekking', 'Wildlife', 'Photography'],
      rating: 4,
      bio: 'Adventure enthusiast and wildlife expert based in Pune.'
    });

    // Create places
    await db.insert(places).values([
      {
        name: 'Gateway of India',
        description: 'Iconic monument located in Mumbai',
        location: 'Mumbai, Maharashtra',
        category: 'attraction',
        latitude: '18.9220',
        longitude: '72.8347',
        imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5'
      },
      {
        name: 'Ellora Caves',
        description: 'UNESCO World Heritage Site with ancient cave temples',
        location: 'Aurangabad, Maharashtra',
        category: 'attraction',
        latitude: '20.0258',
        longitude: '75.1792',
        imageUrl: 'https://images.unsplash.com/photo-1560108878-8145b2a56e9d'
      },
      {
        name: 'Lonavala',
        description: 'Hill station in the Western Ghats',
        location: 'Lonavala, Maharashtra',
        category: 'attraction',
        latitude: '18.7546',
        longitude: '73.4062',
        imageUrl: 'https://images.unsplash.com/photo-1625127251217-01a3e901985c'
      }
    ]);

    // Create a sample connection
    await db.insert(connections).values({
      touristId: user1[0].id,
      guideId: user2[0].id,
      status: 'accepted'
    });

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
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
      or(eq(connections.touristId, userId), eq(connections.guideId, userId))
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
}