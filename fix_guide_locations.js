// Script to fix missing guide locations in the database
import { MongoClient, ObjectId } from 'mongodb';

// Connect to MongoDB
async function main() {
  console.log('Connecting to MongoDB...');
  
  // Use the correct connection string from the .env file
  const uri = "mongodb+srv://aaaaryaannn:r9J2T4WMCNMjmJGm@tga.ajmql56.mongodb.net/maharashtra_tour_guide?retryWrites=true&w=majority&appName=TGA";
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('maharashtra_tour_guide');
    
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
    
    // Get all guides
    const guides = await db.collection('users').find({ userType: "guide" }).toArray();
    console.log(`Found ${guides.length} guides in the database`);
    
    let fixedCount = 0;
    
    // Update each guide with location data
    for (let i = 0; i < guides.length; i++) {
      const guide = guides[i];
      const locationIndex = i % guideLocations.length;
      const location = guideLocations[locationIndex];
      
      console.log(`Updating guide: ${guide.fullName} (${guide.username})`);
      console.log(`  ID: ${guide._id}`);
      console.log(`  Current latitude: ${guide.currentLatitude || 'MISSING'}`);
      console.log(`  Current longitude: ${guide.currentLongitude || 'MISSING'}`);
      console.log(`  Setting to: ${location.lat}, ${location.lng}`);
      
      // Update the guide in the database
      const result = await db.collection('users').updateOne(
        { _id: guide._id },
        { 
          $set: { 
            currentLatitude: location.lat.toString(),
            currentLongitude: location.lng.toString(),
            lastLocationUpdate: new Date()
          } 
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`  ✅ Successfully updated location`);
        fixedCount++;
      } else {
        console.log(`  ❌ Failed to update location`);
      }
    }
    
    console.log(`\nFixed locations for ${fixedCount} guides`);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

main().catch(console.error); 