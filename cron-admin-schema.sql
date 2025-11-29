-- ============================================================================
-- CRON ADMINISTRATION SCHEMA
-- ============================================================================
-- Created: November 27, 2025
-- Recovery: Cron job management and logging
-- ============================================================================

-- ============================================================================
-- CRON JOBS
-- ============================================================================

CREATE TABLE IF NOT EXISTS cron_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    job_name TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Schedule
    schedule TEXT NOT NULL, -- Cron expression
    function_name TEXT NOT NULL,
    
    -- Status
    enabled BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CRON LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS cron_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES cron_jobs(id) ON DELETE CASCADE,
    
    -- Execution
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration INTERVAL,
    
    -- Result
    status TEXT, -- 'success', 'failed', 'skipped'
    result JSONB,
    error_message TEXT,
    
    -- Stats
    records_processed INTEGER,
    records_failed INTEGER
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_cron_jobs_enabled ON cron_jobs(enabled);
CREATE INDEX idx_cron_jobs_next_run ON cron_jobs(next_run_at);

CREATE INDEX idx_cron_logs_job_id ON cron_logs(job_id);
CREATE INDEX idx_cron_logs_started_at ON cron_logs(started_at DESC);
CREATE INDEX idx_cron_logs_status ON cron_logs(status);

-- ============================================================================
-- SEED CRON JOBS
-- ============================================================================

INSERT INTO cron_jobs (job_name, description, schedule, function_name) VALUES
    ('weather_alerts', 'Send weather alerts for upcoming trips', '0 * * * *', 'send_weather_alerts'),
    ('cleanup_expired_data', 'Clean up expired sessions and temp data', '0 2 * * *', 'cleanup_expired'),
    ('update_leaderboards', 'Recalculate leaderboard rankings', '*/30 * * * *', 'update_leaderboards'),
    ('process_notifications', 'Process queued notifications', '*/5 * * * *', 'process_notifications'),
    ('backup_data', 'Daily database backup', '0 3 * * *', 'backup_database')
ON CONFLICT (job_name) DO NOTHING;

-- ============================================================================
-- COMPLETE CRON ADMIN SCHEMA
-- ============================================================================
