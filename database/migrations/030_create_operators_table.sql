-- Create operators table for admin/operator users
CREATE TABLE IF NOT EXISTS public.operators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

-- Create policies for operators table
-- Allow operators to view all operators
CREATE POLICY "Operators: can view all" ON public.operators
    FOR SELECT USING (true);

-- Allow operators to insert new operators
CREATE POLICY "Operators: can insert" ON public.operators
    FOR INSERT WITH CHECK (true);

-- Allow operators to update operators
CREATE POLICY "Operators: can update" ON public.operators
    FOR UPDATE USING (true);

-- Allow operators to delete operators
CREATE POLICY "Operators: can delete" ON public.operators
    FOR DELETE USING (true);

-- Create index for faster lookups
CREATE INDEX idx_operators_auth_user_id ON public.operators(auth_user_id);
CREATE INDEX idx_operators_email ON public.operators(email);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_operators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_operators_updated_at
    BEFORE UPDATE ON public.operators
    FOR EACH ROW
    EXECUTE FUNCTION update_operators_updated_at();
