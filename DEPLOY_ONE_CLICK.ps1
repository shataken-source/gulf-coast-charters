# ONE-CLICK VERCEL DEPLOYMENT SCRIPT
# Run this once and it handles everything

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  GULF COAST CHARTERS - ONE-CLICK DEPLOY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Vercel CLI is installed
Write-Host "Checking Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "✗ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    Write-Host "✓ Vercel CLI installed`n" -ForegroundColor Green
} else {
    Write-Host "✓ Vercel CLI already installed`n" -ForegroundColor Green
}

# Open Vercel login in browser automatically
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STEP 1: AUTHENTICATE WITH VERCEL" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Opening Vercel authentication in your browser..." -ForegroundColor Yellow
Write-Host "Please complete the login in your browser.`n" -ForegroundColor Yellow

# Start vercel login and capture the URL
$vercelProcess = Start-Process -FilePath "vercel" -ArgumentList "login" -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\vercel_output.txt" -RedirectStandardError "$env:TEMP\vercel_error.txt"

# Wait a moment for the URL to be generated
Start-Sleep -Seconds 3

# Try to read the URL from the output
$output = Get-Content "$env:TEMP\vercel_output.txt" -Raw -ErrorAction SilentlyContinue
$pattern = 'https://vercel\.com/oauth/device\?user_code=[A-Z0-9\-]+'
if ($output -match $pattern) {
    $authUrl = $matches[0]
    Write-Host "Authentication URL: $authUrl`n" -ForegroundColor Cyan
    
    # Open in default browser
    Start-Process $authUrl
    
    Write-Host "✓ Browser opened with authentication page" -ForegroundColor Green
    Write-Host "`nPlease complete authentication in your browser..." -ForegroundColor Yellow
    Write-Host "This window will continue automatically once you're authenticated.`n" -ForegroundColor Yellow
} else {
    Write-Host "⚠ Could not auto-open browser. Please check terminal for login instructions." -ForegroundColor Yellow
}

# Wait for authentication to complete
Write-Host "Waiting for authentication" -NoNewline
$timeout = 300 # 5 minutes timeout
$elapsed = 0
while (-not $vercelProcess.HasExited -and $elapsed -lt $timeout) {
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 5
    $elapsed += 5
}
Write-Host ""

if ($vercelProcess.HasExited -and $vercelProcess.ExitCode -eq 0) {
    Write-Host "✓ Authentication successful!`n" -ForegroundColor Green
} else {
    Write-Host "✗ Authentication timed out or failed." -ForegroundColor Red
    Write-Host "Please run 'vercel login' manually in a separate terminal." -ForegroundColor Yellow
    Write-Host "`nPress any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Deploy to Vercel
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  STEP 2: DEPLOYING TO PRODUCTION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Starting deployment to Vercel..." -ForegroundColor Yellow
Write-Host "This may take 2-3 minutes...`n" -ForegroundColor Yellow

# Run vercel deploy with automatic confirmations
$env:VERCEL_PROJECT_NAME = "gulf-coast-charters"
vercel --prod --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  NEXT STEPS" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "1. Your site is now LIVE!" -ForegroundColor Green
    Write-Host "   Check the URL above to access it.`n"
    
    Write-Host "2. ADD ENVIRONMENT VARIABLES (Required!):" -ForegroundColor Yellow
    Write-Host "   - Go to: https://vercel.com/dashboard" -ForegroundColor Cyan
    Write-Host "   - Select your project"
    Write-Host "   - Settings → Environment Variables"
    Write-Host "   - Add these 3 variables:`n"
    
    Write-Host "   NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Cyan
    Write-Host "   Value: https://rdbuwyefbgnbuhmjrizo.supabase.co`n"
    
    Write-Host "   NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Cyan
    Write-Host "   Value: [Get from Supabase Dashboard]`n"
    
    Write-Host "   SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Cyan
    Write-Host "   Value: [Get from Supabase Dashboard]`n"
    
    Write-Host "3. Get Supabase keys:" -ForegroundColor Yellow
    Write-Host "   https://supabase.com/dashboard/project/rdbuwyefbgnbuhmjrizo/settings/api`n" -ForegroundColor Cyan
    
    Write-Host "4. After adding variables, redeploy:" -ForegroundColor Yellow
    Write-Host "   vercel --prod`n"
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    
} else {
    Write-Host "`n✗ DEPLOYMENT FAILED" -ForegroundColor Red
    Write-Host "Check the error messages above for details.`n" -ForegroundColor Yellow
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "1. Run 'npm install' first"
    Write-Host "2. Make sure you're in the correct directory"
    Write-Host "3. Check that package.json exists`n"
}

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
