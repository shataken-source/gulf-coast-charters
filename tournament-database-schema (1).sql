-- ============================================================================
-- GULF COAST CHARTERS - TOURNAMENT DATABASE SCHEMA
-- ============================================================================
-- Created: November 27, 2025
-- Recovery: From chat logs (tournament-database-schema.sql)
-- Purpose: Complete tournament system with push notifications
-- Tables: 9 tournament-specific tables
-- ============================================================================

-- ============================================================================
-- 1. TOURNAMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS fishing_tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,
    banner_image TEXT,
    
    -- Captain/Organizer
    captain_id UUID REFERENCES captains(id) ON DELETE CASCADE NOT NULL,
    
    -- Tournament Details
    entry_fee DECIMAL(10,2) DEFAULT 0,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    
    -- Dates
    registration_opens TIMESTAMPTZ NOT NULL,
    registration_closes TIMESTAMPTZ NOT NULL,
    tournament_starts TIMESTAMPTZ NOT NULL,
    tournament_ends TIMESTAMPTZ NOT NULL,
    
    -- Location
    location TEXT,
    coordinates GEOGRAPHY(POINT),
    
    -- Rules & Prizes
    rules JSONB,
    prize_structure JSONB, -- {first: 1000, second: 500, third: 250}
    species_allowed TEXT[],
    scoring_method TEXT DEFAULT 'total_weight', -- 'total_weight', 'biggest_fish', 'most_species'
    
    -- Status
    status TEXT DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed', 'cancelled'
    
    -- Settings
    allow_teams BOOLEAN DEFAULT FALSE,
    max_team_size INTEGER DEFAULT 1,
    require_photo_verification BOOLEAN DEFAULT TRUE,
    public_leaderboard BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. TOURNAMENT PARTICIPANTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tournament_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES fishing_tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Team Info (if applicable)
    team_name TEXT,
    team_members UUID[], -- Array of user IDs
    
    -- Registration
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
    payment_id UUID REFERENCES payments(id),
    
    -- Participation
    status TEXT DEFAULT 'registered', -- 'registered', 'active', 'disqualified', 'withdrawn'
    
    -- Scoring
    total_score DECIMAL(10,2) DEFAULT 0,
    total_catches INTEGER DEFAULT 0,
    biggest_catch_weight DECIMAL(10,2),
    biggest_catch_id UUID,
    
    -- Ranking
    current_rank INTEGER,
    final_rank INTEGER,
    
    -- Prizes
    prize_amount DECIMAL(10,2),
    prize_paid BOOLEAN DEFAULT FALSE,
    
    UNIQUE(tournament_id, user_id)
);

-- ============================================================================
-- 3. TOURNAMENT CATCHES
-- ============================================================================

