
-- Create patterns table for admin pattern management
CREATE TABLE public.patterns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  mode text NOT NULL DEFAULT 'when_exit',
  colors text[] NOT NULL DEFAULT '{}',
  numbers integer[] NOT NULL DEFAULT '{}',
  gales integer NOT NULL DEFAULT 2,
  victory_target text NOT NULL DEFAULT 'reds',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage patterns"
  ON public.patterns FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can read active patterns
CREATE POLICY "Authenticated users can read active patterns"
  ON public.patterns FOR SELECT
  TO authenticated
  USING (status = 'active');
