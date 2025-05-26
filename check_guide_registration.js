// Script to test guide registration and verify location data
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';

// Test function to register a new guide
async function registerAndVerifyGuide() {
  console.log('=== GUIDE REGISTRATION TEST ===\n');
  
  const randomNumber = Math.floor(Math.random() * 10000);
  const timestamp = Date.now();
  
  // Create unique guide data
  const guideData = {
    username: `test_guide_${timestamp}`,
    email: `test_guide_${timestamp}@example.com`,
    password: 'password123',
    fullName: 'Test Guide',
    phone: '9998887777',
    userType: 'guide',
    guideProfile: {
      location: 'Nagpur',
      experience: 4,
      languages: ['English', 'Hindi', 'Marathi'],
      specialties: ['Wildlife Tours', 'Nature Walks'],
      rating: 4.2,
      bio: 'Guide specializing in wildlife tours and nature walks in Nagpur region.'
    }
  };
  
  try {
    // Step 1: Register the guide
    console.log(`Registering new guide: ${guideData.fullName} (${guideData.username})...`);
    
    const regResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guideData)
    });
    
    if (!regResponse.ok) {
      const errorData = await regResponse.json();
      console.error(`❌ Registration failed: ${regResponse.status} ${regResponse.statusText}`);
      console.error(errorData);
      return;
    }
    
    const registeredGuide = await regResponse.json();
    console.log(`✅ Guide registered successfully with ID: ${registeredGuide.id}`);
    console.log(`Full registration response:`, JSON.stringify(registeredGuide, null, 2));
    
    // Check if location data was assigned
    if (registeredGuide.currentLatitude && registeredGuide.currentLongitude) {
      console.log(`✅ Location data assigned: [${registeredGuide.currentLatitude}, ${registeredGuide.currentLongitude}]`);
    } else {
      console.log(`❌ No location data assigned during registration!`);
      console.log(`Fields returned in response: ${Object.keys(registeredGuide).join(', ')}`);
    }
    
    // Step 2: Verify guide appears in the guides list
    console.log('\nChecking if guide appears in all guides list...');
    const guidesResponse = await fetch(`${API_BASE_URL}/api/guides`);
    
    if (!guidesResponse.ok) {
      console.error(`❌ Failed to fetch guides: ${guidesResponse.status}`);
      return;
    }
    
    const allGuides = await guidesResponse.json();
    const foundGuide = allGuides.find(g => g.id === registeredGuide.id || g._id === registeredGuide.id);
    
    if (foundGuide) {
      console.log(`✅ Guide found in the guides list`);
      console.log(`Guide from list:`, JSON.stringify(foundGuide, null, 2));
    } else {
      console.log(`❌ Guide NOT found in the guides list!`);
      if (allGuides.length > 0) {
        console.log(`First guide in list: ${JSON.stringify(allGuides[0], null, 2)}`);
      }
    }
    
    // Step 3: Test nearby guides API
    console.log('\nTesting if guide appears in nearby guides API...');
    
    // Use a location in Nagpur (or wherever your guide was assigned)
    const userLat = 21.14;
    const userLng = 79.08;
    
    const nearbyResponse = await fetch(`${API_BASE_URL}/api/nearby/guides?latitude=${userLat}&longitude=${userLng}`);
    
    if (!nearbyResponse.ok) {
      console.error(`❌ Failed to fetch nearby guides: ${nearbyResponse.status}`);
      return;
    }
    
    const nearbyGuides = await nearbyResponse.json();
    const foundNearby = nearbyGuides.find(g => g.id === registeredGuide.id || g._id === registeredGuide.id);
    
    if (foundNearby) {
      console.log(`✅ Guide appears in nearby guides API results!`);
      console.log(`   Distance: ${foundNearby.distance ? foundNearby.distance.toFixed(2) + ' km' : 'Not available'}`);
      console.log(`   Guide from nearby results:`, JSON.stringify(foundNearby, null, 2));
    } else {
      console.log(`❌ Guide NOT found in nearby guides results!`);
      console.log(`   This could be because the guide was assigned a location far from the test coordinates.`);
      console.log(`   Test coordinates: [${userLat}, ${userLng}]`);
      console.log(`   Nearby guides found: ${nearbyGuides.length}`);
      if (nearbyGuides.length > 0) {
        console.log(`   First nearby guide: ${nearbyGuides[0].fullName} at [${nearbyGuides[0].currentLatitude}, ${nearbyGuides[0].currentLongitude}]`);
      }
    }
    
    // Step 4: Try to directly fetch user data
    console.log('\nTrying to fetch the guide directly...');
    
    try {
      const directUserResponse = await fetch(`${API_BASE_URL}/api/users/${registeredGuide.id}`);
      
      if (!directUserResponse.ok) {
        console.log(`❌ Failed to fetch user directly: ${directUserResponse.status}`);
      } else {
        const userData = await directUserResponse.json();
        console.log(`✅ User fetched directly:`, JSON.stringify(userData, null, 2));
      }
    } catch (error) {
      console.error(`❌ Error fetching user directly:`, error.message);
    }
    
    console.log('\n=== TEST COMPLETED ===');
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
registerAndVerifyGuide(); 