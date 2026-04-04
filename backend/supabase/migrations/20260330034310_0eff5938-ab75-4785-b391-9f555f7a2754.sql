
-- Incident categories enum
CREATE TYPE public.incident_category AS ENUM (
  'harassment', 'stalking', 'unsafe_area', 'theft', 'suspicious_activity', 'poor_lighting', 'other'
);

CREATE TYPE public.incident_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Incidents table
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category incident_category NOT NULL,
  severity incident_severity NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  location_name TEXT NOT NULL DEFAULT '',
  anonymous BOOLEAN NOT NULL DEFAULT false,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view incidents
CREATE POLICY "Anyone can view incidents" ON public.incidents
  FOR SELECT TO authenticated USING (true);

-- Users can insert incidents
CREATE POLICY "Users can report incidents" ON public.incidents
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());

-- Users can update own incidents
CREATE POLICY "Users can update own incidents" ON public.incidents
  FOR UPDATE TO authenticated USING (reporter_id = auth.uid()) WITH CHECK (reporter_id = auth.uid());

-- Also allow anonymous/public read for the safety feed
CREATE POLICY "Public can view incidents" ON public.incidents
  FOR SELECT TO anon USING (true);
