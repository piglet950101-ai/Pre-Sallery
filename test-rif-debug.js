// Debug script for RIF validation function
// Run this in the browser console to test different scenarios

async function testRIFDebug() {
  
  
  const baseUrl = 'https://pwlfihzqpgixswmqyjvw.supabase.co/functions/v1';
  
  // Test 1: Test simple endpoint
  
  try {
    const testResponse = await fetch(`${baseUrl}/validate-rif-expiration/test`);
    const testData = await testResponse.json();
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
  }
  
  // Test 2: Test with minimal data
  
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
    
    
    
    const minimalData = await minimalResponse.json();
    
  } catch (error) {
    console.error('❌ Minimal data error:', error);
  }
  
  // Test 3: Test with file content
  
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
    
    
    
    const fileData = await fileResponse.json();
    
  } catch (error) {
    console.error('❌ File content error:', error);
  }
  
  // Test 4: Test with empty data
  
  try {
    const emptyResponse = await fetch(`${baseUrl}/validate-rif-expiration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    
    
    const emptyData = await emptyResponse.json();
    
  } catch (error) {
    console.error('❌ Empty data error:', error);
  }
  
  
}

// Run the debug test
testRIFDebug();
