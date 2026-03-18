
-- Table to store all signals (live + archived)
CREATE TABLE public.signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL DEFAULT 'Auto',
  entry TEXT NOT NULL,
  protection TEXT NOT NULL DEFAULT '1 Gale',
  result TEXT NOT NULL CHECK (result IN ('green', 'loss', 'pending')),
  rounds INTEGER NOT NULL DEFAULT 0,
  target TEXT NOT NULL DEFAULT 'Double',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived BOOLEAN NOT NULL DEFAULT false
);

-- Table to store daily aggregated stats
CREATE TABLE public.daily_signal_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  total_signals INTEGER NOT NULL DEFAULT 0,
  greens INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  win_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_signal_stats ENABLE ROW LEVEL SECURITY;

-- Signals: all authenticated users can read
CREATE POLICY "Authenticated users can read signals"
  ON public.signals FOR SELECT TO authenticated
  USING (true);

-- Daily stats: all authenticated users can read
CREATE POLICY "Authenticated users can read daily stats"
  ON public.daily_signal_stats FOR SELECT TO authenticated
  USING (true);

-- Service role can manage (for edge function)
CREATE POLICY "Service role can manage signals"
  ON public.signals FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage daily stats"
  ON public.daily_signal_stats FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Enable extensions for cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
