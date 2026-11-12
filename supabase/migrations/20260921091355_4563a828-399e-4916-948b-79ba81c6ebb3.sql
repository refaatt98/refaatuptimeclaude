CREATE TABLE public.monitored_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_ref TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  organization_name TEXT,
  organization_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.status_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.monitored_projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  response_time_ms INTEGER
);

CREATE TABLE public.status_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.monitored_projects(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_status_logs_project_checked ON public.status_logs(project_id, checked_at DESC);
CREATE INDEX idx_status_changes_changed_at ON public.status_changes(changed_at DESC);

GRANT SELECT ON public.monitored_projects TO anon, authenticated;
GRANT SELECT ON public.status_logs TO anon, authenticated;
GRANT SELECT ON public.status_changes TO anon, authenticated;
GRANT ALL ON public.monitored_projects TO service_role;
GRANT ALL ON public.status_logs TO service_role;
GRANT ALL ON public.status_changes TO service_role;

ALTER TABLE public.monitored_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view monitored projects" ON public.monitored_projects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can view status logs" ON public.status_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can view status changes" ON public.status_changes FOR SELECT TO anon, authenticated USING (true);