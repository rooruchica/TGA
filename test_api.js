// Simple Node.js script to test the guide API endpoints
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';

// Test getting all guides
async function getAllGuides() {
  try {
    console.log('Fetching all guides...');
    const response = await fetch(`${API_BASE_URL}/api/guides`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log(`Found ${data.length} guides:`);
    data.forEach((guide, index) => {
      console.log(`${index + 1}. ${guide.fullName} (${guide.username}) - ${guide.guideProfile?.location || 'Location unknown'}`);
    });
    return data;
  } catch (error) {
    console.error('Error fetching guides:', error);
    return [];
  }
}

// Test getting nearby guides
async function getNearbyGuides(latitude, longitude) {
  try {
    console.log(`Fetching guides near [${latitude}, ${longitude}]...`);
    const response = await fetch(`${API_BASE_URL}/api/nearby/guides?latitude=${latitude}&longitude=${longitude}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log(`Found ${data.length} nearby guides:`);
    data.forEach((guide, index) => {
      console.log(`${index + 1}. ${guide.fullName} (${guide.username}) - Distance: ${guide.distance.toFixed(2)} km`);
    });
    return data;
  } catch (error) {
    console.error('Error fetching nearby guides:', error);
    return [];
  }
}

// Test registering a new guide
async function registerGuide(guideData) {
  try {
    console.log(`Registering new guide: ${guideData.fullName}...`);
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(guideData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Registration failed:', data);
      return null;
    }
    
    console.log('Guide registered successfully:', data);
    return data;
  } catch (error) {
    console.error('Error registering guide:', error);
    return null;
  }
}

// Run the tests
async function runTests() {
  console.log('=== API TEST SCRIPT ===');
  
  // Test 1: Get all guides
  console.log('\n--- Test 1: Get All Guides ---');
  const allGuides = await getAllGuides();
  
  // Test 2: Get nearby guides (Pune coordinates)
  console.log('\n--- Test 2: Get Nearby Guides ---');
  await getNearbyGuides(18.52, 73.85);
  
  // Test 3: Register a new guide
  console.log('\n--- Test 3: Register New Guide ---');
  const newGuide = {
    username: `test_guide_${Date.now()}`,
    email: `test_guide_${Date.now()}@example.com`,
    password: 'test123',
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
  
  const registeredGuide = await registerGuide(newGuide);
  
  // Test 4: Verify the new guide appears in the list
  if (registeredGuide) {
    console.log('\n--- Test 4: Verify New Guide ---');
    console.log('Waiting 2 seconds for database to update...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const updatedGuides = await getAllGuides();
    
    const newGuideExists = updatedGuides.some(g => 
      g.username === newGuide.username && g.email === newGuide.email
    );
    
    console.log('New guide found in guides list:', newGuideExists ? 'YES' : 'NO');
  }
  
  console.log('\n=== TESTS COMPLETED ===');
}

runTests(); 