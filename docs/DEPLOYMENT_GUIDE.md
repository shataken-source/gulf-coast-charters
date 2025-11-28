# 🚀 DEPLOYMENT GUIDE

## Prerequisites
- Vercel account
- Supabase project (production)
- All environment variables configured

## Steps

### 1. Deploy to Vercel
\`\`\`bash
vercel --prod
\`\`\`

### 2. Configure Environment Variables
Add all variables from .env.example in Vercel dashboard

### 3. Deploy Database
\`\`\`bash
supabase db push
\`\`\`

### 4. Deploy Edge Functions
\`\`\`bash
supabase functions deploy --project-ref your-ref
\`\`\`

### 5. Configure Custom Domain
- Add domain in Vercel
- Update DNS records
- Enable SSL

### 6. Test Production
- Test booking flow
- Verify payments
- Check weather alerts
- Test all features

## Post-Deployment
- Monitor error logs (Sentry)
- Check analytics
- Monitor performance
- Set up alerts

Complete!
