// Simple test script to check the nearby guides API
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';

// Test latitude/longitude (Pune)
const testLat = 18.52;
const testLng = 73.85;

async function testNearbyGuides() {
  try {
    console.log('=== NEARBY GUIDES API TEST ===\n');
    
    console.log(`Fetching nearby guides at coordinates: [${testLat}, ${testLng}]`);
    
    const response = await fetch(`${API_BASE_URL}/api/nearby/guides?latitude=${testLat}&longitude=${testLng}`);
    
    if (!response.ok) {
      console.error(`Error: Server returned ${response.status} ${response.statusText}`);
      return;
    }
    
    const guides = await response.json();
    
    console.log(`\nFound ${guides.length} nearby guides:`);
    
    if (guides.length === 0) {
      console.log('No guides found near the test coordinates.');
      return;
    }
    
    guides.forEach((guide, index) => {
      console.log(`\nGuide ${index + 1}: ${guide.fullName} (${guide.username})`);
      console.log(`  ID: ${guide.id}`);
      console.log(`  Location: [${guide.currentLatitude}, ${guide.currentLongitude}]`);
      console.log(`  Distance: ${guide.distance ? guide.distance.toFixed(2) + ' km' : 'Not available'}`);
      console.log(`  Rating: ${guide.guideProfile?.rating || 'New'}`);
    });
    
    console.log('\n=== VERIFICATION ===');
    // Verify that guide locations exist and are valid numbers
    const validLocations = guides.every(guide => 
      guide.currentLatitude && 
      guide.currentLongitude && 
      !isNaN(parseFloat(guide.currentLatitude)) && 
      !isNaN(parseFloat(guide.currentLongitude))
    );
    
    if (validLocations) {
      console.log('✅ SUCCESS: All guides have valid location coordinates.');
    } else {
      console.log('❌ FAIL: Some guides have missing or invalid location coordinates.');
    }
    
  } catch (error) {
    console.error('Error testing nearby guides API:', error);
  }
}

// Run the test
testNearbyGuides(); 