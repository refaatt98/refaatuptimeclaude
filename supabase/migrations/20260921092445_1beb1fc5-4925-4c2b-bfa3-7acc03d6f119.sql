-- lovable-cron-fallback-reviewed: user explicitly requested 5-minute background status logging; cadence confirmed with run count
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'refaat-uptime-check',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--66c4a934-ffa9-44b0-85b8-93a4166a9454-dev.lovable.app/api/public/check-statuses',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'a0e592d62472b4d4ffdebc1a536a848bb9d8b5e249ec1c91'
    ),
    body := '{}'::jsonb
  );
  $$
);