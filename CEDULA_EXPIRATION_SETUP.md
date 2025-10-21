# Cedula Expiration Date Setup

## Problem
The `cedula_expiration_date` column doesn't exist in the `employees` table, causing a 400 error when trying to save extracted expiration dates.

## Solution

### Step 1: Run Database Migration

**Option A: Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the following SQL:

```sql
-- Add cedula_expiration_date column to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS cedula_expiration_date TIMESTAMPTZ;

-- Add comment to the column
COMMENT ON COLUMN public.employees.cedula_expiration_date IS 'Expiration date of the cedula document extracted via OCR';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name = 'cedula_expiration_date';
```

**Option B: Use the provided SQL file**
- Run the SQL from `add-cedula-expiration-column.sql`

### Step 2: Enable Expiration Date Saving

After running the migration, uncomment the expiration date saving code in `src/components/KYCUpload.tsx`:

```typescript
// Change this:
// updateData.cedula_expiration_date = frontDoc.extractedData.expiration_date;

// To this:
updateData.cedula_expiration_date = frontDoc.extractedData.expiration_date;
```

### Step 3: Test the Feature

1. Upload a cedula image
2. Verify OCR extraction works
3. Check that expiration date is saved to database
4. Verify expiration validation works

## Current Status

- ✅ OCR extraction working
- ✅ Expiration validation working  
- ✅ Cedula number saving working
- ⏳ Expiration date saving (pending migration)

## Files Modified

- `src/components/KYCUpload.tsx` - Added expiration validation and database saving
- `database/migrations/019_add_cedula_expiration_date.sql` - Database migration
- `add-cedula-expiration-column.sql` - Manual migration script
