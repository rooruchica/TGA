// Script to clean up test users in MongoDB Atlas
import { MongoClient, ObjectId } from 'mongodb';

// MongoDB connection URI
const uri = process.env.MONGODB_URI || 'mongodb+srv://aaaaryaannn:r9J2T4WMCNMjmJGm@tga.ajmql56.mongodb.net/maharashtra_tour_guide?retryWrites=true&w=majority&appName=TGA';
const dbName = 'maharashtra_tour_guide';

async function cleanupUsers() {
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('Successfully connected to MongoDB Atlas!');
    
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    const guideProfilesCollection = db.collection('guideProfiles');
    const connectionsCollection = db.collection('connections');
    
    // Get initial counts
    const totalUsers = await usersCollection.countDocuments();
    const totalGuides = await usersCollection.countDocuments({ userType: 'guide' });
    const totalTourists = await usersCollection.countDocuments({ userType: 'tourist' });
    
    console.log(`Initial counts:`);
    console.log(`- Total users: ${totalUsers}`);
    console.log(`- Guides: ${totalGuides}`);
    console.log(`- Tourists: ${totalTourists}`);
    
    // Define patterns for test users
    const testPatterns = [
      /^test/i,           // Starts with "test"
      /test$/i,           // Ends with "test"
      /example\.com$/i,   // Example.com email addresses
      /^guide$/i,         // Just "guide" username
      /^tourist$/i,       // Just "tourist" username
      /^test_guide_\d+$/i // test_guide_ followed by numbers
    ];
    
    // Find all test users
    let testUsers = [];
    for (const pattern of testPatterns) {
      const usersMatchingPattern = await usersCollection.find({
        $or: [
          { username: { $regex: pattern } },
          { email: { $regex: pattern } },
          { fullName: { $regex: /^Test /i } }
        ]
      }).toArray();
      
      testUsers.push(...usersMatchingPattern);
    }
    
    // Remove duplicates (users matching multiple patterns)
    const uniqueTestUsers = Array.from(new Map(testUsers.map(user => [user._id.toString(), user])).values());
    
    console.log(`\nFound ${uniqueTestUsers.length} test users to remove:`);
    
    // Delete test users and their related data
    for (const user of uniqueTestUsers) {
      console.log(`- Removing ${user.username} (${user._id}): ${user.fullName}, Email: ${user.email}, Type: ${user.userType}`);
      
      // Delete associated data
      if (user.userType === 'guide') {
        await guideProfilesCollection.deleteOne({ userId: user._id.toString() });
      }
      
      // Delete connections where user is either fromUser or toUser
      await connectionsCollection.deleteMany({
        $or: [
          { fromUserId: user._id.toString() },
          { toUserId: user._id.toString() }
        ]
      });
      
      // Delete the user
      await usersCollection.deleteOne({ _id: user._id });
    }
    
    // Get new counts
    const remainingUsers = await usersCollection.countDocuments();
    const remainingGuides = await usersCollection.countDocuments({ userType: 'guide' });
    const remainingTourists = await usersCollection.countDocuments({ userType: 'tourist' });
    
    console.log(`\nCleanup complete!`);
    console.log(`- Removed: ${totalUsers - remainingUsers} users`);
    console.log(`- Remaining users: ${remainingUsers}`);
    console.log(`  - Guides: ${remainingGuides}`);
    console.log(`  - Tourists: ${remainingTourists}`);
    
    // List remaining users
    console.log(`\nRemaining guides:`);
    const guides = await usersCollection.find({ userType: 'guide' }).toArray();
    guides.forEach((guide, i) => {
      console.log(`${i + 1}. ${guide.fullName} (${guide.username})`);
    });
    
    console.log(`\nRemaining tourists:`);
    const tourists = await usersCollection.find({ userType: 'tourist' }).toArray();
    tourists.forEach((tourist, i) => {
      console.log(`${i + 1}. ${tourist.fullName} (${tourist.username})`);
    });
    
  } catch (error) {
    console.error('Error cleaning up users:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

cleanupUsers().catch(console.error); 