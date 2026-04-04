
-- Trip status enum
CREATE TYPE public.trip_status AS ENUM ('planned', 'active', 'completed', 'cancelled');

-- Trips table
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status trip_status NOT NULL DEFAULT 'planned',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trips" ON public.trips
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create trips" ON public.trips
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own trips" ON public.trips
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own trips" ON public.trips
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Trip shares (who a trip is shared with)
CREATE TABLE public.trip_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  shared_with_name TEXT NOT NULL,
  shared_with_phone TEXT DEFAULT '',
  shared_with_email TEXT DEFAULT '',
  notify_on_deviation BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_shares ENABLE ROW LEVEL SECURITY;

-- Security definer to check trip ownership
CREATE OR REPLACE FUNCTION public.owns_trip(_user_id UUID, _trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trips WHERE id = _trip_id AND user_id = _user_id
  )
$$;

CREATE POLICY "Users can view shares of own trips" ON public.trip_shares
  FOR SELECT TO authenticated USING (public.owns_trip(auth.uid(), trip_id));

CREATE POLICY "Users can add shares to own trips" ON public.trip_shares
  FOR INSERT TO authenticated WITH CHECK (public.owns_trip(auth.uid(), trip_id));

CREATE POLICY "Users can remove shares from own trips" ON public.trip_shares
  FOR DELETE TO authenticated USING (public.owns_trip(auth.uid(), trip_id));
