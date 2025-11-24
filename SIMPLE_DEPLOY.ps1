# SUPER SIMPLE DEPLOYMENT SCRIPT
# No fancy features, just works!

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "     GULF COAST CHARTERS - SIMPLE DEPLOY" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Step 1: Login
Write-Host "STEP 1: Vercel Login" -ForegroundColor Yellow
Write-Host "A browser window will open for you to login.`n" -ForegroundColor White

# Just run vercel login normally
vercel login

Write-Host "`n================================================`n" -ForegroundColor Cyan

# Step 2: Deploy
Write-Host "STEP 2: Deploying to Production" -ForegroundColor Yellow
Write-Host "This will take 2-3 minutes...`n" -ForegroundColor White

# Deploy with automatic yes to prompts
vercel --prod --yes

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "     DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "================================================`n" -ForegroundColor Cyan

Write-Host "IMPORTANT - ADD ENVIRONMENT VARIABLES:" -ForegroundColor Yellow
Write-Host "`n1. Go to: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host "2. Select your project" -ForegroundColor White
Write-Host "3. Settings → Environment Variables" -ForegroundColor White
Write-Host "4. Add these 3 variables:`n" -ForegroundColor White

Write-Host "   Variable 1: NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Cyan
Write-Host "   Value: https://rdbuwyefbgnbuhmjrizo.supabase.co`n" -ForegroundColor White

Write-Host "   Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Cyan
Write-Host "   Value: Get from Supabase (see below)`n" -ForegroundColor White

Write-Host "   Variable 3: SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Cyan
Write-Host "   Value: Get from Supabase (see below)`n" -ForegroundColor White

Write-Host "5. Get Supabase keys from:" -ForegroundColor Yellow
Write-Host "   https://supabase.com/dashboard/project/rdbuwyefbgnbuhmjrizo/settings/api`n" -ForegroundColor Cyan

Write-Host "6. After adding variables, redeploy:" -ForegroundColor Yellow
Write-Host "   vercel --prod`n" -ForegroundColor White

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
