// Test script for RIF validation function
// Run this in the browser console to test the function

async function testRIFFunction() {
  console.log('=== TESTING RIF VALIDATION FUNCTION ===');
  
  try {
    // Test 1: Simple test endpoint
    console.log('Test 1: Testing simple endpoint...');
    const testResponse = await fetch('https://pwlfihzqpgixswmqyjvw.supabase.co/functions/v1/validate-rif-expiration/test');
    const testData = await testResponse.json();
    console.log('Test endpoint response:', testData);
    
    if (testData.success) {
      console.log('✅ Test endpoint working');
    } else {
      console.log('❌ Test endpoint failed');
    }
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
  }
  
  try {
    // Test 2: Test with minimal data
    console.log('Test 2: Testing with minimal data...');
    const minimalResponse = await fetch('https://pwlfihzqpgixswmqyjvw.supabase.co/functions/v1/validate-rif-expiration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (localStorage.getItem('supabase.auth.token') || 'your-token-here')
      },
      body: JSON.stringify({
        document_text: 'FECHA DE VENCIMIENTO: 31/12/2025'
      })
    });
    
    const minimalData = await minimalResponse.json();
    console.log('Minimal data response:', minimalData);
    
    if (minimalData.success) {
      console.log('✅ Minimal data test working');
    } else {
      console.log('❌ Minimal data test failed:', minimalData.message);
    }
  } catch (error) {
    console.error('❌ Minimal data test error:', error);
  }
  
  try {
    // Test 3: Test with file content (empty)
    console.log('Test 3: Testing with empty file content...');
    const fileResponse = await fetch('https://pwlfihzqpgixswmqyjvw.supabase.co/functions/v1/validate-rif-expiration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (localStorage.getItem('supabase.auth.token') || 'your-token-here')
      },
      body: JSON.stringify({
        file_content: '',
        file_type: 'application/pdf'
      })
    });
    
    const fileData = await fileResponse.json();
    console.log('File content response:', fileData);
    
    if (fileData.success) {
      console.log('✅ File content test working');
    } else {
      console.log('❌ File content test failed:', fileData.message);
    }
  } catch (error) {
    console.error('❌ File content test error:', error);
  }
  
  console.log('=== TEST COMPLETED ===');
}

// Run the test
testRIFFunction();
