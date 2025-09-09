-- Drop all existing policies to start fresh with maximum security
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Deny public access to profiles" ON public.profiles;

-- Create a security definer function to check if user can access profile
CREATE OR REPLACE FUNCTION public.is_profile_owner(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only return true if the authenticated user ID matches the profile ID
  RETURN auth.uid() = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Ultra-secure policies using the security definer function
CREATE POLICY "Ultra secure profile read access" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.is_profile_owner(id));

CREATE POLICY "Ultra secure profile update access" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (public.is_profile_owner(id))
WITH CHECK (public.is_profile_owner(id));

CREATE POLICY "Ultra secure profile insert access" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_profile_owner(id));

-- Explicitly deny ALL access to non-authenticated users
CREATE POLICY "Block all anonymous access to profiles" 
ON public.profiles 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- Additional security: Create a view that masks sensitive data for any potential leaks
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
  id,
  CASE 
    WHEN auth.uid() = id THEN email 
    ELSE NULL 
  END as email,
  CASE 
    WHEN auth.uid() = id THEN full_name 
    ELSE 'Hidden' 
  END as full_name,
  created_at,
  updated_at
FROM public.profiles
WHERE auth.uid() = id;

-- Grant access to the safe view
GRANT SELECT ON public.safe_profiles TO authenticated;