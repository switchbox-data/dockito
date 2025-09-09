-- Enable real-time for the favorites table
ALTER TABLE public.favorites REPLICA IDENTITY FULL;

-- Add the favorites table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites;