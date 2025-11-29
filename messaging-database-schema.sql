-- ============================================================================
-- GULF COAST CHARTERS - MESSAGING DATABASE SCHEMA
-- ============================================================================
-- Created: November 27, 2025
-- Recovery: Complete instant messaging system
-- Tables: 6 messaging-specific tables
-- ============================================================================

-- ============================================================================
-- 1. CONVERSATIONS (Already in main schema, but extended here)
-- ============================================================================

-- Table already exists in main schema, adding additional indexes
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);

-- ============================================================================
-- 2. CONVERSATION PARTICIPANTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Role & Status
    role TEXT DEFAULT 'member', -- 'admin', 'member'
    is_muted BOOLEAN DEFAULT false,
    
    -- Read Tracking
    last_read_at TIMESTAMPTZ,
    
    -- Timestamps
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    
    UNIQUE(conversation_id, user_id)
);

-- ============================================================================
-- 3. MESSAGE REACTIONS (Optional - emoji reactions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    reaction TEXT NOT NULL, -- Emoji or reaction type
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(message_id, user_id, reaction)
);

-- ============================================================================
-- 4. USER PRESENCE (Online/Offline Status)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_presence (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    status TEXT DEFAULT 'offline', -- 'online', 'away', 'offline'
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    
    -- Currently active conversation
    active_conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    
    -- Device info
    device_type TEXT,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. TYPING INDICATORS
-- ============================================================================

CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    started_typing_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Auto-expire after 10 seconds
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 seconds',
    
    UNIQUE(conversation_id, user_id)
);

-- ============================================================================
-- 6. MESSAGE DELIVERY STATUS
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_delivery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Delivery tracking
    delivered BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMPTZ,
    
    -- Read tracking (duplicate of message_reads for consistency)
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    UNIQUE(message_id, user_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Conversation Participants
CREATE INDEX idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_participants_role ON conversation_participants(role);

-- Message Reactions
CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user ON message_reactions(user_id);

-- User Presence
CREATE INDEX idx_user_presence_status ON user_presence(status);
CREATE INDEX idx_user_presence_last_seen ON user_presence(last_seen DESC);

-- Typing Indicators
CREATE INDEX idx_typing_conversation ON typing_indicators(conversation_id);
CREATE INDEX idx_typing_expires ON typing_indicators(expires_at);

-- Message Delivery
CREATE INDEX idx_message_delivery_message ON message_delivery(message_id);
CREATE INDEX idx_message_delivery_user ON message_delivery(user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update conversation's last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET 
        last_message_at = NEW.created_at,
        last_message = LEFT(NEW.content, 100),
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_last_message_trigger
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Auto-update user presence
CREATE OR REPLACE FUNCTION update_user_presence()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_presence (user_id, status, last_seen)
    VALUES (NEW.sender_id, 'online', NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        status = 'online',
        last_seen = NOW(),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_presence_trigger
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_user_presence();

-- Create message delivery records for all participants
CREATE OR REPLACE FUNCTION create_message_delivery_records()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO message_delivery (message_id, user_id, delivered, read)
    SELECT 
        NEW.id,
        unnest(c.participant_ids),
        CASE WHEN unnest(c.participant_ids) = NEW.sender_id THEN true ELSE false END,
        CASE WHEN unnest(c.participant_ids) = NEW.sender_id THEN true ELSE false END
    FROM conversations c
    WHERE c.id = NEW.conversation_id
    AND unnest(c.participant_ids) != NEW.sender_id; -- Don't create for sender
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_message_delivery_trigger
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION create_message_delivery_records();

-- Auto-cleanup old typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM typing_indicators
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_delivery ENABLE ROW LEVEL SECURITY;

-- Conversation Participants: View if in conversation
CREATE POLICY "Users can view participants in their conversations" ON conversation_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE id = conversation_id
            AND auth.uid() = ANY(participant_ids)
        )
    );

-- Message Reactions: View all, create own
CREATE POLICY "Users can view message reactions" ON message_reactions
    FOR SELECT USING (true);

CREATE POLICY "Users can add reactions" ON message_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions" ON message_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- User Presence: Public readable
CREATE POLICY "User presence is publicly viewable" ON user_presence
    FOR SELECT USING (true);

CREATE POLICY "Users can update own presence" ON user_presence
    FOR ALL USING (auth.uid() = user_id);

-- Typing Indicators: View in own conversations
CREATE POLICY "Users can view typing indicators in their conversations" ON typing_indicators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE id = conversation_id
            AND auth.uid() = ANY(participant_ids)
        )
    );

CREATE POLICY "Users can create typing indicators" ON typing_indicators
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Message Delivery: View own delivery status
CREATE POLICY "Users can view own message delivery status" ON message_delivery
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- REALTIME PUBLICATION (Supabase Realtime)
-- ============================================================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;

-- ============================================================================
-- COMPLETE MESSAGING SCHEMA LOADED
-- ============================================================================
-- Total Tables: 6
-- Total Indexes: 12
-- Total Functions: 4
-- Total Triggers: 3
-- Total RLS Policies: 8
-- Realtime: Enabled on 4 tables
-- ============================================================================
