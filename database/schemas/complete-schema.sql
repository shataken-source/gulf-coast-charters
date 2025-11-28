-- =====================================================
-- GULF COAST CHARTERS - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Version: 1.0.0
-- Created: November 2025
-- Purpose: Production-ready database for charter booking platform
-- Features: Bookings, Payments, Weather, Points, Tournaments, Messaging
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('customer', 'captain', 'admin')) DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Captains table
CREATE TABLE IF NOT EXISTS public.captains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT NOT NULL,
  uscg_license TEXT UNIQUE,
  license_verified BOOLEAN DEFAULT false,
  license_verified_at TIMESTAMPTZ,
  insurance_verified BOOLEAN DEFAULT false,
  boat_name TEXT,
  boat_type TEXT,
  boat_capacity INTEGER,
  home_port TEXT,
  bio TEXT,
  years_experience INTEGER,
  specialty TEXT[],
  location GEOGRAPHY(POINT),
  stripe_account_id TEXT UNIQUE,
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  commission_rate DECIMAL(5,2) DEFAULT 15.00,
  rating DECIMAL(3,2) DEFAULT 5.00,
  total_trips INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Charters (trip listings)
CREATE TABLE IF NOT EXISTS public.charters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  captain_id UUID REFERENCES public.captains(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_hours DECIMAL(4,2) NOT NULL,
  max_passengers INTEGER NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2),
  location TEXT NOT NULL,
  departure_port TEXT NOT NULL,
  coordinates GEOGRAPHY(POINT),
  trip_type TEXT CHECK (trip_type IN ('inshore', 'nearshore', 'offshore', 'deep_sea', 'fly_fishing')),
  target_species TEXT[],
  amenities TEXT[],
  photos TEXT[],
  is_active BOOLEAN DEFAULT true,
  cancellation_policy TEXT,
  weather_dependent BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  charter_id UUID REFERENCES public.charters(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  captain_id UUID REFERENCES public.captains(id) ON DELETE CASCADE,
  trip_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  num_passengers INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  deposit_paid DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2),
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'refunded')) DEFAULT 'pending',
  payment_intent_id TEXT,
  stripe_charge_id TEXT,
  weather_alert_sent BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
  captain_id UUID REFERENCES public.captains(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title TEXT,
  comment TEXT,
  photos TEXT[],
  response TEXT,
  responded_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- WEATHER ALERTS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.weather_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  alert_level TEXT CHECK (alert_level IN ('safe', 'caution', 'hazardous')) NOT NULL,
  wind_speed DECIMAL(5,2),
  wind_gust DECIMAL(5,2),
  wave_height DECIMAL(5,2),
  pressure DECIMAL(6,2),
  buoy_id TEXT,
  alert_message TEXT NOT NULL,
  recommendation TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOAA Buoy mapping
CREATE TABLE IF NOT EXISTS public.buoy_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buoy_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location GEOGRAPHY(POINT) NOT NULL,
  region TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMMUNITY POINTS & GAMIFICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  trust_level TEXT CHECK (trust_level IN ('new', 'member', 'regular', 'veteran', 'legend')) DEFAULT 'new',
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_bookings INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  action_type TEXT CHECK (action_type IN ('booking', 'review', 'photo', 'referral', 'streak', 'badge', 'tournament')) NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  points_required INTEGER,
  rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS public.leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  period TEXT CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')) NOT NULL,
  rank INTEGER,
  points INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period)
);

-- =====================================================
-- TOURNAMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  entry_fee DECIMAL(10,2) DEFAULT 0,
  prize_pool DECIMAL(10,2) DEFAULT 0,
  max_participants INTEGER,
  tournament_type TEXT CHECK (tournament_type IN ('largest_fish', 'most_fish', 'specific_species', 'grand_slam')) NOT NULL,
  target_species TEXT[],
  rules JSONB,
  status TEXT CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')) DEFAULT 'upcoming',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  captain_id UUID REFERENCES public.captains(id),
  entry_paid BOOLEAN DEFAULT false,
  payment_intent_id TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.tournament_catches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES public.tournament_participants(id) ON DELETE CASCADE,
  species TEXT NOT NULL,
  length DECIMAL(6,2),
  weight DECIMAL(8,2),
  photo_url TEXT,
  caught_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.users(id),
  verified_at TIMESTAMPTZ,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MESSAGING SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT CHECK (type IN ('direct', 'group', 'support')) DEFAULT 'direct',
  name TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT false,
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'file', 'location', 'system')) DEFAULT 'text',
  attachments JSONB,
  read_by UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =====================================================