CREATE TABLE IF NOT EXISTS tournament_catches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES fishing_tournaments(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES tournament_participants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Catch Details
    species TEXT NOT NULL,
    weight DECIMAL(6,2), -- pounds
    length DECIMAL(5,2), -- inches
    
    -- Verification
    photo_url TEXT,
    photo_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    
    -- Location & Time
    caught_at TIMESTAMPTZ DEFAULT NOW(),
    location GEOGRAPHY(POINT),
    location_name TEXT,
    
    -- Scoring
    points DECIMAL(10,2) DEFAULT 0,
    counts_towards_score BOOLEAN DEFAULT TRUE,
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. TOURNAMENT UPDATES (For Push Notifications)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tournament_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES fishing_tournaments(id) ON DELETE CASCADE,
    
    -- Author
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    author_name TEXT,
    
    -- Update Content
    update_type TEXT NOT NULL, -- 'catch', 'fish_biting', 'hot_spot', 'pro_tip', 'weather', 'general'
    title TEXT,
    message TEXT NOT NULL,
    
    -- Media
    photo_url TEXT,
    video_url TEXT,
    
    -- Location (for hot spots)
    location GEOGRAPHY(POINT),
    location_name TEXT,
    get_directions_url TEXT,
    
    -- Fish biting details
    species TEXT,
    bait_used TEXT,
    technique TEXT,
    
    -- Engagement
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    
    -- Push Notification
    push_sent BOOLEAN DEFAULT FALSE,
    push_sent_at TIMESTAMPTZ,
    push_recipient_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. PUSH SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Subscription Details (from browser Push API)
    endpoint TEXT UNIQUE NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    
    -- Device Info
    user_agent TEXT,
    device_type TEXT, -- 'mobile', 'tablet', 'desktop'
    
    -- Status
    active BOOLEAN DEFAULT TRUE,
    
    -- Preferences
    tournament_updates BOOLEAN DEFAULT TRUE,
    weather_alerts BOOLEAN DEFAULT TRUE,
    booking_notifications BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. USER NOTIFICATION PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Push Notification Preferences
    push_enabled BOOLEAN DEFAULT TRUE,
    push_tournament_catches BOOLEAN DEFAULT TRUE,
    push_fish_biting BOOLEAN DEFAULT TRUE,
    push_hot_spots BOOLEAN DEFAULT TRUE,
    push_pro_tips BOOLEAN DEFAULT TRUE,
    push_weather_updates BOOLEAN DEFAULT TRUE,
    push_leaderboard_changes BOOLEAN DEFAULT TRUE,
    push_tournament_start BOOLEAN DEFAULT TRUE,
    push_tournament_end BOOLEAN DEFAULT TRUE,
    
    -- Email Preferences
    email_enabled BOOLEAN DEFAULT TRUE,
    email_tournament_summary BOOLEAN DEFAULT TRUE,
    email_weekly_digest BOOLEAN DEFAULT TRUE,
    
    -- SMS Preferences
    sms_enabled BOOLEAN DEFAULT FALSE,
    sms_critical_only BOOLEAN DEFAULT TRUE,
    
    -- Quiet Hours
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. NOTIFICATION LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Notification Details
    notification_type TEXT NOT NULL, -- 'push', 'email', 'sms'
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES fishing_tournaments(id) ON DELETE SET NULL,
    update_id UUID REFERENCES tournament_updates(id) ON DELETE SET NULL,
    
    -- Content
    title TEXT,
    message TEXT,
    data JSONB,
    
    -- Delivery Status
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced'
    sent_at TIMESTAMPTZ,
    failed_reason TEXT,
    
    -- Response Tracking
    clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. TOURNAMENT UPDATE COMMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tournament_update_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    update_id UUID REFERENCES tournament_updates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. TOURNAMENT UPDATE LIKES
-- ============================================================================

CREATE TABLE IF NOT EXISTS tournament_update_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    update_id UUID REFERENCES tournament_updates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(update_id, user_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Tournaments
CREATE INDEX idx_tournaments_captain_id ON fishing_tournaments(captain_id);
CREATE INDEX idx_tournaments_status ON fishing_tournaments(status);
CREATE INDEX idx_tournaments_starts ON fishing_tournaments(tournament_starts);
CREATE INDEX idx_tournaments_ends ON fishing_tournaments(tournament_ends);

-- Participants
CREATE INDEX idx_participants_tournament_id ON tournament_participants(tournament_id);
CREATE INDEX idx_participants_user_id ON tournament_participants(user_id);
CREATE INDEX idx_participants_rank ON tournament_participants(current_rank);
CREATE INDEX idx_participants_score ON tournament_participants(total_score DESC);

-- Catches
CREATE INDEX idx_catches_tournament_id ON tournament_catches(tournament_id);
CREATE INDEX idx_catches_participant_id ON tournament_catches(participant_id);
CREATE INDEX idx_catches_user_id ON tournament_catches(user_id);
CREATE INDEX idx_catches_caught_at ON tournament_catches(caught_at DESC);
CREATE INDEX idx_catches_weight ON tournament_catches(weight DESC);

-- Updates
CREATE INDEX idx_updates_tournament_id ON tournament_updates(tournament_id);
CREATE INDEX idx_updates_type ON tournament_updates(update_type);
CREATE INDEX idx_updates_created_at ON tournament_updates(created_at DESC);

-- Push Subscriptions
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(active);

-- Notification Log
CREATE INDEX idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX idx_notification_log_tournament_id ON notification_log(tournament_id);
CREATE INDEX idx_notification_log_created_at ON notification_log(created_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update tournament participant count
CREATE OR REPLACE FUNCTION update_tournament_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE fishing_tournaments
        SET current_participants = current_participants + 1
        WHERE id = NEW.tournament_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE fishing_tournaments
        SET current_participants = GREATEST(current_participants - 1, 0)
        WHERE id = OLD.tournament_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_participant_count_trigger
AFTER INSERT OR DELETE ON tournament_participants
FOR EACH ROW EXECUTE FUNCTION update_tournament_participant_count();

-- Update tournament catch counts
CREATE OR REPLACE FUNCTION update_participant_catch_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tournament_participants
    SET 
        total_catches = (
            SELECT COUNT(*)
            FROM tournament_catches
            WHERE participant_id = NEW.participant_id
            AND status = 'verified'
        ),
        total_score = (
            SELECT COALESCE(SUM(points), 0)
            FROM tournament_catches
            WHERE participant_id = NEW.participant_id
            AND status = 'verified'
            AND counts_towards_score = true
        ),
        biggest_catch_weight = (
            SELECT MAX(weight)
            FROM tournament_catches
            WHERE participant_id = NEW.participant_id
            AND status = 'verified'
        )
    WHERE id = NEW.participant_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_catch_stats_trigger
AFTER INSERT OR UPDATE ON tournament_catches
FOR EACH ROW EXECUTE FUNCTION update_participant_catch_stats();

-- Update tournament update engagement counts
CREATE OR REPLACE FUNCTION update_tournament_update_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'tournament_update_likes' THEN
        UPDATE tournament_updates
        SET likes_count = (
            SELECT COUNT(*)
            FROM tournament_update_likes
            WHERE update_id = NEW.update_id
        )
        WHERE id = NEW.update_id;
    ELSIF TG_TABLE_NAME = 'tournament_update_comments' THEN
        UPDATE tournament_updates
        SET comments_count = (
            SELECT COUNT(*)
            FROM tournament_update_comments
            WHERE update_id = NEW.update_id
        )
        WHERE id = NEW.update_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_likes_count_trigger
AFTER INSERT OR DELETE ON tournament_update_likes
FOR EACH ROW EXECUTE FUNCTION update_tournament_update_counts();

CREATE TRIGGER update_comments_count_trigger
AFTER INSERT OR DELETE ON tournament_update_comments
FOR EACH ROW EXECUTE FUNCTION update_tournament_update_counts();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE fishing_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_catches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Tournaments: Public readable
CREATE POLICY "Tournaments are publicly viewable" ON fishing_tournaments
    FOR SELECT USING (true);

CREATE POLICY "Captains can create tournaments" ON fishing_tournaments
    FOR INSERT WITH CHECK (
        auth.uid() = captain_id AND
        EXISTS (SELECT 1 FROM captains WHERE id = auth.uid())
    );

CREATE POLICY "Captains can update own tournaments" ON fishing_tournaments
    FOR UPDATE USING (auth.uid() = captain_id);

-- Participants: Users can view tournament participants
CREATE POLICY "Tournament participants are viewable" ON tournament_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can register for tournaments" ON tournament_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Catches: Users can submit catches, public can view verified
CREATE POLICY "Verified catches are publicly viewable" ON tournament_catches
    FOR SELECT USING (status = 'verified' OR user_id = auth.uid());

CREATE POLICY "Users can submit catches" ON tournament_catches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tournament Updates: Public readable
CREATE POLICY "Tournament updates are publicly viewable" ON tournament_updates
    FOR SELECT USING (true);

CREATE POLICY "Participants can create updates" ON tournament_updates
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM tournament_participants
            WHERE tournament_id = tournament_updates.tournament_id
            AND user_id = auth.uid()
        )
    );

-- Push Subscriptions: Users can manage own subscriptions
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Notification Preferences: Users can manage own preferences
CREATE POLICY "Users can manage own notification preferences" ON user_notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- COMPLETE TOURNAMENT SCHEMA LOADED
-- ============================================================================
-- Total Tables: 9
-- Total Indexes: 15
-- Total Functions: 3
-- Total Triggers: 4
-- Total RLS Policies: 9
-- ============================================================================
