import { 
  users, User, InsertUser, 
  guideProfiles, GuideProfile, InsertGuideProfile,
  places, Place, InsertPlace,
  itineraries, Itinerary, InsertItinerary,
  itineraryPlaces, ItineraryPlace, InsertItineraryPlace,
  bookings, Booking, InsertBooking,
  connections, Connection, InsertConnection,
  savedPlaces, SavedPlace, InsertSavedPlace
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Guide methods
  getGuideProfile(userId: number): Promise<GuideProfile | undefined>;
  createGuideProfile(guideProfile: InsertGuideProfile): Promise<GuideProfile>;
  getAvailableGuides(): Promise<(User & { guideProfile: GuideProfile })[]>;
  
  // Places methods
  getPlace(id: number): Promise<Place | undefined>;
  getPlaces(category?: string): Promise<Place[]>;
  createPlace(place: InsertPlace): Promise<Place>;
  
  // Itinerary methods
  getItineraries(userId: number): Promise<Itinerary[]>;
  getItinerary(id: number): Promise<Itinerary | undefined>;
  createItinerary(itinerary: InsertItinerary): Promise<Itinerary>;
  
  // Itinerary places methods
  getItineraryPlaces(itineraryId: number): Promise<ItineraryPlace[]>;
  addPlaceToItinerary(itineraryPlace: InsertItineraryPlace): Promise<ItineraryPlace>;
  
  // Booking methods
  getBookings(userId: number, type?: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  
  // Connection methods
  getConnections(userId: number): Promise<Connection[]>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnectionStatus(id: number, status: string): Promise<Connection | undefined>;
  
  // Saved places methods
  getSavedPlaces(userId: number): Promise<SavedPlace[]>;
  savePlaceForUser(savedPlace: InsertSavedPlace): Promise<SavedPlace>;
  removeSavedPlace(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private guideProfiles: Map<number, GuideProfile>;
  private places: Map<number, Place>;
  private itineraries: Map<number, Itinerary>;
  private itineraryPlaces: Map<number, ItineraryPlace>;
  private bookings: Map<number, Booking>;
  private connections: Map<number, Connection>;
  private savedPlaces: Map<number, SavedPlace>;
  
  private currentUserId: number;
  private currentGuideProfileId: number;
  private currentPlaceId: number;
  private currentItineraryId: number;
  private currentItineraryPlaceId: number;
  private currentBookingId: number;
  private currentConnectionId: number;
  private currentSavedPlaceId: number;

  constructor() {
    this.users = new Map();
    this.guideProfiles = new Map();
    this.places = new Map();
    this.itineraries = new Map();
    this.itineraryPlaces = new Map();
    this.bookings = new Map();
    this.connections = new Map();
    this.savedPlaces = new Map();
    
    this.currentUserId = 1;
    this.currentGuideProfileId = 1;
    this.currentPlaceId = 1;
    this.currentItineraryId = 1;
    this.currentItineraryPlaceId = 1;
    this.currentBookingId = 1;
    this.currentConnectionId = 1;
    this.currentSavedPlaceId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  async getGuideProfile(userId: number): Promise<GuideProfile | undefined> {
    return Array.from(this.guideProfiles.values()).find(
      (profile) => profile.userId === userId,
    );
  }
  
  async createGuideProfile(guideProfile: InsertGuideProfile): Promise<GuideProfile> {
    const id = this.currentGuideProfileId++;
    const profile: GuideProfile = { ...guideProfile, id };
    this.guideProfiles.set(id, profile);
    return profile;
  }
  
  async getAvailableGuides(): Promise<(User & { guideProfile: GuideProfile })[]> {
    const guides: (User & { guideProfile: GuideProfile })[] = [];
    
    for (const user of this.users.values()) {
      if (user.userType === 'guide') {
        const guideProfile = await this.getGuideProfile(user.id);
        if (guideProfile) {
          guides.push({
            ...user,
            guideProfile
          });
        }
      }
    }
    
    return guides;
  }
  
  async getPlace(id: number): Promise<Place | undefined> {
    return this.places.get(id);
  }
  
  async getPlaces(category?: string): Promise<Place[]> {
    const allPlaces = Array.from(this.places.values());
    
    if (!category) {
      return allPlaces;
    }
    
    return allPlaces.filter(place => place.category === category);
  }
  
  async createPlace(place: InsertPlace): Promise<Place> {
    const id = this.currentPlaceId++;
    const newPlace: Place = { ...place, id };
    this.places.set(id, newPlace);
    return newPlace;
  }
  
  async getItineraries(userId: number): Promise<Itinerary[]> {
    return Array.from(this.itineraries.values()).filter(
      (itinerary) => itinerary.userId === userId,
    );
  }
  
  async getItinerary(id: number): Promise<Itinerary | undefined> {
    return this.itineraries.get(id);
  }
  
  async createItinerary(itinerary: InsertItinerary): Promise<Itinerary> {
    const id = this.currentItineraryId++;
    const newItinerary: Itinerary = { ...itinerary, id, createdAt: new Date() };
    this.itineraries.set(id, newItinerary);
    return newItinerary;
  }
  
  async getItineraryPlaces(itineraryId: number): Promise<ItineraryPlace[]> {
    return Array.from(this.itineraryPlaces.values()).filter(
      (itineraryPlace) => itineraryPlace.itineraryId === itineraryId,
    );
  }
  
  async addPlaceToItinerary(itineraryPlace: InsertItineraryPlace): Promise<ItineraryPlace> {
    const id = this.currentItineraryPlaceId++;
    const newItineraryPlace: ItineraryPlace = { ...itineraryPlace, id };
    this.itineraryPlaces.set(id, newItineraryPlace);
    return newItineraryPlace;
  }
  
  async getBookings(userId: number, type?: string): Promise<Booking[]> {
    const userBookings = Array.from(this.bookings.values()).filter(
      (booking) => booking.userId === userId,
    );
    
    if (!type) {
      return userBookings;
    }
    
    return userBookings.filter(booking => booking.type === type);
  }
  
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const id = this.currentBookingId++;
    const newBooking: Booking = { ...booking, id, createdAt: new Date() };
    this.bookings.set(id, newBooking);
    return newBooking;
  }
  
  async getConnections(userId: number): Promise<Connection[]> {
    return Array.from(this.connections.values()).filter(
      (connection) => connection.touristId === userId || connection.guideId === userId,
    );
  }
  
  async createConnection(connection: InsertConnection): Promise<Connection> {
    const id = this.currentConnectionId++;
    const newConnection: Connection = { ...connection, id, createdAt: new Date() };
    this.connections.set(id, newConnection);
    return newConnection;
  }
  
  async updateConnectionStatus(id: number, status: string): Promise<Connection | undefined> {
    const connection = this.connections.get(id);
    
    if (!connection) {
      return undefined;
    }
    
    const updatedConnection: Connection = { ...connection, status };
    this.connections.set(id, updatedConnection);
    return updatedConnection;
  }
  
  async getSavedPlaces(userId: number): Promise<SavedPlace[]> {
    return Array.from(this.savedPlaces.values()).filter(
      (savedPlace) => savedPlace.userId === userId,
    );
  }
  
  async savePlaceForUser(savedPlace: InsertSavedPlace): Promise<SavedPlace> {
    const id = this.currentSavedPlaceId++;
    const newSavedPlace: SavedPlace = { ...savedPlace, id, createdAt: new Date() };
    this.savedPlaces.set(id, newSavedPlace);
    return newSavedPlace;
  }
  
  async removeSavedPlace(id: number): Promise<void> {
    this.savedPlaces.delete(id);
  }
  
  private initializeSampleData() {
    // Create sample users
    const user1: User = {
      id: this.currentUserId++,
      username: 'aryann',
      password: 'password123',
      fullName: 'Aryan Varale',
      email: 'aaaryaannn@gmail.com',
      phone: '+919876543210',
      userType: 'tourist',
      createdAt: new Date()
    };
    
    const user2: User = {
      id: this.currentUserId++,
      username: 'johnsmith',
      password: 'guide123',
      fullName: 'John Smith',
      email: 'john@guide.com',
      phone: '+919876543211',
      userType: 'guide',
      createdAt: new Date()
    };
    
    const user3: User = {
      id: this.currentUserId++,
      username: 'sarawilson',
      password: 'guide456',
      fullName: 'Sara Wilson',
      email: 'sara@guide.com',
      phone: '+919876543212',
      userType: 'guide',
      createdAt: new Date()
    };
    
    this.users.set(user1.id, user1);
    this.users.set(user2.id, user2);
    this.users.set(user3.id, user3);
    
    // Create guide profiles
    const guideProfile1: GuideProfile = {
      id: this.currentGuideProfileId++,
      userId: user2.id,
      location: 'Mumbai',
      experience: 5,
      languages: ['English', 'Hindi', 'Marathi'],
      specialties: ['Historical Sites', 'Cultural Tours'],
      rating: 4,
      bio: 'Experienced guide specializing in historical and cultural tours of Maharashtra.'
    };
    
    const guideProfile2: GuideProfile = {
      id: this.currentGuideProfileId++,
      userId: user3.id,
      location: 'Pune',
      experience: 3,
      languages: ['English', 'Hindi', 'Marathi'],
      specialties: ['Adventure Tours', 'Photography Tours'],
      rating: 4,
      bio: 'Adventure and photography tour specialist with knowledge of less-traveled paths.'
    };
    
    this.guideProfiles.set(guideProfile1.id, guideProfile1);
    this.guideProfiles.set(guideProfile2.id, guideProfile2);
    
    // Create sample places
    const places: Place[] = [
      {
        id: this.currentPlaceId++,
        name: 'Gateway of India',
        description: 'Historic monument in Mumbai overlooking the Arabian Sea.',
        location: 'Mumbai',
        category: 'attraction',
        latitude: '18.9220',
        longitude: '72.8347',
        imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5'
      },
      {
        id: this.currentPlaceId++,
        name: 'Ajanta Caves',
        description: 'Ancient rock-cut Buddhist cave monuments dating from the 2nd century BCE.',
        location: 'Aurangabad',
        category: 'attraction',
        latitude: '20.5519',
        longitude: '75.7033',
        imageUrl: 'https://images.unsplash.com/photo-1590586767908-99b2d8a7b732'
      },
      {
        id: this.currentPlaceId++,
        name: 'Ellora Caves',
        description: 'UNESCO World Heritage site featuring Buddhist, Hindu and Jain monuments.',
        location: 'Aurangabad',
        category: 'attraction',
        latitude: '20.0258',
        longitude: '75.1795',
        imageUrl: 'https://images.unsplash.com/photo-1560108878-8145b2a56e9d'
      },
      {
        id: this.currentPlaceId++,
        name: 'Taj Hotel Mumbai',
        description: 'Luxury hotel in the heart of Mumbai with stunning architecture.',
        location: 'Mumbai',
        category: 'hotel',
        latitude: '18.9217',
        longitude: '72.8332',
        imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a'
      },
      {
        id: this.currentPlaceId++,
        name: 'Elephanta Caves',
        description: 'Ancient cave temples dedicated to Lord Shiva on Elephanta Island.',
        location: 'Mumbai',
        category: 'attraction',
        latitude: '18.9633',
        longitude: '72.9315',
        imageUrl: 'https://images.unsplash.com/photo-1625127251217-01a3e901985c'
      },
      {
        id: this.currentPlaceId++,
        name: 'Shaniwar Wada',
        description: 'Historical fortification in the city of Pune.',
        location: 'Pune',
        category: 'attraction',
        latitude: '18.5195',
        longitude: '73.8554',
        imageUrl: 'https://images.unsplash.com/photo-1623164938411-08c04aa33564'
      },
      {
        id: this.currentPlaceId++,
        name: 'Aga Khan Palace',
        description: 'Historical building in Pune, associated with Indian freedom movement.',
        location: 'Pune',
        category: 'attraction',
        latitude: '18.5476',
        longitude: '73.9009',
        imageUrl: 'https://images.unsplash.com/photo-1593269258530-bd0cc637cbb4'
      },
      {
        id: this.currentPlaceId++,
        name: 'Shirdi Sai Baba Temple',
        description: 'Temple dedicated to Sai Baba, considered a saint by his devotees.',
        location: 'Shirdi',
        category: 'attraction',
        latitude: '19.7669',
        longitude: '74.4761',
        imageUrl: 'https://images.unsplash.com/photo-1612280413587-326b28e62a23'
      }
    ];
    
    places.forEach(place => {
      this.places.set(place.id, place);
    });
    
    // Create sample connections
    const connection1: Connection = {
      id: this.currentConnectionId++,
      touristId: user1.id,
      guideId: user2.id,
      status: 'accepted',
      createdAt: new Date()
    };
    
    const connection2: Connection = {
      id: this.currentConnectionId++,
      touristId: user1.id,
      guideId: user3.id,
      status: 'accepted',
      createdAt: new Date()
    };
    
    this.connections.set(connection1.id, connection1);
    this.connections.set(connection2.id, connection2);
  }
}

export const storage = new MemStorage();
