import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User profile schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  userType: text("user_type").notNull(), // 'tourist' or 'guide'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Guide profile schema
export const guideProfiles = pgTable("guide_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  location: text("location").notNull(),
  experience: integer("experience").notNull(), // years of experience
  languages: text("languages").array().notNull(),
  specialties: text("specialties").array().notNull(),
  rating: integer("rating"),
  bio: text("bio"),
});

export const insertGuideProfileSchema = createInsertSchema(guideProfiles).omit({
  id: true,
});

// Places schema
export const places = pgTable("places", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  category: text("category").notNull(), // 'attraction', 'hotel', 'restaurant', etc.
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  imageUrl: text("image_url"),
});

export const insertPlaceSchema = createInsertSchema(places).omit({
  id: true,
});

// Itineraries schema
export const itineraries = pgTable("itineraries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertItinerarySchema = createInsertSchema(itineraries).omit({
  id: true,
  createdAt: true,
});

// ItineraryPlaces schema
export const itineraryPlaces = pgTable("itinerary_places", {
  id: serial("id").primaryKey(),
  itineraryId: integer("itinerary_id").notNull().references(() => itineraries.id),
  placeId: integer("place_id").notNull().references(() => places.id),
  day: integer("day"),
  order: integer("order"),
});

export const insertItineraryPlaceSchema = createInsertSchema(itineraryPlaces).omit({
  id: true,
});

// Bookings schema
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'hotel', 'transport'
  from: text("from"),
  to: text("to"),
  departureDate: date("departure_date"),
  returnDate: date("return_date"),
  passengers: integer("passengers"),
  roomCount: integer("room_count"),
  bookingDetails: text("booking_details"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

// Connections schema
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  touristId: integer("tourist_id").notNull().references(() => users.id),
  guideId: integer("guide_id").notNull().references(() => users.id),
  status: text("status").notNull(), // 'pending', 'accepted', 'rejected'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  createdAt: true,
});

// SavedPlaces schema
export const savedPlaces = pgTable("saved_places", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  placeId: integer("place_id").notNull().references(() => places.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSavedPlaceSchema = createInsertSchema(savedPlaces).omit({
  id: true,
  createdAt: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type GuideProfile = typeof guideProfiles.$inferSelect;
export type InsertGuideProfile = z.infer<typeof insertGuideProfileSchema>;

export type Place = typeof places.$inferSelect;
export type InsertPlace = z.infer<typeof insertPlaceSchema>;

export type Itinerary = typeof itineraries.$inferSelect;
export type InsertItinerary = z.infer<typeof insertItinerarySchema>;

export type ItineraryPlace = typeof itineraryPlaces.$inferSelect;
export type InsertItineraryPlace = z.infer<typeof insertItineraryPlaceSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;

export type SavedPlace = typeof savedPlaces.$inferSelect;
export type InsertSavedPlace = z.infer<typeof insertSavedPlaceSchema>;
