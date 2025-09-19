-- Create verification_codes table
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'phone', 'password_reset', 'profile_change')),
    contact_info VARCHAR(255) NOT NULL, -- email or phone number
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_employee_id ON verification_codes(employee_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_type ON verification_codes(type);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_contact_info ON verification_codes(contact_info);

-- Enable Row Level Security
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own verification codes
CREATE POLICY "Users can view own verification codes" ON verification_codes
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own verification codes
CREATE POLICY "Users can create own verification codes" ON verification_codes
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own verification codes (for attempts, usage)
CREATE POLICY "Users can update own verification codes" ON verification_codes
    FOR UPDATE USING (user_id = auth.uid());

-- Create function to clean up expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM verification_codes 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create function to generate verification code
CREATE OR REPLACE FUNCTION generate_verification_code(
    p_user_id UUID,
    p_employee_id UUID,
    p_type VARCHAR(20),
    p_contact_info VARCHAR(255),
    p_expiry_minutes INTEGER DEFAULT 15
)
RETURNS VARCHAR(10) AS $$
DECLARE
    v_code VARCHAR(10);
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate 6-digit code
    v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    v_expires_at := NOW() + (p_expiry_minutes || ' minutes')::INTERVAL;
    
    -- Clean up old codes for this user and type
    DELETE FROM verification_codes 
    WHERE user_id = p_user_id 
    AND type = p_type 
    AND expires_at < NOW();
    
    -- Insert new code
    INSERT INTO verification_codes (
        user_id,
        employee_id,
        code,
        type,
        contact_info,
        expires_at
    ) VALUES (
        p_user_id,
        p_employee_id,
        v_code,
        p_type,
        p_contact_info,
        v_expires_at
    );
    
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Create function to verify code
CREATE OR REPLACE FUNCTION verify_code(
    p_user_id UUID,
    p_code VARCHAR(10),
    p_type VARCHAR(20)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_record RECORD;
BEGIN
    -- Find the verification code
    SELECT * INTO v_record
    FROM verification_codes
    WHERE user_id = p_user_id
    AND code = p_code
    AND type = p_type
    AND expires_at > NOW()
    AND used_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Check if code exists and is valid
    IF NOT FOUND THEN
        -- Increment attempts for any existing codes
        UPDATE verification_codes 
        SET attempts = attempts + 1
        WHERE user_id = p_user_id
        AND type = p_type
        AND expires_at > NOW()
        AND used_at IS NULL;
        
        RETURN FALSE;
    END IF;
    
    -- Check if max attempts exceeded
    IF v_record.attempts >= v_record.max_attempts THEN
        RETURN FALSE;
    END IF;
    
    -- Mark code as used
    UPDATE verification_codes
    SET used_at = NOW()
    WHERE id = v_record.id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
