import { db } from "../db";
import { 
  places, 
  users, 
  guideProfiles 
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { maharashtraAttractions } from "./maharashtra-attractions";
import { maharashtraGuides } from "./maharashtra-guides";

/**
 * Seeds attractions and guides if they are missing from the database
 * This is separate from the initial database seeding and will add
 * missing data even if users already exist
 */
export async function seedMissingData() {
  console.log("Checking for missing attractions and guides...");
  
  // Check current attractions count
  const existingPlaces = await db.select().from(places);
  
  // If we only have a few attractions, add all from the maharashtraAttractions array
  if (existingPlaces.length < 10) {
    console.log(`Only ${existingPlaces.length} attractions found. Adding Maharashtra attractions...`);
    
    // Add each attraction one by one to avoid conflicts
    for (const attraction of maharashtraAttractions) {
      // Check if attraction with the same name already exists to avoid duplicates
      const existingAttraction = await db.select()
        .from(places)
        .where(eq(places.name, attraction.name));
      
      if (existingAttraction.length === 0) {
        try {
          await db.insert(places).values(attraction);
          console.log(`Added attraction: ${attraction.name}`);
        } catch (error) {
          console.error(`Error adding attraction ${attraction.name}:`, error);
        }
      }
    }
  }
  
  // Check current guides count
  const existingGuides = await db.select()
    .from(users)
    .where(eq(users.userType, "guide"));
  
  // If we only have a few guides, add all from the maharashtraGuides array
  if (existingGuides.length < 8) {
    console.log(`Only ${existingGuides.length} guides found. Adding Maharashtra guides...`);
    
    // Add each guide one by one
    for (const guide of maharashtraGuides) {
      // Check if guide with the same username already exists
      const existingGuide = await db.select()
        .from(users)
        .where(eq(users.username, guide.user.username));
      
      if (existingGuide.length === 0) {
        try {
          // Insert guide user
          const [user] = await db.insert(users).values({
            username: guide.user.username,
            password: guide.user.password,
            fullName: guide.user.fullName,
            email: guide.user.email,
            phone: guide.user.phone,
            userType: guide.user.userType,
            currentLatitude: (18.5 + Math.random() * 1.5).toString(), // Random location in Maharashtra
            currentLongitude: (73.5 + Math.random() * 1.5).toString(),
            lastLocationUpdate: new Date(),
            createdAt: new Date()
          }).returning();
          
          // Insert guide profile with converted rating to integer
          const profile = {
            ...guide.profile,
            userId: user.id,
            rating: guide.profile.rating ? Math.round(guide.profile.rating) : null
          };
          
          await db.insert(guideProfiles).values(profile);
          console.log(`Added guide: ${guide.user.fullName}`);
        } catch (error) {
          console.error(`Error adding guide ${guide.user.fullName}:`, error);
        }
      }
    }
  }
  
  console.log("Completed checking and adding missing data.");
}