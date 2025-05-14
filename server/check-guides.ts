import { db } from "./db";
import { initializeDatabase } from "./db";

async function checkGuides() {
  try {
    // Make sure the database is connected
    await initializeDatabase();
    
    console.log("Checking guide users in the database...");
    
    // Find all guide users
    const guides = await db.collection('users').find({ userType: 'guide' }).toArray();
    
    console.log(`\nFound ${guides.length} guide users:`);
    if (guides.length === 0) {
      console.log("No guide users found in the database.");
    } else {
      guides.forEach((guide, index) => {
        console.log(`\n${index + 1}. Guide: ${guide.username}`);
        console.log(`   ID: ${guide._id.toString()}`);
        console.log(`   Email: ${guide.email}`);
        console.log(`   Full Name: ${guide.fullName}`);
        console.log(`   Password: ${guide.password}`);
        console.log(`   Created: ${guide.createdAt}`);
      });
    }
    
    // Check guide profiles
    console.log("\nChecking guide profiles...");
    for (const guide of guides) {
      const guideId = guide._id.toString();
      const profile = await db.collection('guideProfiles').findOne({ userId: guideId });
      
      if (profile) {
        console.log(`\nProfile found for ${guide.username}:`);
        console.log(`   Profile ID: ${profile._id.toString()}`);
        console.log(`   Location: ${profile.location}`);
        console.log(`   Experience: ${profile.experience} years`);
        console.log(`   Languages: ${profile.languages?.join(', ') || 'None'}`);
        console.log(`   Specialties: ${profile.specialties?.join(', ') || 'None'}`);
      } else {
        console.log(`\nNo profile found for guide ${guide.username} (${guideId})`);
      }
    }
    
    // Check if the default 'guide' user exists
    const defaultGuide = await db.collection('users').findOne({ username: 'guide' });
    if (defaultGuide) {
      console.log("\nTest guide 'guide' exists in the database.");
      console.log("Login credentials: username=guide, password=", defaultGuide.password);
    } else {
      console.log("\nTest guide 'guide' does not exist in the database.");
      console.log("Run the create-guide.ts script to create a test guide account.");
    }
    
    console.log("\nDone!");
    process.exit(0);
  } catch (error) {
    console.error("Error checking guides:", error);
    process.exit(1);
  }
}

// Run the function
checkGuides(); 