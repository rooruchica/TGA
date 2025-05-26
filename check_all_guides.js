// Script to test guide registration and verify location data
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';

// Function to fetch all guides
async function fetchAndAnalyzeGuides() {
  console.log('=== GUIDE ANALYSIS TEST ===\n');
  
  try {
    // Get all guides
    console.log('Fetching all guides...');
    const guidesResponse = await fetch(`${API_BASE_URL}/api/guides`);
    
    if (!guidesResponse.ok) {
      console.error(`❌ Failed to fetch guides: ${guidesResponse.status}`);
      return;
    }
    
    const allGuides = await guidesResponse.json();
    console.log(`✅ Found ${allGuides.length} guides in total`);
    
    // Count guides with location data
    const guidesWithLocation = allGuides.filter(guide => 
      guide.currentLatitude && guide.currentLongitude
    );
    
    console.log(`✅ Guides with location data: ${guidesWithLocation.length}/${allGuides.length}`);
    
    // Show a few examples
    if (allGuides.length > 0) {
      console.log('\nSample guides:');
      
      // Take up to 3 guides to show as examples
      const samplesToShow = Math.min(3, allGuides.length);
      for (let i = 0; i < samplesToShow; i++) {
        const guide = allGuides[i];
        console.log(`\nGuide #${i + 1}: ${guide.fullName} (${guide.username})`);
        console.log(` - ID: ${guide.id || guide._id}`);
        console.log(` - User Type: ${guide.userType}`);
        console.log(` - Has latitude: ${guide.currentLatitude ? '✓ ' + guide.currentLatitude : '✗ MISSING'}`);
        console.log(` - Has longitude: ${guide.currentLongitude ? '✓ ' + guide.currentLongitude : '✗ MISSING'}`);
        
        // List all fields for the first guide
        if (i === 0) {
          console.log('\nAll fields in first guide:');
          Object.keys(guide).forEach(key => {
            // Don't show large objects or arrays in detail
            const value = guide[key];
            let displayValue;
            
            if (typeof value === 'object' && value !== null) {
              displayValue = Array.isArray(value) 
                ? `[Array with ${value.length} items]` 
                : '{Object}';
            } else {
              displayValue = value;
            }
            
            console.log(` - ${key}: ${displayValue}`);
          });
        }
      }
    }
    
    // Test nearby guides API with a fixed location
    console.log('\nTesting nearby guides API...');
    
    // Use a location in Nagpur
    const userLat = 21.14;
    const userLng = 79.08;
    
    const nearbyResponse = await fetch(`${API_BASE_URL}/api/nearby/guides?latitude=${userLat}&longitude=${userLng}`);
    
    if (!nearbyResponse.ok) {
      console.error(`❌ Failed to fetch nearby guides: ${nearbyResponse.status}`);
      return;
    }
    
    const nearbyGuides = await nearbyResponse.json();
    console.log(`✅ Found ${nearbyGuides.length} nearby guides`);
    
    if (nearbyGuides.length > 0) {
      console.log('\nSample nearby guides:');
      
      // Take up to 3 guides to show as examples
      const samplesToShow = Math.min(3, nearbyGuides.length);
      for (let i = 0; i < samplesToShow; i++) {
        const guide = nearbyGuides[i];
        console.log(`\nNearby Guide #${i + 1}: ${guide.fullName} (${guide.username})`);
        console.log(` - ID: ${guide.id || guide._id}`);
        console.log(` - User Type: ${guide.userType}`);
        console.log(` - Position: [${guide.currentLatitude}, ${guide.currentLongitude}]`);
        console.log(` - Distance: ${guide.distance ? guide.distance.toFixed(2) + ' km' : 'Not available'}`);
      }
      
      // List all fields for the first nearby guide
      if (nearbyGuides.length > 0) {
        console.log('\nAll fields in first nearby guide:');
        Object.keys(nearbyGuides[0]).forEach(key => {
          // Don't show large objects or arrays in detail
          const value = nearbyGuides[0][key];
          let displayValue;
          
          if (typeof value === 'object' && value !== null) {
            displayValue = Array.isArray(value) 
              ? `[Array with ${value.length} items]` 
              : '{Object}';
          } else {
            displayValue = value;
          }
          
          console.log(` - ${key}: ${displayValue}`);
        });
      }
    }
    
    console.log('\n=== TEST COMPLETED ===');
    
  } catch (error) {
    console.error('Error during analysis:', error);
  }
}

// Run the analysis
fetchAndAnalyzeGuides(); 