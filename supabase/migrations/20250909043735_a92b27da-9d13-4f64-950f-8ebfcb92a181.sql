-- Drop existing policies that might have security issues
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create more secure policies that explicitly require authentication

-- Policy for viewing own profile - requires authentication and proper user ID match
CREATE POLICY "Authenticated users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Policy for updating own profile - requires authentication and proper user ID match
CREATE POLICY "Authenticated users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for inserting own profile - requires authentication and proper user ID match
CREATE POLICY "Authenticated users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Explicitly deny all access to anonymous/public users
CREATE POLICY "Deny public access to profiles" 
ON public.profiles 
FOR ALL 
TO anon
USING (false);

-- Create a security definer function for safe profile access
CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid UUID)
RETURNS SETOF public.profiles AS $$
BEGIN
  -- Only return profile if the requesting user is the profile owner
  IF auth.uid() = user_uuid THEN
    RETURN QUERY SELECT * FROM public.profiles WHERE id = user_uuid;
  ELSE
    -- Return empty result for unauthorized access
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;