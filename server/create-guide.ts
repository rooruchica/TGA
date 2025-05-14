import { db } from "./db.js";
import { initializeDatabase } from "./db.js";
import { userSchema, guideProfileSchema } from "../shared/schema.js";
import { ObjectId } from "mongodb";

async function createTestGuide() {
  try {
    // Make sure the database is connected
    await initializeDatabase();
    
    console.log("Creating test guide user 'guide'...");
    
    // Delete existing user with username 'guide' if it exists
    const existingUser = await db.collection('users').findOne({ username: 'guide' });
    if (existingUser) {
      console.log("Existing user found with username 'guide', removing...");
      await db.collection('users').deleteOne({ username: 'guide' });
      
      // Also remove any guide profile linked to this user
      if (existingUser._id) {
        await db.collection('guideProfiles').deleteOne({ userId: existingUser._id.toString() });
      }
    }
    
    // Create test guide user
    const testGuide = {
      username: "guide",
      email: "guide@example.com",
      password: "guide",
      fullName: "Test Guide",
      phone: "9876543210",
      userType: "guide",
      createdAt: new Date()
    };
    
    // Validate the user data
    const validatedGuide = userSchema.omit({ id: true }).parse(testGuide);
    
    // Insert the guide user
    const result = await db.collection('users').insertOne(validatedGuide);
    const guideId = result.insertedId.toString();
    console.log("Created test guide user with ID:", guideId);
    
    // Create guide profile
    const guideProfile = {
      userId: guideId,
      location: "Mumbai, Maharashtra",
      experience: 5,
      languages: ["English", "Hindi", "Marathi"],
      specialties: ["Historical sites", "Local cuisine", "Adventure tours"],
      rating: 4.8,
      bio: "Experienced guide specializing in Mumbai tours."
    };
    
    // Validate and insert guide profile
    const validatedProfile = guideProfileSchema.omit({ id: true }).parse(guideProfile);
    const profileResult = await db.collection('guideProfiles').insertOne(validatedProfile);
    
    console.log("Created guide profile with ID:", profileResult.insertedId.toString());
    console.log("\nYou can now log in with:");
    console.log("Username: guide");
    console.log("Password: guide");
    
    // Display all guide users for verification
    console.log("\nAll guide users in the database:");
    const allGuides = await db.collection('users').find({ userType: 'guide' }).toArray();
    allGuides.forEach(g => {
      console.log(`- ${g.username} (${g._id.toString()}): Password: ${g.password}`);
    });
    
    console.log("\nDone!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating test guide:", error);
    process.exit(1);
  }
}

// Run the function
createTestGuide(); 