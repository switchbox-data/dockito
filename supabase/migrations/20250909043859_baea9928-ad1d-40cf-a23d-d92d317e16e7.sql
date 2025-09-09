-- Remove the security definer view that was flagged
DROP VIEW IF EXISTS public.safe_profiles;

-- Keep only the essential, secure RLS policies that we know work correctly
-- The current policies with the security definer function should be sufficient for data protection