-- Browser-only dashboard: the app runs as a static site with no server layer,
-- so the public (anon) role performs all dashboard reads and writes.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supabase_accounts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monitored_projects TO anon, authenticated;
GRANT SELECT, INSERT ON public.status_logs TO anon, authenticated;
GRANT SELECT, INSERT ON public.status_changes TO anon, authenticated;
GRANT SELECT, INSERT ON public.app_keys TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.dashboard_settings TO anon, authenticated;

DROP POLICY IF EXISTS "No public access to account tokens" ON public.supabase_accounts;
CREATE POLICY "Dashboard manages accounts" ON public.supabase_accounts
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "No public access to app keys" ON public.app_keys;
CREATE POLICY "Dashboard reads app keys" ON public.app_keys
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Dashboard creates app keys" ON public.app_keys
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Dashboard creates monitored projects" ON public.monitored_projects
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Dashboard updates monitored projects" ON public.monitored_projects
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Dashboard records status logs" ON public.status_logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Dashboard records status changes" ON public.status_changes
  FOR INSERT TO anon, authenticated WITH CHECK (true);