-- CRON JOBS & ADMIN
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cron_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  schedule TEXT NOT NULL,
  function_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cron_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cron_job_id UUID REFERENCES public.cron_jobs(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('running', 'success', 'failed')) DEFAULT 'running',
  error_message TEXT,
  execution_time_ms INTEGER,
  records_processed INTEGER
);

-- =====================================================
-- PAYMENTS & TRANSACTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  captain_id UUID REFERENCES public.captains(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  transaction_type TEXT CHECK (transaction_type IN ('payment', 'refund', 'payout', 'fee')) NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_transfer_id TEXT,
  status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')) DEFAULT 'pending',
  fee_amount DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('booking', 'payment', 'weather', 'message', 'tournament', 'badge', 'system')) NOT NULL,
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  device_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_bookings_trip_date ON public.bookings(trip_date);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX idx_bookings_captain_id ON public.bookings(captain_id);
CREATE INDEX idx_charters_captain_id ON public.charters(captain_id);
CREATE INDEX idx_charters_location ON public.charters USING GIST(coordinates);
CREATE INDEX idx_reviews_captain_id ON public.reviews(captain_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users: can read own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Captains: can read own data
CREATE POLICY "Captains can view own profile" ON public.captains
  FOR ALL USING (auth.uid() = user_id);

-- Charters: public read, captains can manage own
CREATE POLICY "Anyone can view active charters" ON public.charters
  FOR SELECT USING (is_active = true);

CREATE POLICY "Captains can manage own charters" ON public.charters
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.captains WHERE id = captain_id)
  );

-- Bookings: users see own, captains see their charters
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() = customer_id OR
    auth.uid() IN (SELECT user_id FROM public.captains WHERE id = captain_id)
  );

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Messages: participants only
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Notifications: users see own
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_captains_updated_at
  BEFORE UPDATE ON public.captains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_charters_updated_at
  BEFORE UPDATE ON public.charters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Calculate captain rating
CREATE OR REPLACE FUNCTION public.calculate_captain_rating(captain_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  avg_rating DECIMAL(3,2);
BEGIN
  SELECT COALESCE(AVG(rating), 5.0)
  INTO avg_rating
  FROM public.reviews
  WHERE captain_id = captain_uuid;
  
  RETURN avg_rating;
END;
$$ LANGUAGE plpgsql;

-- Award points function
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT,
  p_action_type TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Add points transaction
  INSERT INTO public.point_transactions (user_id, points, reason, action_type, reference_id)
  VALUES (p_user_id, p_points, p_reason, p_action_type, p_reference_id);
  
  -- Update total points
  UPDATE public.user_points
  SET total_points = total_points + p_points,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Create user_points if doesn't exist
  INSERT INTO public.user_points (user_id, total_points)
  VALUES (p_user_id, p_points)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA (Optional - for development)
-- =====================================================

-- Insert default badges
INSERT INTO public.badges (name, description, icon, points_required, rarity) VALUES
  ('First Booking', 'Completed your first charter booking', '🎣', 0, 'common'),
  ('Early Adopter', 'Joined Gulf Coast Charters in the first month', '🚀', 0, 'uncommon'),
  ('Review Master', 'Left 10+ helpful reviews', '⭐', 100, 'rare'),
  ('Tournament Winner', 'Won your first tournament', '🏆', 500, 'epic'),
  ('Captain''s Favorite', 'Received 5-star reviews from 10+ captains', '💎', 1000, 'legendary')
ON CONFLICT (name) DO NOTHING;

-- Insert Gulf Coast buoy locations
INSERT INTO public.buoy_locations (buoy_id, name, location, region) VALUES
  ('42040', 'Luke Offshore', ST_SetSRID(ST_MakePoint(-88.23, 29.18), 4326)::geography, 'Northern Gulf'),
  ('42039', 'Pensacola', ST_SetSRID(ST_MakePoint(-86.01, 28.79), 4326)::geography, 'Florida Panhandle'),
  ('42001', 'East of Mississippi Delta', ST_SetSRID(ST_MakePoint(-89.66, 25.90), 4326)::geography, 'Louisiana'),
  ('42019', 'Freeport TX', ST_SetSRID(ST_MakePoint(-95.35, 27.91), 4326)::geography, 'Texas Coast')
ON CONFLICT (buoy_id) DO NOTHING;

-- =====================================================
-- SCHEMA VERSION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.schema_version (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.schema_version (version) VALUES ('1.0.0');

-- =====================================================
-- END OF SCHEMA
-- =====================================================
