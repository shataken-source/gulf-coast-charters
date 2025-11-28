# 🎣 Gulf Coast Charters - Premium Charter Booking Platform

**The complete solution for charter fishing bookings on the Gulf Coast**

---

## 🚀 Project Overview

Gulf Coast Charters is a professional charter fishing booking platform built with cutting-edge technology and features that competitors don't have:

### **Core Features:**
- ⚡ Real-time weather alerts (NOAA buoy integration)
- 🎮 Community gamification & points system
- 📍 GPS location sharing with privacy controls
- 🏆 Fishing tournaments with live leaderboards
- 💬 Real-time instant messaging
- 💳 Secure Stripe payments (85% commission to captains)
- 🔒 USCG license verification
- 📱 PWA mobile app capabilities
- 🤖 AI chatbot assistant (Fishy)
- ⚙️ Advanced admin panel with cron job management

### **Business Model:**
- **15% platform commission** (industry-best 85% to captains)
- Multiple revenue streams: subscriptions, tournament fees, premium features
- Target: $3M-$53M revenue potential (Years 1-5)

---

## 📁 Project Structure

```
gulf-coast-charters/
├── api/                    # Backend APIs & Edge Functions
│   ├── weather-alerts.js
│   ├── community-points-system.js
│   ├── push-notifications-api.js
│   ├── stripe-captain-integration.js
│   └── ...
├── components/             # React Components
│   ├── LocationSharing.jsx
│   ├── FishingTournamentSystem.jsx
│   ├── InstantMessagingSystem.jsx
│   └── ...
├── database/               # Database files
│   ├── schemas/
│   │   └── complete-schema.sql
│   └── migrations/
│       └── *.sql
├── config/                 # Configuration files
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── .env.example
└── docs/                   # Documentation
    ├── README.md (this file)
    ├── IMPLEMENTATION_GUIDE.md
    └── ...
```

---

## 🛠️ Tech Stack

### **Frontend:**
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations
- **React Hook Form + Zod** - Form validation
- **Recharts** - Data visualization
- **Mapbox GL** - Interactive maps

### **Backend:**
- **Supabase** - PostgreSQL database + Auth + Storage
- **Supabase Edge Functions** - Serverless backend (Deno)
- **PostgreSQL + PostGIS** - Geospatial database
- **Stripe** - Payment processing
- **Pusher** - Real-time websockets

### **External APIs:**
- **NOAA National Data Buoy Center** - Weather data
- **OpenAI** - AI chatbot
- **Twilio/SendGrid** - SMS/Email notifications
- **Mapbox** - Maps and geocoding

---

## ⚙️ Setup Instructions

### **Prerequisites:**
- Node.js 18+
- npm 9+
- Supabase CLI
- Git
- Stripe account
- Mapbox account

### **Step 1: Clone Repository**
```bash
git clone https://github.com/shataken-source/gulf-coast--charters-ai-team.git
cd gulf-coast--charters-ai-team
```

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Environment Variables**
Copy `.env.example` to `.env.local` and fill in your keys:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.ey...

# Email (SendGrid or SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
SMTP_FROM=noreply@gulfcoastcharters.com

# OpenAI (for Fishy chatbot)
OPENAI_API_KEY=sk-...

# Pusher (real-time)
NEXT_PUBLIC_PUSHER_APP_KEY=your_app_key
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=us2
```

### **Step 4: Database Setup**
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push database schema
supabase db push

# Or run migrations manually
psql $DATABASE_URL < database/schemas/complete-schema.sql
```

### **Step 5: Deploy Edge Functions**
```bash
# Deploy all functions
supabase functions deploy weather-alerts
supabase functions deploy cron-dispatcher
supabase functions deploy push-notifications

# Or deploy all at once
npm run functions:deploy
```

### **Step 6: Run Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 🗄️ Database Schema

### **Core Tables:**
- `users` - User accounts (extends Supabase auth)
- `captains` - Captain profiles with USCG verification
- `charters` - Trip listings
- `bookings` - Reservations
- `reviews` - Customer reviews

### **Features:**
- `weather_alerts` - NOAA weather notifications
- `user_points` - Gamification system
- `tournaments` - Fishing competitions
- `messages` - Real-time chat
- `notifications` - Push notifications
- `cron_jobs` - Scheduled tasks

### **Key Features:**
- ✅ Row Level Security (RLS) enabled
- ✅ PostGIS for geospatial queries
- ✅ Automated triggers (updated_at, ratings)
- ✅ Functions for points, ratings, calculations
- ✅ Comprehensive indexes for performance

---

## 🚀 Deployment

### **Vercel (Recommended):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### **Environment Variables on Vercel:**
Add all `.env` variables in Vercel dashboard → Settings → Environment Variables

### **Database:**
- Already hosted on Supabase
- Edge Functions auto-deployed via Supabase CLI

### **Cron Jobs:**
Configure in Supabase dashboard or use pg_cron:
```sql
SELECT cron.schedule('weather-alerts', '0 * * * *', 'SELECT public.run_weather_alerts()');
```

---

## 📱 Features Deep Dive

