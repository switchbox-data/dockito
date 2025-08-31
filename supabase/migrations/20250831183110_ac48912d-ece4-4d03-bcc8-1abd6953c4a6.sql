-- Ensure public read access for browsing app (no auth yet)
-- Dockets
ALTER TABLE public.dockets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dockets' AND polname = 'Public can read dockets'
  ) THEN
    CREATE POLICY "Public can read dockets" ON public.dockets FOR SELECT USING (true);
  END IF;
END $$;

-- Fillings
ALTER TABLE public.fillings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fillings' AND polname = 'Public can read fillings'
  ) THEN
    CREATE POLICY "Public can read fillings" ON public.fillings FOR SELECT USING (true);
  END IF;
END $$;

-- Attachments
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attachments' AND polname = 'Public can read attachments'
  ) THEN
    CREATE POLICY "Public can read attachments" ON public.attachments FOR SELECT USING (true);
  END IF;
END $$;

-- Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organizations' AND polname = 'Public can read organizations'
  ) THEN
    CREATE POLICY "Public can read organizations" ON public.organizations FOR SELECT USING (true);
  END IF;
END $$;

-- Docket petitioners relation (if used later)
ALTER TABLE public.docket_petitioned_by_org ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'docket_petitioned_by_org' AND polname = 'Public can read docket_petitioned_by_org'
  ) THEN
    CREATE POLICY "Public can read docket_petitioned_by_org" ON public.docket_petitioned_by_org FOR SELECT USING (true);
  END IF;
END $$;

-- Filings organization relations
ALTER TABLE public.fillings_filed_by_org_relation ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fillings_filed_by_org_relation' AND polname = 'Public can read fillings_filed_by_org_relation'
  ) THEN
    CREATE POLICY "Public can read fillings_filed_by_org_relation" ON public.fillings_filed_by_org_relation FOR SELECT USING (true);
  END IF;
END $$;

ALTER TABLE public.fillings_on_behalf_of_org_relation ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fillings_on_behalf_of_org_relation' AND polname = 'Public can read fillings_on_behalf_of_org_relation'
  ) THEN
    CREATE POLICY "Public can read fillings_on_behalf_of_org_relation" ON public.fillings_on_behalf_of_org_relation FOR SELECT USING (true);
  END IF;
END $$;