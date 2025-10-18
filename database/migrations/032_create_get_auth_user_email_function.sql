-- Create RPC function to get auth user email
-- This function allows fetching email from auth.users table

CREATE OR REPLACE FUNCTION get_auth_user_email(user_id UUID)
RETURNS TABLE(email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user exists in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RETURN QUERY
    SELECT au.email::TEXT
    FROM auth.users au
    WHERE au.id = user_id;
  ELSE
    -- Return empty result if user not found
    RETURN;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_auth_user_email(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_auth_user_email(UUID) IS 'Returns the email address for a given auth user ID';
