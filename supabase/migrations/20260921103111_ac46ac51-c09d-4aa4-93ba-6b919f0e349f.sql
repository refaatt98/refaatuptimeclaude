CREATE TABLE IF NOT EXISTS public.app_keys (
  name text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_keys TO service_role;
ALTER TABLE public.app_keys ENABLE ROW LEVEL SECURITY;