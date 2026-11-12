ALTER TABLE public.monitored_projects
ADD COLUMN IF NOT EXISTS is_ignored boolean NOT NULL DEFAULT false;