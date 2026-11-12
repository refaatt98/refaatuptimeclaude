CREATE TABLE public.dashboard_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.dashboard_settings TO anon, authenticated;
GRANT ALL ON public.dashboard_settings TO service_role;

ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view dashboard settings"
ON public.dashboard_settings
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public can create dashboard settings"
ON public.dashboard_settings
FOR INSERT
TO anon, authenticated
WITH CHECK (key IN ('title', 'subtitle'));

CREATE POLICY "Public can update dashboard settings"
ON public.dashboard_settings
FOR UPDATE
TO anon, authenticated
USING (key IN ('title', 'subtitle'))
WITH CHECK (key IN ('title', 'subtitle'));

CREATE OR REPLACE FUNCTION public.set_dashboard_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER dashboard_settings_updated_at
BEFORE UPDATE ON public.dashboard_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_dashboard_settings_updated_at();

INSERT INTO public.dashboard_settings (key, value)
VALUES
  ('title', 'Status overview'),
  ('subtitle', 'Live monitoring across every connected Supabase organization.');