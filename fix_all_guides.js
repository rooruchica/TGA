// Script to update all guides with location data
import { MongoClient, ObjectId } from 'mongodb';

// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'maharashtra_tourism';

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

async function fixGuidesLocations() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected to MongoDB server');
    
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    
    // Find all guides
    const guides = await usersCollection.find({ userType: 'guide' }).toArray();
    console.log(`Found ${guides.length} guides in database`);
    
    let fixedCount = 0;
    let alreadyFixedCount = 0;
    
    // Update each guide with location data if missing
    for (const guide of guides) {
      // Check if guide already has location data
      if (guide.currentLatitude && guide.currentLongitude) {
        console.log(`Guide ${guide.fullName} already has location data [${guide.currentLatitude}, ${guide.currentLongitude}]`);
        alreadyFixedCount++;
        continue;
      }
      
      // Choose a random location
      const randomLocation = guideLocations[Math.floor(Math.random() * guideLocations.length)];
      console.log(`Assigning location to guide ${guide.fullName}: [${randomLocation.lat}, ${randomLocation.lng}]`);
      
      // Update guide with location data
      const updateResult = await usersCollection.updateOne(
        { _id: new ObjectId(guide._id) },
        { 
          $set: { 
            currentLatitude: randomLocation.lat.toString(),
            currentLongitude: randomLocation.lng.toString(),
            lastLocationUpdate: new Date()
          } 
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        fixedCount++;
        console.log(`Updated guide ${guide.fullName} with location data`);
      } else {
        console.log(`Failed to update guide ${guide.fullName}`);
      }
    }
    
    console.log(`\nSummary:`);
    console.log(`- Total guides: ${guides.length}`);
    console.log(`- Guides already fixed: ${alreadyFixedCount}`);
    console.log(`- Guides fixed now: ${fixedCount}`);
    console.log(`- Guides failed to fix: ${guides.length - alreadyFixedCount - fixedCount}`);
    
  } catch (error) {
    console.error('Error fixing guide locations:', error);
  } finally {
    // Close the connection
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
fixGuidesLocations(); 