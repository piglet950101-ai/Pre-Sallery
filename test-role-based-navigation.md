# Role-Based Navigation Test Guide

This guide demonstrates how the new role-based navigation system works across different user types and pages.

## Overview

The new Header component automatically adapts based on:
- **Authentication Status**: Logged in vs. not logged in
- **User Role**: Employee, Company, or Operator
- **Page Type**: Public pages vs. dashboard pages

## Test Scenarios

### 1. Not Logged In (Public Navigation)

**Pages to Test:**
- Landing page (`/`)
- FAQ page (`/faq`)
- About page (`/about`)
- Contact page (`/contact`)

**Expected Header:**
- ✅ **Logo**: AvancePay with Venezuela badge
- ✅ **Navigation Links**: Features, How It Works, Pricing, Testimonials (on landing page only)
- ✅ **Right Side**: Language Switcher, Login Button, Get Started Button
- ✅ **No User Menu**: No dropdown menu since user is not logged in

### 2. Employee Logged In

**Pages to Test:**
- Employee Dashboard (`/employee`)
- Request Advance page (`/employee/request-advance`)

**Expected Header:**
- ✅ **Logo**: AvancePay with Venezuela badge (clickable, goes to home page)
- ✅ **Navigation Links**: Features, How It Works, Pricing, Testimonials, Operator Panel, Request Advance
- ✅ **Right Side**: Language Switcher, User Menu
- ✅ **User Menu**: 
  - Username button with role icon
  - Dropdown shows: Username, Email, Role, Logout button

### 3. Company Representative Logged In

**Pages to Test:**
- Company Dashboard (`/company`)
- Company Configuration (`/company/configuration`)

**Expected Header:**
- ✅ **Logo**: AvancePay with Venezuela badge (clickable, goes to home page)
- ✅ **Navigation Links**: Features, How It Works, Pricing, Testimonials, Operator Panel, Configuration
- ✅ **Right Side**: Language Switcher, User Menu
- ✅ **User Menu**: 
  - Username button with role icon
  - Dropdown shows: Username, Email, Role, Logout button

### 4. Operator Logged In

**Pages to Test:**
- Operator Dashboard (`/operator`)

**Expected Header:**
- ✅ **Logo**: AvancePay with Venezuela badge (clickable, goes to home page)
- ✅ **Navigation Links**: Features, How It Works, Pricing, Testimonials, Operator Panel
- ✅ **Right Side**: Language Switcher, User Menu
- ✅ **User Menu**: 
  - Username button with role icon
  - Dropdown shows: Username, Email, Role, Logout button

## Key Features to Test

### 1. Role Detection
- **Database Priority**: System checks `user_roles` table first
- **Metadata Fallback**: Falls back to user metadata if table lookup fails
- **Real-time Updates**: Role changes are reflected immediately

### 2. Navigation Behavior
- **Role-Specific Links**: Only shows relevant navigation for each role
- **Dashboard Access**: Logo always links to appropriate dashboard
- **Logout Functionality**: Properly signs out and redirects to home

### 3. Visual Design
- **Consistent Styling**: Same design language across all pages
- **Role Icons**: Different icons for each role (User, Building, Shield)
- **Responsive Design**: Works on mobile and desktop
- **Loading States**: Shows loading while checking user role

### 4. Language Support
- **Bilingual Navigation**: All text in English and Spanish
- **Language Switcher**: Available on all pages
- **Consistent Translations**: Same terms used across all components

## Cross-Role Testing

### Test Case 1: Role Mismatch
1. Log in as Employee
2. Try to access Company dashboard (`/company`)
3. **Expected**: Permission denied error page (not navigation change)

### Test Case 2: Cross-Login
1. Log in as Employee using Company tab
2. Access Employee dashboard (`/employee`)
3. **Expected**: Should work (actual role is employee)

### Test Case 3: Logout
1. Log in as any role
2. Click logout in user menu
3. **Expected**: Redirected to landing page with public navigation

## Mobile Testing

### Responsive Behavior
- **Mobile Menu**: User menu should be accessible on mobile
- **Navigation Links**: Should be hidden on small screens
- **Touch Targets**: Buttons should be appropriately sized
- **Language Switcher**: Should work on mobile

## Error Handling

### Loading States
- **Initial Load**: Shows loading while checking authentication
- **Role Check**: Shows loading while fetching user role
- **Error States**: Gracefully handles role fetch errors

### Edge Cases
- **No Role Found**: Falls back to generic dashboard
- **Network Errors**: Handles Supabase connection issues
- **Invalid Sessions**: Redirects to login when session expires

## Performance Testing

### Load Times
- **Header Rendering**: Should be fast and not block page load
- **Role Fetching**: Should be cached to avoid repeated requests
- **Navigation**: Should be instant between pages

### Memory Usage
- **Component Reuse**: Same Header component used across all pages
- **State Management**: Efficient role state management
- **Cleanup**: Proper cleanup on component unmount

## Accessibility Testing

### Keyboard Navigation
- **Tab Order**: Logical tab order through navigation
- **Focus Management**: Proper focus handling
- **Screen Reader**: Proper ARIA labels and descriptions

### Visual Accessibility
- **Color Contrast**: Sufficient contrast for all text
- **Icon Labels**: Icons have proper labels
- **Size**: Touch targets are appropriately sized

## Browser Compatibility

### Tested Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Features to Verify
- **CSS Grid/Flexbox**: Layout works correctly
- **JavaScript**: All functionality works
- **Local Storage**: Language preferences persist
- **Session Management**: Authentication state persists

## Test Checklist

### Basic Functionality
- [ ] Public navigation shows on non-authenticated pages
- [ ] Role-based navigation shows on authenticated pages
- [ ] User menu displays correct role information
- [ ] Logout functionality works correctly
- [ ] Language switching works on all pages

### Role-Specific Features
- [ ] Employee navigation shows Request Advance link
- [ ] Company navigation shows Configuration link
- [ ] Operator navigation shows only Dashboard
- [ ] Role icons display correctly
- [ ] Role badges show correct text

### Cross-Page Consistency
- [ ] Header looks identical across all pages
- [ ] Navigation behavior is consistent
- [ ] User menu works the same everywhere
- [ ] Logo links to appropriate dashboard

### Error Handling
- [ ] Loading states display correctly
- [ ] Error states are handled gracefully
- [ ] Network issues don't break navigation
- [ ] Invalid sessions redirect properly

### Mobile Responsiveness
- [ ] Header works on mobile devices
- [ ] User menu is accessible on mobile
- [ ] Navigation is appropriately hidden on small screens
- [ ] Touch targets are appropriately sized
