-- Create change_requests table
CREATE TABLE IF NOT EXISTS change_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    current_value TEXT,
    requested_value TEXT,
    reason TEXT NOT NULL,
    details TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewer_notes TEXT,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    category VARCHAR(50) DEFAULT 'profile' CHECK (category IN ('profile', 'financial', 'personal', 'work', 'contact')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_change_requests_employee_id ON change_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);
CREATE INDEX IF NOT EXISTS idx_change_requests_created_at ON change_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_change_requests_category ON change_requests(category);
CREATE INDEX IF NOT EXISTS idx_change_requests_priority ON change_requests(priority);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_change_requests_updated_at 
    BEFORE UPDATE ON change_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Employees can only see their own change requests
CREATE POLICY "Employees can view own change requests" ON change_requests
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM employees WHERE auth_user_id = auth.uid()
        )
    );

-- Employees can insert their own change requests
CREATE POLICY "Employees can create own change requests" ON change_requests
    FOR INSERT WITH CHECK (
        employee_id IN (
            SELECT id FROM employees WHERE auth_user_id = auth.uid()
        )
    );

-- Company admins can view all change requests for their employees
CREATE POLICY "Company admins can view employee change requests" ON change_requests
    FOR SELECT USING (
        employee_id IN (
            SELECT e.id FROM employees e
            JOIN companies c ON e.company_id = c.id
            WHERE c.auth_user_id = auth.uid()
        )
    );

-- Company admins can update change requests
CREATE POLICY "Company admins can update change requests" ON change_requests
    FOR UPDATE USING (
        employee_id IN (
            SELECT e.id FROM employees e
            JOIN companies c ON e.company_id = c.id
            WHERE c.auth_user_id = auth.uid()
        )
    );
