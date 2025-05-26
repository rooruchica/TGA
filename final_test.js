// Final test script to verify location consistency
import fetch from 'node-fetch';

// Test coordinates (Pune)
const testLat = 18.52;
const testLng = 73.85;
const API_URL = `http://localhost:5000/api/nearby/guides?latitude=${testLat}&longitude=${testLng}`;

// Main test function
async function runTest() {
  console.log('=== TESTING GUIDE LOCATION CONSISTENCY ===\n');
  
  // Make first request
  console.log('Making first request...');
  const firstResponse = await fetch(API_URL);
  const firstGuides = await firstResponse.json();
  
  // Make second request
  console.log('Making second request...');
  const secondResponse = await fetch(API_URL);
  const secondGuides = await secondResponse.json();
  
  // Compare results
  console.log(`\nFirst request found ${firstGuides.length} guides`);
  console.log(`Second request found ${secondGuides.length} guides`);
  
  // Check consistency
  console.log('\n=== CHECKING LOCATION CONSISTENCY ===\n');
  
  // Find guides that appear in both results
  let inconsistentGuides = 0;
  let consistentGuides = 0;
  
  for (const guide1 of firstGuides) {
    // Find the same guide in the second result
    const guide2 = secondGuides.find(g => g.id === guide1.id);
    
    if (!guide2) {
      console.log(`Guide ${guide1.fullName} only appeared in first request`);
      continue;
    }
    
    // Compare coordinates
    const loc1 = [guide1.currentLatitude, guide1.currentLongitude];
    const loc2 = [guide2.currentLatitude, guide2.currentLongitude];
    
    if (loc1[0] === loc2[0] && loc1[1] === loc2[1]) {
      consistentGuides++;
      console.log(`✅ ${guide1.fullName}: Consistent location [${loc1[0]}, ${loc1[1]}]`);
    } else {
      inconsistentGuides++;
      console.log(`❌ ${guide1.fullName}: Inconsistent location!`);
      console.log(`   Request 1: [${loc1[0]}, ${loc1[1]}]`);
      console.log(`   Request 2: [${loc2[0]}, ${loc2[1]}]`);
    }
  }
  
  // Final verdict
  console.log('\n=== FINAL VERDICT ===');
  if (inconsistentGuides === 0 && consistentGuides > 0) {
    console.log('✅ SUCCESS: All guide locations are consistent across requests.');
  } else if (inconsistentGuides > 0) {
    console.log(`❌ FAIL: Found ${inconsistentGuides} guides with inconsistent locations.`);
  } else {
    console.log('⚠️ WARNING: Could not properly verify consistency.');
  }
}

// Run the test
runTest().catch(error => {
  console.error('Error running test:', error);
}); 