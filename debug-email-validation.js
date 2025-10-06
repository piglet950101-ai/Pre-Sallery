// Debug script to test email validation
// Run this in browser console to test different email formats

function testEmailValidation(email) {
  
  
  // Clean email (same as in Register.tsx)
  const cleanEmail = email.trim().toLowerCase();
  
  
  // Check basic requirements
  const hasAt = cleanEmail.includes('@');
  const hasDot = cleanEmail.includes('.');
  
  
  if (!hasAt || !hasDot) {
    return false;
  }
  
  // Check structure
  const emailParts = cleanEmail.split('@');
  
  
  if (emailParts.length !== 2 || emailParts[0].length === 0 || !emailParts[1].includes('.')) {
    return false;
  }
  
  return true;
}

// Test common email formats
 
testEmailValidation("user@example.com");
testEmailValidation("user.name@example.com");
testEmailValidation("user+tag@example.co.uk");
testEmailValidation("user123@test.org");
testEmailValidation("test@subdomain.example.com");

// Test problematic formats
 
testEmailValidation("user@example"); // No domain extension
testEmailValidation("@example.com"); // No username
testEmailValidation("user@.com"); // No domain
testEmailValidation("user.example.com"); // No @
testEmailValidation(""); // Empty
testEmailValidation("   "); // Just spaces
