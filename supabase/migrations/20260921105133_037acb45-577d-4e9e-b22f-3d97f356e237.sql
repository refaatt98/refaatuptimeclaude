CREATE POLICY "No public access to app keys"
ON public.app_keys
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "No public access to account tokens"
ON public.supabase_accounts
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);