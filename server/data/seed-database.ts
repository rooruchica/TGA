import { db } from "../db";
import { users, guideProfiles, places, 
         insertUserSchema, insertGuideProfileSchema, insertPlaceSchema } from "@shared/schema";
import { maharashtraAttractions } from "./maharashtra-attractions";
import { maharashtraGuides } from "./maharashtra-guides";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

/**
 * Utility function to hash passwords
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Seeds the database with sample data for Maharashtra tourism app
 */
export async function seedDatabase() {
  console.log("Starting database seeding...");
  
  try {
    // Check if there's any data already
    const userCount = await db.select({ count: users.id }).from(users);
    if (userCount[0].count > 0) {
      console.log("Database already seeded. Skipping seeding process.");
      return;
    }
    
    // Seed tourist users
    const demoTourist = {
      username: "demo_tourist",
      password: await hashPassword("tourist1234"),
      fullName: "Demo Tourist",
      email: "tourist@example.com",
      phone: "+91 9798765432",
      userType: "tourist",
      currentLatitude: "18.9220", // Gateway of India location
      currentLongitude: "72.8347",
    };
    
    const tourist2 = {
      username: "arun_tourist",
      password: await hashPassword("tourist1234"),
      fullName: "Arun Kumar",
      email: "arun@example.com",
      phone: "+91 9712345678",
      userType: "tourist",
      currentLatitude: "18.5204", // Pune location
      currentLongitude: "73.8567",
    };
    
    const tourist3 = {
      username: "neha_tourist",
      password: await hashPassword("tourist1234"),
      fullName: "Neha Sharma",
      email: "neha@example.com",
      phone: "+91 9723456789",
      userType: "tourist",
      currentLatitude: "19.9975", // Nashik location
      currentLongitude: "73.7898",
    };
    
    console.log("Inserting tourist users...");
    await db.insert(users).values([
      insertUserSchema.parse(demoTourist),
      insertUserSchema.parse(tourist2),
      insertUserSchema.parse(tourist3)
    ]);
    
    // Seed guide users and profiles
    console.log("Inserting guide users and profiles...");
    for (const guide of maharashtraGuides) {
      // Hash the guide password
      const hashedPassword = await hashPassword(guide.user.password);
      
      // Insert the guide user first
      const [insertedGuide] = await db.insert(users)
        .values(insertUserSchema.parse({
          ...guide.user,
          password: hashedPassword,
          // Set random coordinates near Mumbai for testing
          currentLatitude: (18.92 + (Math.random() * 0.1)).toString(),
          currentLongitude: (72.83 + (Math.random() * 0.1)).toString(),
        }))
        .returning();
      
      // Then insert the guide profile with the correct userId
      await db.insert(guideProfiles)
        .values(insertGuideProfileSchema.parse({
          ...guide.profile,
          userId: insertedGuide.id
        }));
    }
    
    // Seed places/attractions
    console.log("Inserting Maharashtra attractions...");
    for (const attraction of maharashtraAttractions) {
      await db.insert(places)
        .values(insertPlaceSchema.parse(attraction));
    }
    
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}