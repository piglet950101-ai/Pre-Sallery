# Permission-Based Access Control System

This document explains how the permission-based access control system works in the AvancePay application to prevent users from accessing pages they don't have permission for.

## Overview

The system allows users to log in with any tab (Employee, Company, or Admin), but when they try to access a protected page, it checks their actual role from the database and shows a permission denied error if they don't have the required permissions.

## How It Works

### 1. User Registration
When users register, their role is stored in two places:
- **User Metadata**: Stored in `auth.users.raw_user_meta_data` or `auth.users.app_metadata`
- **User Roles Table**: Stored in `public.user_roles` table (more secure)

### 2. Login Process
When a user attempts to log in:

1. **Authentication**: User credentials are verified with Supabase Auth
2. **Role Assignment**: The system sets the role based on the selected login tab
3. **Success**: User is logged in and can navigate to any page

### 3. Page Access Control
When a user tries to access a protected page:

1. **Role Lookup**: System checks the user's actual role from the database
2. **Permission Check**: Compares actual role with required role for the page
3. **Access Decision**: 
   - If roles match: User can access the page
   - If roles don't match: Shows permission denied error message

## Error Messages

The system provides specific error messages for permission denied scenarios:

### English Messages
- **Employee Page Access**: "This page is only accessible to employees. You are currently logged in as a {userRole}."
- **Company Page Access**: "This page is only accessible to company representatives. You are currently logged in as a {userRole}."
- **Operator Page Access**: "This page is only accessible to platform operators. You are currently logged in as a {userRole}."
- **Generic Access Denied**: "You do not have permission to access this page."

### Spanish Messages
- **Employee Page Access**: "Esta página solo es accesible para empleados. Actualmente has iniciado sesión como {userRole}."
- **Company Page Access**: "Esta página solo es accesible para representantes de empresa. Actualmente has iniciado sesión como {userRole}."
- **Operator Page Access**: "Esta página solo es accesible para operadores de plataforma. Actualmente has iniciado sesión como {userRole}."
- **Generic Access Denied**: "No tienes permisos para acceder a esta página."

## Test Scenarios

### Valid Access Scenarios
- Employee logs in with any tab → Access /employee ✅
- Company representative logs in with any tab → Access /company ✅
- Operator logs in with any tab → Access /operator ✅

### Invalid Access Scenarios (Will Show Permission Denied Error)
- Employee tries to access /company ❌
- Employee tries to access /operator ❌
- Company representative tries to access /employee ❌
- Company representative tries to access /operator ❌
- Operator tries to access /employee ❌
- Operator tries to access /company ❌

### Cross-Login Scenarios (Should Work)
- Employee logs in with Company tab → Access /employee ✅ (actual role is employee)
- Company logs in with Admin tab → Access /company ✅ (actual role is company)
- Operator logs in with Employee tab → Access /operator ✅ (actual role is operator)

## Database Schema

### User Roles Table
```sql
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('employee', 'company', 'operator')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_unique UNIQUE (user_id)
);
```

### RLS Policies
The system includes Row Level Security (RLS) policies to ensure users can only see their own role information.

## Implementation Details

### Files Modified
1. **`src/contexts/LanguageContext.tsx`**: Added permission denied error message translations
2. **`src/contexts/AuthContext.tsx`**: Added `getActualUserRole()` function to get role from database
3. **`src/components/ProtectedRoute.tsx`**: Updated to check actual role and show permission denied instead of redirecting
4. **`src/components/PermissionDenied.tsx`**: New component to display permission denied error messages

### Key Functions
- `getActualUserRole()`: Gets user's actual role from database
- `ProtectedRoute`: Checks permissions and shows error message instead of redirecting
- `PermissionDenied`: Displays user-friendly error messages with logout option

## Security Benefits

1. **Prevents Unauthorized Access**: Users cannot access pages they don't have permission for
2. **Clear User Feedback**: Users get specific error messages explaining why they can't access a page
3. **Flexible Login**: Users can log in with any tab, but access is controlled by actual role
4. **Database-Driven Permissions**: Uses actual role from database, not just login tab selection
5. **User-Friendly Error Handling**: Shows helpful error messages instead of confusing redirects

## Testing

Use the provided `test-permission-system.sql` script to:
1. Create test users with different roles
2. Verify role assignments
3. Test various access scenarios
4. Test cross-login scenarios
5. Clean up test data

## Maintenance

To add new roles or modify existing ones:
1. Update the role check constraint in the `user_roles` table
2. Add new error messages to `LanguageContext.tsx`
3. Update the role validation logic in `Login.tsx`
4. Test thoroughly with all role combinations
