-- ============================================================================
-- MIGRATION 005: WEATHER ALERTS SYSTEM
-- ============================================================================
-- Created: November 27, 2025
-- Recovery: Weather alert enhancements
-- ============================================================================

-- Weather alerts table already exists in main schema
-- This migration adds additional indexes and functions

-- ============================================================================
-- ADDITIONAL WEATHER ALERT TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS buoy_stations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location GEOGRAPHY(POINT) NOT NULL,
    depth INTEGER,
    type TEXT,
    distance_from_shore INTEGER,
    status TEXT DEFAULT 'active',
    last_reading_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weather_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buoy_station_id TEXT REFERENCES buoy_stations(id),
    
    -- Wind
    wind_direction DECIMAL(5,2),
    wind_speed DECIMAL(5,2), -- m/s
    gust_speed DECIMAL(5,2),
    
    -- Waves
    wave_height DECIMAL(5,2), -- meters
    dominant_wave_period DECIMAL(5,2),
    average_wave_period DECIMAL(5,2),
    wave_direction DECIMAL(5,2),
    
    -- Atmospheric
    pressure DECIMAL(6,2), -- hPa
    air_temperature DECIMAL(5,2), -- celsius
    water_temperature DECIMAL(5,2),
    dewpoint DECIMAL(5,2),
    
    -- Visibility
    visibility DECIMAL(5,2), -- nautical miles
    
    -- Metadata
    reading_time TIMESTAMPTZ NOT NULL,
    raw_data JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weather_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location TEXT NOT NULL,
    coordinates GEOGRAPHY(POINT),
    
    forecast_date DATE NOT NULL,
    forecast_time TIME,
    
    -- Conditions
    conditions TEXT,
    temperature_high DECIMAL(5,2),
    temperature_low DECIMAL(5,2),
    wind_speed DECIMAL(5,2),
    wave_height DECIMAL(5,2),
    precipitation_chance INTEGER,
    
    -- Source
    source TEXT DEFAULT 'NOAA',
    forecast_data JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(location, forecast_date, forecast_time)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_buoy_stations_location ON buoy_stations USING GIST(location);
CREATE INDEX idx_buoy_stations_status ON buoy_stations(status);

CREATE INDEX idx_weather_readings_buoy ON weather_readings(buoy_station_id);
CREATE INDEX idx_weather_readings_time ON weather_readings(reading_time DESC);

CREATE INDEX idx_weather_forecasts_location ON weather_forecasts(location);
CREATE INDEX idx_weather_forecasts_date ON weather_forecasts(forecast_date);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get nearest buoy to coordinates
CREATE OR REPLACE FUNCTION get_nearest_buoy(lat DECIMAL, lon DECIMAL)
RETURNS TEXT AS $$
DECLARE
    nearest_buoy TEXT;
BEGIN
    SELECT id INTO nearest_buoy
    FROM buoy_stations
    WHERE status = 'active'
    ORDER BY location <-> ST_SetSRID(ST_MakePoint(lon, lat), 4326)
    LIMIT 1;
    
    RETURN nearest_buoy;
END;
$$ LANGUAGE plpgsql;

-- Check if conditions are hazardous
CREATE OR REPLACE FUNCTION check_hazardous_conditions(
    p_wind_speed DECIMAL,
    p_wave_height DECIMAL,
    p_pressure DECIMAL
)
RETURNS TEXT AS $$
BEGIN
    -- Convert m/s to knots for wind
    IF (p_wind_speed * 1.94384) > 25 THEN
        RETURN 'danger';
    ELSIF (p_wind_speed * 1.94384) > 15 THEN
        RETURN 'warning';
    END IF;
    
    -- Convert meters to feet for waves
    IF (p_wave_height * 3.28084) > 6 THEN
        RETURN 'danger';
    ELSIF (p_wave_height * 3.28084) > 4 THEN
        RETURN 'warning';
    END IF;
    
    -- Check pressure
    IF p_pressure < 1000 THEN
        RETURN 'danger';
    ELSIF p_pressure < 1005 THEN
        RETURN 'warning';
    END IF;
    
    RETURN 'safe';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA - Gulf Coast Buoys
-- ============================================================================

INSERT INTO buoy_stations (id, name, location, depth, type, distance_from_shore) VALUES
    ('42039', 'Pensacola - 28NM South', ST_SetSRID(ST_MakePoint(-86.008, 28.791), 4326), 244, '3-meter discus', 28),
    ('42040', 'Luke Offshore Platform', ST_SetSRID(ST_MakePoint(-88.226, 29.212), 4326), 185, 'Platform', 40),
    ('42036', 'West Tampa - 114NM WNW', ST_SetSRID(ST_MakePoint(-84.517, 28.500), 4326), 53, '3-meter discus', 114),
    ('42007', 'South of Mobile', ST_SetSRID(ST_MakePoint(-88.769, 30.093), 4326), 14, 'USCG Light Station', 18),
    ('42012', 'Orange Beach - 40NM South', ST_SetSRID(ST_MakePoint(-87.555, 30.065), 4326), 73, '3-meter discus', 40),
    ('42001', 'South of Grand Isle', ST_SetSRID(ST_MakePoint(-89.668, 25.897), 4326), 3200, '3-meter discus', 190),
    ('42019', 'Freeport TX - 60NM South', ST_SetSRID(ST_MakePoint(-95.352, 27.907), 4326), 85, '3-meter discus', 60),
    ('42020', 'Corpus Christi - 60NM East', ST_SetSRID(ST_MakePoint(-96.695, 26.968), 4326), 85, '3-meter discus', 60)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMPLETE WEATHER ALERTS MIGRATION
-- ============================================================================
