import { db } from "../db";
import { placeSchema, userSchema, guideProfileSchema } from "@shared/schema";
import { maharashtraAttractions } from "./maharashtra-attractions";
import { maharashtraGuides } from "./maharashtra-guides";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { ObjectId } from "mongodb";

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
 * Fix missing location data for existing guides
 */
async function fixGuideLocations() {
  console.log("Checking for guides with missing location data...");
  
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
  
  // Get all guide users
  const guides = await db.collection('users').find({ userType: "guide" }).toArray();
  console.log(`Found ${guides.length} guides in database`);
  
  let fixedCount = 0;
  
  // Update each guide with missing location
  for (let index = 0; index < guides.length; index++) {
    const guide = guides[index];
    
    // Check if guide has location data
    if (!guide.currentLatitude || !guide.currentLongitude) {
      // Get a location from our predefined list
      const locationIndex = index % guideLocations.length;
      const location = guideLocations[locationIndex];
      
      // Update the guide with the location
      await db.collection('users').updateOne(
        { _id: guide._id },
        { 
          $set: { 
            currentLatitude: location.lat.toString(),
            currentLongitude: location.lng.toString(),
            lastLocationUpdate: new Date()
          } 
        }
      );
      
      console.log(`Fixed location for guide: ${guide.fullName} (${guide.username})`);
      fixedCount++;
    }
  }
  
  console.log(`Updated locations for ${fixedCount} guides`);
}

/**
 * Seeds attractions and guides if they are missing from the database
 * This is separate from the initial database seeding and will add
 * missing data even if users already exist
 */
export async function seedMissingData() {
  console.log("Checking for missing attractions and guides...");
  
  // Check current attractions count
  const existingPlaces = await db.collection('places').countDocuments();
  
  // If we only have a few attractions, add all from the maharashtraAttractions array
  if (existingPlaces < 10) {
    console.log(`Only ${existingPlaces} attractions found. Adding Maharashtra attractions...`);
    
    // Add each attraction one by one to avoid conflicts
    for (const attraction of maharashtraAttractions) {
      // Check if attraction with the same name already exists to avoid duplicates
      const existingAttraction = await db.collection('places').findOne({ name: attraction.name });
      
      if (!existingAttraction) {
        try {
          await db.collection('places').insertOne(placeSchema.parse(attraction));
          console.log(`Added attraction: ${attraction.name}`);
        } catch (error) {
          console.error(`Error adding attraction ${attraction.name}:`, error);
        }
      }
    }
  }
  
  // Check current guides count
  const existingGuides = await db.collection('users').countDocuments({ userType: "guide" });
  
  // If we only have a few guides, add all from the maharashtraGuides array
  if (existingGuides < 8) {
    console.log(`Only ${existingGuides} guides found. Adding Maharashtra guides...`);
    
    // Define fixed locations for guides in Maharashtra - same as in seed-database.ts
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
    
    // Add each guide one by one
    for (let index = 0; index < maharashtraGuides.length; index++) {
      const guide = maharashtraGuides[index];
      
      // Check if guide with the same username already exists
      const existingGuide = await db.collection('users').findOne({ username: guide.user.username });
      
      if (!existingGuide) {
        try {
          // Hash the guide password
          const hashedPassword = await hashPassword(guide.user.password);
          
          // Get the fixed location for this guide
          const locationIndex = index % guideLocations.length;
          const location = guideLocations[locationIndex];
          
          // Insert guide user with fixed location
          const guideUser = userSchema.parse({
            ...guide.user,
            password: hashedPassword,
            currentLatitude: location.lat.toString(),
            currentLongitude: location.lng.toString(),
            lastLocationUpdate: new Date(),
            createdAt: new Date()
          });
          
          const result = await db.collection('users').insertOne(guideUser);
          
          // Insert guide profile with converted rating to integer
          const profile = guideProfileSchema.parse({
            ...guide.profile,
            userId: result.insertedId.toString(),
            rating: guide.profile.rating ? Math.round(guide.profile.rating) : null
          });
          
          await db.collection('guideProfiles').insertOne(profile);
          console.log(`Added guide: ${guide.user.fullName}`);
        } catch (error) {
          console.error(`Error adding guide ${guide.user.fullName}:`, error);
        }
      }
    }
  }
  
  // Fix guide locations for any guides missing location data
  await fixGuideLocations();
  
  console.log("Completed checking and adding missing data.");
}