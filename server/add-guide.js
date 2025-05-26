// Simple script to add a guide user to MongoDB
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'maharashtra_tour_guide';

async function addGuide() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // Check if guide user already exists
    const existingGuide = await db.collection('users').findOne({ username: 'guide' });
    if (existingGuide) {
      console.log('Guide user already exists:');
      console.log('Username: guide');
      console.log('Password:', existingGuide.password);
      console.log('ID:', existingGuide._id.toString());
      return;
    }
    
    // Create guide user
    const guideUser = {
      username: 'guide',
      email: 'guide@example.com',
      password: 'guide',
      fullName: 'Test Guide',
      phone: '9876543210',
      userType: 'guide',
      createdAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(guideUser);
    const guideId = result.insertedId.toString();
    
    console.log('Added guide user with ID:', guideId);
    
    // Create guide profile
    const guideProfile = {
      userId: guideId,
      location: 'Mumbai, Maharashtra',
      experience: 5,
      languages: ['English', 'Hindi', 'Marathi'],
      specialties: ['Historical sites', 'Local cuisine', 'Adventure tours'],
      rating: 4.8,
      bio: 'Experienced guide specializing in Mumbai tours.'
    };
    
    const profileResult = await db.collection('guideProfiles').insertOne(guideProfile);
    
    console.log('Added guide profile with ID:', profileResult.insertedId.toString());
    console.log('\nYou can now log in with:');
    console.log('Username: guide');
    console.log('Password: guide');
    
  } catch (error) {
    console.error('Error adding guide:', error);
  } finally {
    await client.close();
  }
}

addGuide(); 