// Test script to verify that guide locations are consistent
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';

// Fetch guides multiple times to verify location consistency
async function testLocationConsistency() {
  try {
    console.log('=== GUIDE LOCATION CONSISTENCY TEST ===');
    
    // Get all guides first
    console.log('\nFetching all guides first:');
    let allGuidesResponse;
    try {
      allGuidesResponse = await fetch(`${API_BASE_URL}/api/guides`);
      if (!allGuidesResponse.ok) {
        throw new Error(`Server returned ${allGuidesResponse.status}: ${allGuidesResponse.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching all guides:', error.message);
      console.log('Is the server running on port 5000?');
      return;
    }
    
    const allGuides = await allGuidesResponse.json();
    console.log(`Found ${allGuides.length} guides in total`);
    
    // Coordinates for Pune
    const testLat = 18.52;
    const testLng = 73.85;
    
    // Get nearby guides three times to check if distances are consistent
    console.log('\nFetching nearby guides 3 times to verify location consistency:');
    
    let runs = [];
    
    for (let i = 0; i < 3; i++) {
      console.log(`\nRun ${i + 1}:`);
      try {
        const nearbyResponse = await fetch(`${API_BASE_URL}/api/nearby/guides?latitude=${testLat}&longitude=${testLng}`);
        
        if (!nearbyResponse.ok) {
          throw new Error(`Server returned ${nearbyResponse.status}: ${nearbyResponse.statusText}`);
        }
        
        const nearbyGuides = await nearbyResponse.json();
        
        console.log(`Found ${nearbyGuides.length} nearby guides:`);
        const guideInfo = nearbyGuides.map((guide) => {
          return {
            id: guide.id,
            username: guide.username,
            fullName: guide.fullName,
            distance: guide.distance,
            latitude: guide.currentLatitude,
            longitude: guide.currentLongitude
          };
        });
        
        guideInfo.forEach((guide, index) => {
          console.log(`${index + 1}. ${guide.fullName} (${guide.username})`);
          console.log(`   - Distance: ${guide.distance.toFixed(2)} km`);
          console.log(`   - Location: [${guide.latitude}, ${guide.longitude}]`);
        });
        
        runs.push(guideInfo);
      } catch (error) {
        console.error(`Error in run ${i + 1}:`, error.message);
        runs.push([]); // Push empty array to maintain run index
      }
    }
    
    // Check if we have enough data to verify consistency
    if (runs[0].length === 0) {
      console.error('\nERROR: No nearby guides found in the first run. Cannot verify consistency.');
      return;
    }
    
    // Verify location consistency across runs
    console.log('\n=== LOCATION CONSISTENCY CHECK ===');
    console.log('Checking if guide locations are consistent across multiple requests:');
    
    let allConsistent = true;
    
    // Check each guide that appears in the first run
    for (const guide of runs[0]) {
      console.log(`\nChecking guide: ${guide.fullName} (${guide.username})`);
      
      // Find this guide in the other runs
      const locations = runs.map(run => {
        const sameGuide = run.find(g => g.id === guide.id);
        return sameGuide ? { 
          lat: sameGuide.latitude, 
          lng: sameGuide.longitude,
          distance: sameGuide.distance
        } : null;
      });
      
      // Check if all locations are the same (skip null entries)
      const validLocations = locations.filter(loc => loc !== null);
      if (validLocations.length < 2) {
        console.log('⚠️ Guide not found in enough runs to verify consistency');
        continue;
      }
      
      const allLocationsSame = validLocations.every((loc, i, arr) => 
        i === 0 || (loc.lat === arr[0].lat && loc.lng === arr[0].lng)
      );
      
      if (allLocationsSame) {
        console.log('✅ Locations consistent across all requests - REAL LOCATIONS CONFIRMED');
        console.log(`   Location: [${validLocations[0].lat}, ${validLocations[0].lng}]`);
        console.log(`   Distance: ${validLocations[0].distance.toFixed(2)} km`);
      } else {
        allConsistent = false;
        console.log('❌ Locations are different across requests - RANDOM LOCATIONS DETECTED');
        validLocations.forEach((loc, i) => {
          if (loc) {
            console.log(`   Run ${i+1}: [${loc.lat}, ${loc.lng}], Distance: ${loc.distance.toFixed(2)} km`);
          }
        });
      }
    }
    
    // Final verdict
    console.log('\n=== FINAL VERDICT ===');
    if (allConsistent) {
      console.log('✅ SUCCESS: Guide locations are consistent across all requests.');
      console.log('This confirms the API is using real guide locations from the database.');
    } else {
      console.log('❌ FAIL: Guide locations are different across requests.');
      console.log('This suggests the API is generating random locations instead of using real data.');
    }
  } catch (error) {
    console.error('Unhandled error in test script:', error);
  }
}

// Run the test
testLocationConsistency(); 