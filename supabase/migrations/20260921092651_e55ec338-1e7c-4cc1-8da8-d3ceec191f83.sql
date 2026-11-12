CREATE TABLE public.supabase_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  organization_names TEXT,
  token_ciphertext TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMPTZ
);

GRANT ALL ON public.supabase_accounts TO service_role;

ALTER TABLE public.supabase_accounts ENABLE ROW LEVEL SECURITY;