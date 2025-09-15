// Debug script to test email validation
// Run this in browser console to test different email formats

function testEmailValidation(email) {
  console.log("Testing email:", email);
  
  // Clean email (same as in Register.tsx)
  const cleanEmail = email.trim().toLowerCase();
  console.log("Cleaned email:", cleanEmail);
  
  // Check basic requirements
  const hasAt = cleanEmail.includes('@');
  const hasDot = cleanEmail.includes('.');
  console.log("Has @:", hasAt);
  console.log("Has .:", hasDot);
  
  if (!hasAt || !hasDot) {
    console.log("❌ FAILED: Missing @ or .");
    return false;
  }
  
  // Check structure
  const emailParts = cleanEmail.split('@');
  console.log("Email parts:", emailParts);
  console.log("Parts length:", emailParts.length);
  console.log("Before @ length:", emailParts[0]?.length || 0);
  console.log("After @ has dot:", emailParts[1]?.includes('.') || false);
  
  if (emailParts.length !== 2 || emailParts[0].length === 0 || !emailParts[1].includes('.')) {
    console.log("❌ FAILED: Invalid structure");
    return false;
  }
  
  console.log("✅ PASSED: Email is valid");
  return true;
}

// Test common email formats
console.log("=== Testing Common Email Formats ===");
testEmailValidation("user@example.com");
testEmailValidation("user.name@example.com");
testEmailValidation("user+tag@example.co.uk");
testEmailValidation("user123@test.org");
testEmailValidation("test@subdomain.example.com");

// Test problematic formats
console.log("\n=== Testing Problematic Formats ===");
testEmailValidation("user@example"); // No domain extension
testEmailValidation("@example.com"); // No username
testEmailValidation("user@.com"); // No domain
testEmailValidation("user.example.com"); // No @
testEmailValidation(""); // Empty
testEmailValidation("   "); // Just spaces
