/**
 * Test script for Members API
 * 
 * Usage:
 * 1. Set your API_KEY environment variable
 * 2. Update the BASE_URL to your deployment URL
 * 3. Run: node scripts/test-members-api.js
 */

const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

if (!API_KEY) {
  console.error('❌ Error: API_KEY environment variable is required');
  console.log('Usage: API_KEY=your_key node scripts/test-members-api.js');
  process.exit(1);
}

async function testMembersAPI() {
  console.log('🧪 Testing Members API...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
  console.log('─'.repeat(50));

  const tests = [
    {
      name: 'Basic request',
      url: `${BASE_URL}/api/members?limit=5`,
    },
    {
      name: 'With points data',
      url: `${BASE_URL}/api/members?limit=5&includePoints=true`,
    },
    {
      name: 'With filters',
      url: `${BASE_URL}/api/members?limit=5&profileComplete=true`,
    },
    {
      name: 'Pagination test',
      url: `${BASE_URL}/api/members?limit=2&offset=0`,
    },
  ];

  for (const test of tests) {
    console.log(`\n📋 Test: ${test.name}`);
    console.log(`URL: ${test.url}`);
    
    try {
      const response = await fetch(test.url, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(`❌ Failed (${response.status}):`, data);
        continue;
      }

      console.log(`✅ Success (${response.status})`);
      console.log(`   Members returned: ${data.data?.length || 0}`);
      console.log(`   Total count: ${data.pagination?.total || 0}`);
      console.log(`   Has more: ${data.pagination?.hasMore || false}`);
      
      if (data.data?.[0]) {
        const member = data.data[0];
        console.log(`   First member: ${member.name} (${member.username || 'no username'})`);
        if (member.points) {
          console.log(`   Points: ${member.points.total} total`);
        }
      }
    } catch (error) {
      console.log(`❌ Error:`, error.message);
    }
  }

  // Test invalid API key
  console.log('\n📋 Test: Invalid API key (should fail)');
  try {
    const response = await fetch(`${BASE_URL}/api/members?limit=1`, {
      headers: {
        'Authorization': 'Bearer invalid_key',
      },
    });

    if (response.status === 401) {
      console.log('✅ Correctly rejected invalid API key');
    } else {
      console.log('❌ Should have rejected invalid API key');
    }
  } catch (error) {
    console.log(`❌ Error:`, error.message);
  }

  // Test missing API key
  console.log('\n📋 Test: Missing API key (should fail)');
  try {
    const response = await fetch(`${BASE_URL}/api/members?limit=1`);

    if (response.status === 401) {
      console.log('✅ Correctly rejected missing API key');
    } else {
      console.log('❌ Should have rejected missing API key');
    }
  } catch (error) {
    console.log(`❌ Error:`, error.message);
  }

  console.log('\n' + '─'.repeat(50));
  console.log('✅ Testing complete!\n');
}

// Run tests
testMembersAPI().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
