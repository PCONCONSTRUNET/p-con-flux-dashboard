
-- Allow authenticated users to read price settings (non-sensitive)
CREATE POLICY "Authenticated users can read price settings"
  ON public.platform_settings FOR SELECT
  TO authenticated
  USING (key IN ('mp_monthly_price', 'mp_annual_price', 'mp_public_key'));
