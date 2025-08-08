-- Enable RLS (idempotent: will not error if already enabled)
ALTER TABLE public.dockets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fillings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Allow public (anon) read-only access for browsing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dockets' AND policyname = 'Public read dockets'
  ) THEN
    CREATE POLICY "Public read dockets"
    ON public.dockets
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fillings' AND policyname = 'Public read fillings'
  ) THEN
    CREATE POLICY "Public read fillings"
    ON public.fillings
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attachments' AND policyname = 'Public read attachments'
  ) THEN
    CREATE POLICY "Public read attachments"
    ON public.attachments
    FOR SELECT
    USING (true);
  END IF;
END $$;