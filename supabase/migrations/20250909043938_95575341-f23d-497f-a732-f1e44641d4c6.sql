-- Remove the potentially problematic view
DROP VIEW IF EXISTS public.safe_profiles;

-- The security definer function and RLS policies we created are sufficient
-- Let's verify the current security setup is working properly

-- Check that RLS is enabled
SELECT pg_class.relname, pg_class.relrowsecurity 
FROM pg_class 
WHERE relname = 'profiles';

-- Verify our security policies are in place
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';