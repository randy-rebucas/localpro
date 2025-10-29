// Simple test script to verify the supplies API works
const testSuppliesAPI = async () => {
  try {
    console.log('Testing supplies API...');
    
    const response = await fetch('http://localhost:3000/api/supplies-simple?page=1&limit=3');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('API Response:');
    console.log('- Success:', data.success);
    console.log('- Data count:', data.data?.length || 0);
    console.log('- Pagination:', data.pagination);
    
    if (data.data && data.data.length > 0) {
      console.log('- First supply:', data.data[0].name);
    }
    
    console.log('✅ API test passed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
};

// Run the test
testSuppliesAPI();
