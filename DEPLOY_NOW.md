# 🚀 QUICK PRODUCTION DEPLOYMENT GUIDE

**Estimated Time:** 15 minutes  
**Your App:** Gulf Coast Charters Platform

---

## ✅ PRE-FLIGHT CHECKLIST

Before deploying, verify you have:
- [x] Supabase project: `rdbuwyefbgnbuhmjrizo`
- [ ] Supabase credentials ready
- [ ] GitHub account (for Vercel deployment)
- [ ] Domain name (optional, can use free Vercel domain)

---

## 🎯 OPTION 1: DEPLOY WITH VERCEL (RECOMMENDED - 10 MIN)

Vercel is optimized for Next.js and offers the smoothest deployment.

### Step 1: Install Vercel CLI

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Verify installation
vercel --version
```

### Step 2: Login to Vercel

```powershell
# Login to Vercel
vercel login

# Follow the browser prompt to authenticate
```

### Step 3: Deploy

```powershell
# Navigate to your project (if not already there)
cd c:\gcc\charter-booking-platform

# Deploy to production
vercel --prod
```

**During deployment, Vercel will ask:**

1. **Set up and deploy?** → YES
2. **Which scope?** → Select your account
3. **Link to existing project?** → NO (first time) or YES (redeployment)
4. **Project name?** → `gulf-coast-charters` (or your preference)
5. **Directory?** → `.` (current directory)
6. **Override settings?** → NO

### Step 4: Add Environment Variables

After deployment, add your environment variables in Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Select your project → Settings → Environment Variables
3. Add these variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://rdbuwyefbgnbuhmjrizo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-key]
```

**Get your Supabase keys:**
- Go to: https://supabase.com/dashboard/project/rdbuwyefbgnbuhmjrizo/settings/api
- Copy "Project URL" → Use as `NEXT_PUBLIC_SUPABASE_URL`
- Copy "anon public" key → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy "service_role" key → Use as `SUPABASE_SERVICE_ROLE_KEY`

### Step 5: Redeploy with Environment Variables

```powershell
# Trigger a new deployment with the environment variables
vercel --prod
```

### Step 6: Access Your Live Site

Vercel will provide a URL like:
```
https://gulf-coast-charters.vercel.app
```

✅ **Your site is now LIVE!**

---

## 🎯 OPTION 2: DEPLOY WITH NETLIFY (ALTERNATIVE - 15 MIN)

### Step 1: Install Netlify CLI

```powershell
npm install -g netlify-cli

# Verify
netlify --version
```

### Step 2: Login & Deploy

```powershell
# Login to Netlify
netlify login

# Deploy
netlify deploy --prod

# Follow the prompts:
# - Create new site or link existing
# - Choose team
# - Site name: gulf-coast-charters
# - Publish directory: .next
```

### Step 3: Add Environment Variables

1. Go to: https://app.netlify.com
2. Select your site → Site settings → Environment variables
3. Add the same Supabase variables as above

### Step 4: Trigger Rebuild

```powershell
netlify build
netlify deploy --prod
```

---

## 🗄️ DATABASE SETUP (CRITICAL!)

**If you haven't run the database setup yet:**

1. Go to: https://supabase.com/dashboard/project/rdbuwyefbgnbuhmjrizo/sql
2. Click "New Query"
3. Open file: `COMPLETE_DATABASE_SETUP.sql`
4. Copy entire contents
5. Paste into SQL Editor
6. Click "Run" (Ctrl+Enter)
7. Wait ~30 seconds
8. Verify: "DATABASE SETUP COMPLETE!"

---

## 🧪 TEST YOUR DEPLOYMENT

After deployment, test these URLs:

1. **Homepage:** `https://[your-domain].vercel.app`
2. **API Health:** `https://[your-domain].vercel.app/api/health`
3. **Supabase Connection:** Try signing up a user

**Quick Test:**
1. Visit your deployed site
2. Click "Sign Up"
3. Register with email
4. Check if profile is created

---

## 🌐 CUSTOM DOMAIN (OPTIONAL)

### Add Your Own Domain to Vercel

1. Go to: Project → Settings → Domains
2. Add domain: `gulfcoastcharters.com` (your domain)
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-60 minutes)

**DNS Records to Add:**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## 🔧 TROUBLESHOOTING

### Issue: Build Failed

**Check:** 
```powershell
# Test build locally first
npm run build
```

If it fails locally, fix errors before deploying.

### Issue: Environment Variables Not Working

1. Verify variables are set in Vercel/Netlify dashboard
2. Make sure `NEXT_PUBLIC_` prefix is used for client-side variables
3. Redeploy after adding variables

### Issue: Supabase Connection Failed

1. Verify Supabase project is active
2. Check API keys are correct
3. Run database setup SQL if not done

### Issue: Pages Not Loading

Check your browser console (F12) for errors. Common fixes:
- Clear browser cache
- Check Vercel deployment logs
- Verify all dependencies installed

---

## 📊 DEPLOYMENT CHECKLIST

- [ ] Vercel CLI installed
- [ ] Logged into Vercel
- [ ] Project deployed (`vercel --prod`)
- [ ] Environment variables added in dashboard
- [ ] Database setup SQL executed
- [ ] Site accessible via URL
- [ ] Sign up/Login works
- [ ] Custom domain configured (optional)

---

## 🎉 SUCCESS!

If all steps completed:

✅ Your site is **LIVE**: `https://[your-domain].vercel.app`  
✅ Database is **READY**: 21 tables created  
✅ Users can **REGISTER**: Authentication working  
✅ Platform is **PRODUCTION-READY**

---

## 📞 QUICK COMMANDS REFERENCE

```powershell
# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Remove deployment
vercel remove [deployment-url]

# Open project in browser
vercel open
```

---

## 🚀 WHAT'S NEXT?

After deployment:
1. **Test thoroughly:** Sign up, create profiles, test all features
2. **Monitor performance:** Check Vercel Analytics
3. **Add content:** Create test captain profiles
4. **Market your platform:** Share the link!
5. **Collect feedback:** Beta test with real users

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Check `TROUBLESHOOTING_GUIDE.md` for more help

**Your platform is ready for users! 🎣🌊⚓**
