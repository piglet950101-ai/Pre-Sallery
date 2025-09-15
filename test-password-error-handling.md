# Password Error Handling Test Guide

This guide demonstrates how the login system handles incorrect password scenarios and other common login errors.

## Test Scenarios

### 1. Incorrect Password Test

**Steps:**
1. Go to the login page
2. Enter a valid email address (one that exists in your system)
3. Enter an incorrect password
4. Click "Sign In"

**Expected Result:**
- A red error notification appears
- Title: "Incorrect Password" (English) / "Contraseña Incorrecta" (Spanish)
- Message: "The password you entered is incorrect. Please try again." (English) / "La contraseña que ingresaste es incorrecta. Por favor intenta de nuevo." (Spanish)

### 2. User Not Found Test

**Steps:**
1. Go to the login page
2. Enter an email address that doesn't exist in the system
3. Enter any password
4. Click "Sign In"

**Expected Result:**
- A red error notification appears
- Title: "User Not Found" (English) / "Usuario No Encontrado" (Spanish)
- Message: "No account found with this email address. Please check your email or create a new account." (English) / "No se encontró una cuenta con esta dirección de correo. Por favor verifica tu correo o crea una nueva cuenta." (Spanish)

### 3. Too Many Attempts Test

**Steps:**
1. Go to the login page
2. Enter a valid email address
3. Enter incorrect passwords multiple times (5-10 times)
4. Click "Sign In" repeatedly

**Expected Result:**
- After multiple failed attempts, a red error notification appears
- Title: "Too Many Attempts" (English) / "Demasiados Intentos" (Spanish)
- Message: "Too many login attempts. Please wait a few minutes before trying again." (English) / "Demasiados intentos de inicio de sesión. Por favor espera unos minutos antes de intentar de nuevo." (Spanish)

### 4. Valid Login Test

**Steps:**
1. Go to the login page
2. Enter a valid email address
3. Enter the correct password
4. Click "Sign In"

**Expected Result:**
- A green success notification appears
- User is redirected to the appropriate dashboard based on their role
- Title: "Login Successful" (English) / "Inicio de sesión exitoso" (Spanish)

## Error Message Features

### Visual Design
- **Color**: Red background for error notifications
- **Icon**: Warning/error icon
- **Position**: Top-right corner of the screen
- **Duration**: Auto-dismisses after a few seconds

### Bilingual Support
- **English**: Clear, professional error messages
- **Spanish**: Accurate translations that maintain the same meaning
- **Language Switching**: Messages change based on selected language

### User Experience
- **Specific Messages**: Different messages for different error types
- **Actionable Guidance**: Messages tell users what to do next
- **Non-Intrusive**: Notifications don't block the interface
- **Consistent**: Same error handling across all login tabs (Employee, Company, Admin)

## Technical Implementation

### Error Detection
The system detects different error types by checking:
- Error message content
- HTTP status codes
- Supabase-specific error patterns

### Error Types Handled
1. **Invalid Credentials**: Wrong password for existing user
2. **User Not Found**: Email doesn't exist in system
3. **Rate Limiting**: Too many failed attempts
4. **Generic Errors**: Any other login errors

### Code Structure
- **Language Context**: Error messages stored in `LanguageContext.tsx`
- **Login Component**: Error handling logic in `Login.tsx`
- **Toast Notifications**: User feedback via `useToast` hook

## Testing Checklist

- [ ] Incorrect password shows specific error message
- [ ] Non-existent email shows user not found message
- [ ] Multiple failed attempts show rate limiting message
- [ ] Valid login shows success message
- [ ] Error messages appear in both English and Spanish
- [ ] Error notifications are visually distinct (red color)
- [ ] Error messages are user-friendly and actionable
- [ ] Error handling works for all three login tabs (Employee, Company, Admin)
