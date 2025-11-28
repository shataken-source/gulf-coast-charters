-- Weather alerts migration
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS weather_alert_sent BOOLEAN DEFAULT false;
