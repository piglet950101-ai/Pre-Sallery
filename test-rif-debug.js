// Debug script for RIF validation function
// Run this in the browser console to test different scenarios

async function testRIFDebug() {
  console.log('=== RIF DEBUG TESTING ===');
  
  const baseUrl = 'https://pwlfihzqpgixswmqyjvw.supabase.co/functions/v1';
  
  // Test 1: Test simple endpoint
  console.log('Test 1: Testing simple endpoint...');
  try {
    const testResponse = await fetch(`${baseUrl}/validate-rif-expiration/test`);
    const testData = await testResponse.json();
    console.log('✅ Test endpoint response:', testData);
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
  }
  
  // Test 2: Test with minimal data
  console.log('Test 2: Testing with minimal data...');
  try {
    const minimalResponse = await fetch(`${baseUrl}/validate-rif-expiration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        document_text: 'FECHA DE VENCIMIENTO: 31/12/2025'
      })
    });
    
    console.log('Response status:', minimalResponse.status);
    console.log('Response headers:', Object.fromEntries(minimalResponse.headers.entries()));
    
    const minimalData = await minimalResponse.json();
    console.log('✅ Minimal data response:', minimalData);
  } catch (error) {
    console.error('❌ Minimal data error:', error);
  }
  
  // Test 3: Test with file content
  console.log('Test 3: Testing with file content...');
  try {
    const fileResponse = await fetch(`${baseUrl}/validate-rif-expiration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_content: 'test-content',
        file_type: 'application/pdf'
      })
    });
    
    console.log('Response status:', fileResponse.status);
    console.log('Response headers:', Object.fromEntries(fileResponse.headers.entries()));
    
    const fileData = await fileResponse.json();
    console.log('✅ File content response:', fileData);
  } catch (error) {
    console.error('❌ File content error:', error);
  }
  
  // Test 4: Test with empty data
  console.log('Test 4: Testing with empty data...');
  try {
    const emptyResponse = await fetch(`${baseUrl}/validate-rif-expiration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    console.log('Response status:', emptyResponse.status);
    console.log('Response headers:', Object.fromEntries(emptyResponse.headers.entries()));
    
    const emptyData = await emptyResponse.json();
    console.log('✅ Empty data response:', emptyData);
  } catch (error) {
    console.error('❌ Empty data error:', error);
  }
  
  console.log('=== DEBUG TESTING COMPLETED ===');
}

// Run the debug test
testRIFDebug();
