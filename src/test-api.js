// Simple test file to verify API services work
// Run with: node src/test-api.js

import { fetchHistoricData } from './service/PolygonAPI.js';

async function testPolygonAPI() {
  console.log('Testing Polygon API...');
  
  try {
    // Test with 1M range
    const data = await fetchHistoricData('1M');
    console.log('✅ Polygon API test successful!');
    console.log(`Fetched ${data.length} data points`);
    console.log('Sample data:', data.slice(0, 3));
  } catch (error) {
    console.log('❌ Polygon API test failed:', error.message);
  }
}

// Run the test
testPolygonAPI();
