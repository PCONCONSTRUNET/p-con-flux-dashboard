SELECT cron.schedule(
  'check-expired-subscriptions',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://xrphlhlqksxnkldsypap.supabase.co/functions/v1/check-expirations',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycGhsaGxxa3N4bmtsZHN5cGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MDgyMDMsImV4cCI6MjA4OTM4NDIwM30.Sk9NfW0IFL9HKy4oo-sHEbLVFdOXIW_KmIXsIsE4hWo"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);