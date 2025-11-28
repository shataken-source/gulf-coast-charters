# 📡 API DOCUMENTATION

## Authentication
All API endpoints require authentication via Supabase JWT tokens.

## Endpoints

### Weather Alerts
POST /api/weather-alerts
- Triggers weather check for upcoming trips
- Returns: { alerts_sent, bookings_checked }

### Community Points
POST /api/points/award
- Body: { userId, points, reason, actionType }
- Awards points to user

### Stripe
POST /api/stripe/create-checkout
- Body: { bookingId }
- Returns: { sessionId, url }

POST /api/stripe/webhook
- Handles Stripe events
- Validates webhook signature

### Push Notifications  
POST /api/push/send
- Body: { userId, payload }
- Sends push notification

Complete API docs: See individual files for full documentation
