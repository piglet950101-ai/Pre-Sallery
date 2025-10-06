// Test script for RIF validation function
// Run this in the browser console to test the function

async function testRIFFunction() {
  
  
  try {
    // Test 1: Simple test endpoint
    
    const testResponse = await fetch('https://pwlfihzqpgixswmqyjvw.supabase.co/functions/v1/validate-rif-expiration/test');
    const testData = await testResponse.json();
    
    
    if (testData.success) {
      
    } else {
      
    }
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
  }
  
  try {
    // Test 2: Test with minimal data
    
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
    
    if (minimalData.success) {
      
    } else {
      
    }
  } catch (error) {
    console.error('❌ Minimal data test error:', error);
  }
  
  try {
    // Test 3: Test with file content (empty)
    
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
    
    if (fileData.success) {
      
    } else {
      
    }
  } catch (error) {
    console.error('❌ File content test error:', error);
  }
  
  
}

// Run the test
testRIFFunction();
