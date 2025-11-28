-- =====================================================
-- TOURNAMENT SYSTEM - DATABASE SCHEMA
-- =====================================================

-- Tournaments table
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
  rules JSONB DEFAULT '{}'::jsonb,
  status TEXT CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')) DEFAULT 'upcoming',
  created_by UUID REFERENCES public.users(id),
  location TEXT,
  is_public BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournament participants
CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  captain_id UUID REFERENCES public.captains(id),
  team_name TEXT,
  entry_paid BOOLEAN DEFAULT false,
  payment_intent_id TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- Tournament catches
CREATE TABLE IF NOT EXISTS public.tournament_catches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES public.tournament_participants(id) ON DELETE CASCADE,
  species TEXT NOT NULL,
  length DECIMAL(6,2),
  weight DECIMAL(8,2),
  photo_url TEXT,
  caught_at TIMESTAMPTZ NOT NULL,
  location GEOGRAPHY(POINT),
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.users(id),
  verified_at TIMESTAMPTZ,
  points INTEGER DEFAULT 0,
  disqualified BOOLEAN DEFAULT false,
  disqualification_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournament leaderboards (materialized view for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS tournament_leaderboards AS
SELECT 
  tc.tournament_id,
  tp.user_id,
  tp.team_name,
  COUNT(*) as total_catches,
  SUM(tc.weight) as total_weight,
  MAX(tc.weight) as largest_catch,
  SUM(tc.points) as total_points,
  RANK() OVER (PARTITION BY tc.tournament_id ORDER BY SUM(tc.points) DESC) as rank
FROM tournament_catches tc
JOIN tournament_participants tp ON tc.participant_id = tp.id
WHERE tc.verified = true AND tc.disqualified = false
GROUP BY tc.tournament_id, tp.user_id, tp.team_name;

-- Refresh function for leaderboard
CREATE OR REPLACE FUNCTION refresh_tournament_leaderboard(tournament_uuid UUID)
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW tournament_leaderboards;
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_tournaments_start_date ON public.tournaments(start_date);
CREATE INDEX idx_tournament_participants_tournament ON public.tournament_participants(tournament_id);
CREATE INDEX idx_tournament_catches_tournament ON public.tournament_catches(tournament_id);
CREATE INDEX idx_tournament_catches_participant ON public.tournament_catches(participant_id);
CREATE INDEX idx_tournament_catches_verified ON public.tournament_catches(verified);

-- RLS Policies
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_catches ENABLE ROW LEVEL SECURITY;

-- Anyone can view public tournaments
CREATE POLICY "Public tournaments are viewable by everyone" ON public.tournaments
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

-- Users can create tournaments
CREATE POLICY "Users can create tournaments" ON public.tournaments
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Creators can update their tournaments
CREATE POLICY "Creators can update own tournaments" ON public.tournaments
  FOR UPDATE USING (auth.uid() = created_by);

-- Users can join tournaments
CREATE POLICY "Users can join tournaments" ON public.tournament_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view participants of tournaments they're in
CREATE POLICY "Users can view tournament participants" ON public.tournament_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id AND (t.is_public = true OR t.created_by = auth.uid())
    ) OR user_id = auth.uid()
  );

-- Users can submit catches to tournaments they're in
CREATE POLICY "Participants can submit catches" ON public.tournament_catches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tournament_participants tp
      WHERE tp.id = participant_id AND tp.user_id = auth.uid()
    )
  );

-- Users can view catches in their tournaments
CREATE POLICY "Users can view tournament catches" ON public.tournament_catches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tournament_participants tp
      JOIN public.tournaments t ON tp.tournament_id = t.id
      WHERE tp.tournament_id = tournament_id 
      AND (tp.user_id = auth.uid() OR t.created_by = auth.uid())
    )
  );

-- Triggers
CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
