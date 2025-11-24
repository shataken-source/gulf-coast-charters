# Weather Alerts Cron - Windows Installer
$ErrorActionPreference = "Stop"

function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Progress { Write-Host "▶ $args" -ForegroundColor Blue }
function Write-Warning { Write-Host "⚠ $args" -ForegroundColor Yellow }

Clear-Host
Write-Host "🌊 WEATHER ALERTS CRON - WINDOWS INSTALLER 🎣" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Progress "Checking dependencies..."
try {
    $nodeVersion = node --version 2>$null
    Write-Success "Node.js found: $nodeVersion"
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "Please install from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check/Install Supabase CLI
Write-Progress "Checking Supabase CLI..."
try {
    $supabaseVersion = supabase --version 2>$null
    Write-Success "Supabase CLI found"
} catch {
    Write-Progress "Installing Supabase CLI..."
    npm install -g supabase
    Write-Success "Supabase CLI installed"
}

# Get project info
Write-Host ""
Write-Host "Enter your Supabase project info:" -ForegroundColor Yellow
$PROJECT_REF = Read-Host "Project Reference ID"
$SUPABASE_URL = Read-Host "Project URL (https://xxx.supabase.co)"
$SERVICE_KEY = Read-Host "Service Role Key"
$DB_PASSWORD = Read-Host "Database Password" -AsSecureString
$DB_PASSWORD_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))

# Get SendGrid info
Write-Host ""
Write-Host "SendGrid Configuration:" -ForegroundColor Yellow
$SENDGRID_KEY = Read-Host "SendGrid API Key (SG.xxx)"
$FROM_EMAIL = Read-Host "From Email Address"

Write-Host ""
Write-Host "Configuring secrets..." -ForegroundColor Blue

supabase secrets set SMTP_HOST=smtp.sendgrid.net --project-ref $PROJECT_REF
supabase secrets set SMTP_PORT=587 --project-ref $PROJECT_REF
supabase secrets set SMTP_USER=apikey --project-ref $PROJECT_REF
supabase secrets set "SMTP_PASSWORD=$SENDGRID_KEY" --project-ref $PROJECT_REF
supabase secrets set "SMTP_FROM=$FROM_EMAIL" --project-ref $PROJECT_REF
supabase secrets set "SUPABASE_URL=$SUPABASE_URL" --project-ref $PROJECT_REF
supabase secrets set "SUPABASE_SERVICE_KEY=$SERVICE_KEY" --project-ref $PROJECT_REF

Write-Success "Environment variables configured!"

Write-Host ""
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Create database tables (run SQL from GitHub repo)"
Write-Host "2. Deploy edge function"
Write-Host "3. Verify sender email in SendGrid"
Write-Host ""
Read-Host "Press Enter to exit"
