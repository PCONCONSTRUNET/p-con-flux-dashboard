
-- Allow authenticated users to insert signals
CREATE POLICY "Authenticated users can insert signals"
  ON public.signals FOR INSERT TO authenticated
  WITH CHECK (true);
