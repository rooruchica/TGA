import { db } from "../db";
import { places, users, guideProfiles } from "@shared/schema";
import { maharashtraAttractions } from "./maharashtra-attractions";
import { maharashtraGuides } from "./maharashtra-guides";
import { log } from "../vite";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { getRandomLocation } from "../../client/src/lib/geolocation";

const scryptAsync = promisify(scrypt);

// Hash password helper
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedAttractions() {
  // Check if we already have the full set of attractions
  const existingPlacesCount = await db.select({ count: { value: places.id } }).from(places);
  const count = Number(existingPlacesCount[0]?.count?.value || 0);
  
  if (count >= 50) {
    log("Attractions already seeded - skipping", "database");
    return;
  }
  
  // Clear existing attractions if any
  if (count > 0) {
    log("Clearing existing attractions to seed new ones", "database");
    await db.delete(places);
  }
  
  // Insert new attractions
  log(`Seeding ${maharashtraAttractions.length} attractions`, "database");
  for (const attraction of maharashtraAttractions) {
    await db.insert(places).values(attraction);
  }
  
  log("Attractions seeded successfully", "database");
}

export async function seedGuides() {
  // First, check how many guides we already have
  const existingGuidesCount = await db.select({ count: { value: users.id } })
    .from(users)
    .where({ userType: "guide" });
  
  const count = Number(existingGuidesCount[0]?.count?.value || 0);
  
  // If we already have more than 10 guides, don't add more
  if (count >= 10) {
    log("Guides already seeded - skipping", "database");
    return;
  }
  
  // Get some tourist locations to use as reference points for placing guides
  const touristLocations = await db.select({
    latitude: places.latitude,
    longitude: places.longitude
  }).from(places).limit(5);
  
  if (!touristLocations.length) {
    log("No places found to reference guide locations - skipping", "database");
    return;
  }
  
  log(`Seeding ${maharashtraGuides.length} guides`, "database");
  
  for (const guide of maharashtraGuides) {
    // Hash the password
    const hashedPassword = await hashPassword(guide.user.password);
    
    // Pick a random tourist location as reference
    const referenceLocation = touristLocations[Math.floor(Math.random() * touristLocations.length)];
    
    // Generate a location within 5-10km of a tourist attraction
    const distanceInKm = 5 + (Math.random() * 5); // 5-10km
    const randomLocation = getRandomLocation(
      parseFloat(referenceLocation.latitude),
      parseFloat(referenceLocation.longitude),
      distanceInKm
    );
    
    // Insert the guide user
    const [insertedUser] = await db.insert(users).values({
      ...guide.user,
      password: hashedPassword,
      currentLatitude: randomLocation.lat.toString(),
      currentLongitude: randomLocation.lng.toString(),
      lastLocationUpdate: new Date()
    }).returning();
    
    // Insert guide profile with the user ID
    await db.insert(guideProfiles).values({
      ...guide.profile,
      userId: insertedUser.id
    });
  }
  
  log("Guides seeded successfully", "database");
}