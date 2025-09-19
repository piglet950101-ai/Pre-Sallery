---
description: Repository Information Overview
alwaysApply: true
---

# Pre-Sallery Project Information

## Summary
Pre-Sallery is a web application for managing salary advances with multiple user roles (employee, company, operator). Built with React, TypeScript, and Supabase, it provides a complete platform for advance requests, approvals, and financial management.

## Structure
- **src/**: React application source code (components, pages, contexts)
- **supabase/**: Edge functions for backend operations
- **SQL files**: Database setup and management scripts

## Language & Runtime
**Language**: TypeScript/JavaScript
**Version**: ES2020 target
**Build System**: Vite
**Package Manager**: npm/bun

## Dependencies
**Main Dependencies**:
- React 18.3.1 with React Router 6.30.1
- Supabase JS Client 2.57.4
- TanStack React Query 5.83.0
- Radix UI components
- Tailwind CSS
- Zod for validation

## Build & Installation
```bash
npm install
npm run dev  # Development
npm run build  # Production
```

## Backend Services
**Supabase**: Authentication, PostgreSQL database, Edge Functions, Storage
**Database**: Role-based access control with Row Level Security (RLS)

## Application Features
**User Roles**: Employee, Company, Operator
**Key Functionality**: Advance requests, document management, multi-language support