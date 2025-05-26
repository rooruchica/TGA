// Debug script to test the guide APIs
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';

async function debugGuideApis() {
  console.log('=== GUIDE API DEBUG TEST ===\n');
  
  try {
    // Step 1: Verify the server is running by getting all guides
    console.log('1. Fetching all guides to verify server connection...');
    
    const allGuidesResponse = await fetch(`${API_BASE_URL}/api/guides`);
    
    if (!allGuidesResponse.ok) {
      console.error(`❌ Server error: ${allGuidesResponse.status} ${allGuidesResponse.statusText}`);
      return;
    }
    
    const allGuides = await allGuidesResponse.json();
    console.log(`✅ Server is running! Found ${allGuides.length} guides.`);
    
    if (allGuides.length === 0) {
      console.error('⚠️ No guides found in the database. This might indicate a data issue.');
      return;
    }
    
    // Log guide locations to check if they have coordinates
    console.log('\n2. Checking if guides have location data:');
    let guidesWithLocation = 0;
    
    allGuides.forEach((guide, index) => {
      const hasLocation = !!(guide.currentLatitude && guide.currentLongitude);
      
      console.log(`Guide ${index + 1}: ${guide.fullName} (${guide.username})`);
      console.log(`  ID: ${guide.id}`);
      console.log(`  Has location: ${hasLocation ? '✅ YES' : '❌ NO'}`);
      
      if (hasLocation) {
        console.log(`  Location: [${guide.currentLatitude}, ${guide.currentLongitude}]`);
        guidesWithLocation++;
      }
    });
    
    console.log(`\n${guidesWithLocation} out of ${allGuides.length} guides have location data.`);
    
    if (guidesWithLocation === 0) {
      console.error('❌ CRITICAL ERROR: No guides have location data. This will cause the nearby guides API to return empty results.');
      return;
    }
    
    // Step 3: Test nearby guides with various coordinates
    console.log('\n3. Testing nearby guides API with different coordinates:');
    
    // Test locations across Maharashtra
    const testLocations = [
      { name: 'Mumbai', lat: 18.92, lng: 72.83 },
      { name: 'Pune', lat: 18.52, lng: 73.85 },
      { name: 'Nashik', lat: 19.99, lng: 73.78 },
      { name: 'Nagpur', lat: 21.14, lng: 79.08 }
    ];
    
    for (const location of testLocations) {
      console.log(`\nTesting nearby guides at ${location.name} [${location.lat}, ${location.lng}]...`);
      
      try {
        const nearbyResponse = await fetch(`${API_BASE_URL}/api/nearby/guides?latitude=${location.lat}&longitude=${location.lng}`);
        
        if (!nearbyResponse.ok) {
          console.error(`❌ Error: ${nearbyResponse.status} ${nearbyResponse.statusText}`);
          continue;
        }
        
        const nearbyGuides = await nearbyResponse.json();
        
        if (nearbyGuides.length === 0) {
          console.log(`⚠️ No guides found near ${location.name}`);
        } else {
          console.log(`✅ Found ${nearbyGuides.length} guides near ${location.name}`);
          
          // Check the first guide
          const firstGuide = nearbyGuides[0];
          console.log(`  First guide: ${firstGuide.fullName} (${firstGuide.username})`);
          console.log(`  Location: [${firstGuide.currentLatitude}, ${firstGuide.currentLongitude}]`);
          console.log(`  Distance: ${firstGuide.distance.toFixed(2)} km`);
        }
      } catch (error) {
        console.error(`❌ Error testing ${location.name}:`, error.message);
      }
    }
    
    // Step 4: Test location consistency
    console.log('\n4. Testing location consistency:');
    
    // Use Mumbai coordinates for consistency test
    const testLat = 18.92;
    const testLng = 72.83;
    
    console.log(`Making two consecutive requests at Mumbai [${testLat}, ${testLng}]...`);
    
    try {
      const firstResponse = await fetch(`${API_BASE_URL}/api/nearby/guides?latitude=${testLat}&longitude=${testLng}`);
      const firstGuides = await firstResponse.json();
      
      const secondResponse = await fetch(`${API_BASE_URL}/api/nearby/guides?latitude=${testLat}&longitude=${testLng}`);
      const secondGuides = await secondResponse.json();
      
      if (firstGuides.length === 0 || secondGuides.length === 0) {
        console.log('⚠️ Cannot test consistency because one or both requests returned no guides');
      } else {
        let allConsistent = true;
        
        for (const guide1 of firstGuides) {
          const guide2 = secondGuides.find(g => g.id === guide1.id);
          
          if (!guide2) continue;
          
          const loc1 = [guide1.currentLatitude, guide1.currentLongitude];
          const loc2 = [guide2.currentLatitude, guide2.currentLongitude];
          
          if (loc1[0] !== loc2[0] || loc1[1] !== loc2[1]) {
            allConsistent = false;
            console.log(`❌ Guide ${guide1.fullName} has inconsistent locations between requests`);
            console.log(`  Request 1: [${loc1[0]}, ${loc1[1]}]`);
            console.log(`  Request 2: [${loc2[0]}, ${loc2[1]}]`);
          }
        }
        
        if (allConsistent) {
          console.log('✅ All guide locations are consistent between requests');
        }
      }
    } catch (error) {
      console.error('❌ Error testing consistency:', error.message);
    }
    
    console.log('\n=== DEBUG TEST COMPLETED ===');
    
  } catch (error) {
    console.error('❌ Unhandled error in debug script:', error);
  }
}

// Run the debug test
debugGuideApis(); 