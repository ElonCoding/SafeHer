
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  is_guardian BOOLEAN NOT NULL DEFAULT false,
  trust_score INTEGER NOT NULL DEFAULT 50,
  verified BOOLEAN NOT NULL DEFAULT false,
  skills TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{English}',
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Guardian reviews table
CREATE TABLE public.guardian_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(guardian_id, reviewer_id)
);

ALTER TABLE public.guardian_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.guardian_reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own reviews" ON public.guardian_reviews
  FOR INSERT TO authenticated WITH CHECK (reviewer_id = auth.uid());

-- Guardian messages (chat)
CREATE TABLE public.guardian_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.guardian_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.guardian_messages
  FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages" ON public.guardian_messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can mark messages as read" ON public.guardian_messages
  FOR UPDATE TO authenticated USING (receiver_id = auth.uid()) WITH CHECK (receiver_id = auth.uid());

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.guardian_messages;

-- Auto-update trust_score function
CREATE OR REPLACE FUNCTION public.update_guardian_trust_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating NUMERIC;
  review_count INTEGER;
  new_score INTEGER;
BEGIN
  SELECT AVG(rating), COUNT(*) INTO avg_rating, review_count
  FROM public.guardian_reviews
  WHERE guardian_id = COALESCE(NEW.guardian_id, OLD.guardian_id);

  new_score := LEAST(100, GREATEST(10, (avg_rating * 20)::INTEGER));

  UPDATE public.profiles
  SET trust_score = new_score, updated_at = now()
  WHERE id = COALESCE(NEW.guardian_id, OLD.guardian_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_review_update_trust_score
  AFTER INSERT OR UPDATE OR DELETE ON public.guardian_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_guardian_trust_score();

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
