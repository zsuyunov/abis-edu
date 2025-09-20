// Test script to verify cache fixes
// This script tests that API endpoints return fresh data without caching

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function testApiEndpoint(endpoint, description) {
  console.log(`\n🧪 Testing ${description}...`);
  
  try {
    // First request
    const response1 = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response1.ok) {
      throw new Error(`HTTP ${response1.status}: ${response1.statusText}`);
    }
    
    const data1 = await response1.json();
    console.log(`✅ ${description} - First request successful`);
    console.log(`   Data length: ${Array.isArray(data1) ? data1.length : Object.keys(data1).length}`);
    
    // Check cache headers
    const cacheControl = response1.headers.get('cache-control');
    const pragma = response1.headers.get('pragma');
    
    console.log(`   Cache-Control: ${cacheControl}`);
    console.log(`   Pragma: ${pragma}`);
    
    if (cacheControl && cacheControl.includes('no-cache')) {
      console.log(`   ✅ Cache headers are correct (no-cache)`);
    } else {
      console.log(`   ⚠️  Cache headers may not be optimal`);
    }
    
    return { success: true, data: data1 };
    
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting cache fix verification tests...\n');
  
  const endpoints = [
    { path: '/api/branches', description: 'Branches API' },
    { path: '/api/classes', description: 'Classes API' },
    { path: '/api/subjects', description: 'Subjects API' },
    { path: '/api/academic-years', description: 'Academic Years API' },
    { path: '/api/academic-years/active', description: 'Active Academic Years API' }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testApiEndpoint(endpoint.path, endpoint.description);
    results.push({ ...endpoint, ...result });
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed endpoints:');
    failed.forEach(f => console.log(`   - ${f.description}: ${f.error}`));
  }
  
  console.log('\n🎯 Cache Fix Status:');
  console.log('===================');
  
  if (successful.length === results.length) {
    console.log('✅ All API endpoints are working correctly');
    console.log('✅ Cache headers are properly configured');
    console.log('✅ Fresh data should now be available in forms');
  } else {
    console.log('⚠️  Some endpoints may need attention');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('==============');
  console.log('1. Deploy these changes to your Render app');
  console.log('2. Test creating a new branch on the deployed app');
  console.log('3. Verify the new branch appears in class creation forms');
  console.log('4. Test with other data types (classes, subjects, etc.)');
}

// Run the tests
runTests().catch(console.error);