### **1. Weather Alerts System**
- Hourly check of NOAA buoy data
- Alerts sent 24 hours before trips
- Email + SMS notifications
- Wind, wave, pressure analysis
- Automatic safety recommendations

**Files:**
- `api/weather-alerts.js`
- `database/migrations/005_weather_alerts.sql`

### **2. Community Points & Gamification**
- Points for bookings, reviews, referrals
- 20+ badges to unlock
- 5 trust levels (New → Legend)
- Streak tracking
- Leaderboards (daily, weekly, monthly, all-time)

**Files:**
- `api/community-points-system.js`
- Points auto-awarded via triggers

### **3. Real-Time Messaging**
- Direct messages between customers & captains
- Group chats for tournament teams
- Read receipts
- Typing indicators
- File sharing support

**Files:**
- `components/InstantMessagingSystem.jsx`
- WebSocket via Pusher

### **4. Fishing Tournaments**
- Create public or private tournaments
- Entry fees & prize pools
- Live leaderboards
- Photo verification
- Push notifications for updates

**Files:**
- `components/FishingTournamentSystem.jsx`
- `api/push-notifications-api.js`

### **5. Location Sharing**
- Real-time GPS tracking
- Privacy modes (public, friends, captain-only, private)
- Pin favorite spots
- Share trip routes

**Files:**
- `components/LocationSharing.jsx`
- Mapbox GL integration

### **6. Payment Processing**
- Stripe Connect for captain payouts
- 85% commission to captains (15% platform fee)
- Automatic splits
- Refund handling
- Secure checkout

**Files:**
- `api/stripe-captain-integration.js`
- `api/captain-payment-routes.js`

---

## 🔐 Security

### **Authentication:**
- Supabase Auth (email, Google, Apple)
- JWT tokens
- Row Level Security (RLS)

### **Payment Security:**
- PCI DSS compliant (via Stripe)
- No credit card data stored
- Stripe Connect for payouts

### **Data Protection:**
- HTTPS only
- Environment variables for secrets
- SQL injection protection (parameterized queries)
- XSS protection (React escapes by default)

### **USCG License Verification:**
- Manual review process
- Document upload required
- Verified badge on profiles

---

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm test -- --coverage
```

---

## 📊 Analytics & Monitoring

### **Metrics Tracked:**
- Booking conversion rate
- Average booking value
- Captain retention rate
- Customer satisfaction (NPS)
- Weather alert accuracy
- Tournament participation

### **Tools:**
- Supabase Analytics (queries, auth)
- Stripe Dashboard (payments, revenue)
- Custom admin panel (all metrics)

---

## 🛠️ Admin Panel

Access at `/admin` (requires admin role)

**Features:**
- Cron job management
- User moderation
- Captain verification
- Revenue analytics
- System health monitoring
- Database backups

**Files:**
- `components/AdminConfiguration.jsx`
- `components/CronAdminPanel.jsx`

---

## 🗺️ Roadmap

### **Phase 1: MVP (Q1 2026)** ✅
- Core booking system
- Payment processing
- Weather alerts
- Basic gamification

### **Phase 2: Growth (Q2 2026)**
- Tournaments
- Advanced messaging
- Mobile app (PWA)
- Captain analytics

### **Phase 3: Scale (Q3-Q4 2026)**
- AI fish identification
- Marketplace (tackle, licenses)
- Corporate bookings
- API for partners

---

## 💰 Business Metrics

### **Target Revenue (Years 1-5):**
- Year 1: $3M
- Year 2: $12M
- Year 3: $27M
- Year 4: $41M
- Year 5: $53M

### **Revenue Streams:**
1. Booking commissions (15%)
2. Captain Pro subscriptions ($49/mo)
3. Premium customer features ($9/mo)
4. Tournament fees (10% of entry/prize pool)
5. Affiliate sales (tackle, gear)
6. Data licensing (B2B)
7. Advertising (targeted)
8. Captain training courses
9. Corporate packages
10. Insurance referrals

---

## 🤝 Contributing

This is a private commercial project. 

**For internal team:**
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit PR
5. Code review required
6. Merge to main

---

## 📄 License

**PROPRIETARY** - All rights reserved

© 2025 Gulf Coast Charters  
Created by Jason Cochran

---

## 📞 Support

**For Business Inquiries:**
- Email: jason@gulfcoastcharters.com
- Legal: Navid (lawyer)

**For Technical Support:**
- Check documentation in `/docs` folder
- Review implementation guides
- Contact technical lead

---

## 🎯 Quick Start Checklist

- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Set up `.env.local` with all keys
- [ ] Push database schema to Supabase
- [ ] Deploy Edge Functions
- [ ] Run dev server (`npm run dev`)
- [ ] Test core features (booking, weather, payments)
- [ ] Deploy to Vercel
- [ ] Configure domain
- [ ] Set up monitoring
- [ ] Launch! 🚀

---

## 📚 Additional Documentation

- [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Week-by-week build plan
- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production deployment steps
- [File Manifest](./FILE_MANIFEST.md) - All files and their locations

---

**Built with ❤️ for Gulf Coast captains and anglers**

🎣 **Tight lines!** 🎣
