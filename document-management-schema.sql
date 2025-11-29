-- ============================================================================
-- DOCUMENT MANAGEMENT SCHEMA
-- ============================================================================
-- Already partially covered in captain_documents
-- This extends with additional features
-- ============================================================================

-- ============================================================================
-- DOCUMENT UPLOADS (General - for all users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    document_name TEXT NOT NULL,
    document_type TEXT,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    
    -- OCR Data (if scanned)
    ocr_text TEXT,
    ocr_data JSONB,
    
    -- Organization
    folder TEXT DEFAULT 'root',
    tags TEXT[],
    
    -- Security
    encrypted BOOLEAN DEFAULT FALSE,
    requires_biometric BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ
);

-- ============================================================================
-- DOCUMENT SHARES
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES user_documents(id) ON DELETE CASCADE,
    
    -- Sharing
    shared_by UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Permissions
    can_view BOOLEAN DEFAULT TRUE,
    can_download BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    
    -- Expiration
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX idx_user_documents_type ON user_documents(document_type);
CREATE INDEX idx_user_documents_folder ON user_documents(folder);

CREATE INDEX idx_document_shares_document ON document_shares(document_id);
CREATE INDEX idx_document_shares_shared_with ON document_shares(shared_with);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents" ON user_documents
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared documents" ON user_documents
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM document_shares
            WHERE document_id = user_documents.id
            AND shared_with = auth.uid()
            AND can_view = true
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

-- ============================================================================
-- COMPLETE DOCUMENT MANAGEMENT SCHEMA
-- ============================================================================
