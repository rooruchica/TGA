// Script to manage guide users in MongoDB Atlas
import { MongoClient, ObjectId } from 'mongodb';
import { promises as fs } from 'fs';

// MongoDB connection URI (will be read from .env or command line)
let uri = process.env.MONGODB_URI || 'mongodb+srv://aaaaryaannn:r9J2T4WMCNMjmJGm@tga.ajmql56.mongodb.net/maharashtra_tour_guide?retryWrites=true&w=majority&appName=TGA';
const dbName = 'maharashtra_tour_guide';

async function manageGuideUsers() {
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('Successfully connected to MongoDB Atlas!');
    
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    const guideProfilesCollection = db.collection('guideProfiles');
    
    // Count all users
    const totalUsers = await usersCollection.countDocuments();
    console.log(`Total users in database: ${totalUsers}`);
    
    // Get all guide users
    const guides = await usersCollection.find({ userType: 'guide' }).toArray();
    console.log(`\nFound ${guides.length} guide users:`);
    
    // Display all guides with key information
    guides.forEach((guide, index) => {
      console.log(`\n${index + 1}. Guide: ${guide.username || 'No username'}`);
      console.log(`   ID: ${guide._id}`);
      console.log(`   Email: ${guide.email || 'No email'}`);
      console.log(`   Full Name: ${guide.fullName || 'No name'}`);
      console.log(`   Created: ${guide.createdAt}`);
    });
    
    // Check if we need to delete guides
    if (guides.length <= 5) {
      console.log('\nNo need to delete guides - there are 5 or fewer guide users');
      return;
    }
    
    console.log(`\nWill keep 5 guides and delete ${guides.length - 5} extra guides`);
    
    // Sort guides by creation date (newest first) to keep the newest 5
    guides.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(0);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(0);
      return dateB - dateA;
    });
    
    const guidesToKeep = guides.slice(0, 5);
    const guidesToDelete = guides.slice(5);
    
    console.log('\nKeeping these guides:');
    guidesToKeep.forEach((guide, index) => {
      console.log(`${index + 1}. ${guide.username} (${guide._id}): ${guide.fullName}`);
    });
    
    console.log('\nDeleting these guides:');
    for (const guide of guidesToDelete) {
      console.log(`- Deleting ${guide.username} (${guide._id}): ${guide.fullName}`);
      
      // Delete guide profile first
      await guideProfilesCollection.deleteOne({ userId: guide._id.toString() });
      // Then delete the guide user
      await usersCollection.deleteOne({ _id: guide._id });
      
      console.log(`  ✓ Deleted guide ${guide.username} and their profile`);
    }
    
    // Final count
    const remainingGuides = await usersCollection.countDocuments({ userType: 'guide' });
    console.log(`\nOperation complete. ${remainingGuides} guides remaining in database.`);
    
  } catch (error) {
    console.error('Error managing guide users:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

manageGuideUsers().catch(console.error); 