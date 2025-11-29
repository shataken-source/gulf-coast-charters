-- ============================================================================
-- CAPTAIN ENGAGEMENT SYSTEM SCHEMA
-- ============================================================================
-- Created: November 27, 2025
-- Recovery: Captain-specific features
-- ============================================================================

-- ============================================================================
-- FLEET VESSELS
-- ============================================================================

CREATE TABLE IF NOT EXISTS fleet_vessels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    captain_id UUID REFERENCES captains(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    type TEXT, -- 'center-console', 'sportfish', 'catamaran', etc.
    capacity INTEGER,
    year INTEGER,
    length INTEGER, -- feet
    make TEXT,
    model TEXT,
    
    -- Documentation
    registration TEXT,
    insurance_policy TEXT,
    insurance_expires_at DATE,
    
    -- Features
    amenities TEXT[],
    equipment TEXT[],
    
    -- Images
    photos TEXT[],
    primary_photo TEXT,
    
    -- Status
    status TEXT DEFAULT 'active',
    home_port TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREW MEMBERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS crew_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    captain_id UUID REFERENCES captains(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    role TEXT, -- 'first_mate', 'deckhand', 'chef', 'guide'
    phone TEXT,
    email TEXT,
    
    -- Certifications
    certifications JSONB,
    
    -- Availability
    availability JSONB,
    
    -- Pay
    pay_rate DECIMAL(10,2),
    pay_type TEXT DEFAULT 'hourly',
    
    -- Emergency Contact
    emergency_contact JSONB,
    
    -- Performance
    status TEXT DEFAULT 'active',
    performance_rating DECIMAL(3,2) DEFAULT 5.0,
    trips_completed INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TRIP CREW ASSIGNMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS trip_crew_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    crew_id UUID REFERENCES crew_members(id) ON DELETE CASCADE,
    
    role TEXT,
    pay_amount DECIMAL(10,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(booking_id, crew_id)
);

-- ============================================================================
-- CAPTAIN DOCUMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS captain_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    captain_id UUID REFERENCES captains(id) ON DELETE CASCADE,
    
    document_type TEXT NOT NULL, -- 'license', 'insurance', 'registration', 'certification'
    document_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    
    -- Dates
    issue_date DATE,
    expiry_date DATE,
    
    -- Status
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EQUIPMENT INVENTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    captain_id UUID REFERENCES captains(id) ON DELETE CASCADE,
    vessel_id UUID REFERENCES fleet_vessels(id) ON DELETE SET NULL,
    
    item_name TEXT NOT NULL,
    category TEXT, -- 'safety', 'fishing', 'electronics', 'maintenance'
    quantity INTEGER DEFAULT 1,
    
    -- Tracking
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    condition TEXT DEFAULT 'good',
    
    -- Maintenance
    last_service_date DATE,
    next_service_date DATE,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MAINTENANCE LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_id UUID REFERENCES fleet_vessels(id) ON DELETE CASCADE,
    
    maintenance_type TEXT, -- 'routine', 'repair', 'inspection', 'upgrade'
    description TEXT NOT NULL,
    
    -- Details
    performed_by TEXT,
    cost DECIMAL(10,2),
    
    -- Dates
    scheduled_date DATE,
    completed_date DATE,
    
    -- Parts
    parts_used JSONB,
    
    -- Status
    status TEXT DEFAULT 'scheduled',
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_fleet_vessels_captain ON fleet_vessels(captain_id);
CREATE INDEX idx_fleet_vessels_status ON fleet_vessels(status);

CREATE INDEX idx_crew_members_captain ON crew_members(captain_id);
CREATE INDEX idx_crew_members_status ON crew_members(status);

CREATE INDEX idx_crew_assignments_booking ON trip_crew_assignments(booking_id);
CREATE INDEX idx_crew_assignments_crew ON trip_crew_assignments(crew_id);

CREATE INDEX idx_captain_documents_captain ON captain_documents(captain_id);
CREATE INDEX idx_captain_documents_type ON captain_documents(document_type);
CREATE INDEX idx_captain_documents_expiry ON captain_documents(expiry_date);

CREATE INDEX idx_equipment_captain ON equipment_inventory(captain_id);
CREATE INDEX idx_equipment_vessel ON equipment_inventory(vessel_id);

CREATE INDEX idx_maintenance_vessel ON maintenance_logs(vessel_id);
CREATE INDEX idx_maintenance_status ON maintenance_logs(status);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE fleet_vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE captain_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Fleet: Captain can manage own vessels
CREATE POLICY "Captains can manage own fleet" ON fleet_vessels
    FOR ALL USING (auth.uid() = captain_id);

-- Crew: Captain can manage own crew
CREATE POLICY "Captains can manage own crew" ON crew_members
    FOR ALL USING (auth.uid() = captain_id);

-- Documents: Captain can manage own documents
CREATE POLICY "Captains can manage own documents" ON captain_documents
    FOR ALL USING (auth.uid() = captain_id);

-- Equipment: Captain can manage own equipment
CREATE POLICY "Captains can manage own equipment" ON equipment_inventory
    FOR ALL USING (auth.uid() = captain_id);

-- Maintenance: Captain can manage own maintenance
CREATE POLICY "Captains can manage own maintenance logs" ON maintenance_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM fleet_vessels
            WHERE id = vessel_id AND captain_id = auth.uid()
        )
    );

-- ============================================================================
-- COMPLETE CAPTAIN ENGAGEMENT SCHEMA
-- ============================================================================
