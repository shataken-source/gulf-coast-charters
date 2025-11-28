# 💾 GOOGLE DRIVE AUTO-BACKUP SETUP

## 🎯 GOAL
Automatically backup your Gulf Coast Charters repo to Google Drive daily.

---

## 📋 OPTION 1: MANUAL BACKUP (SIMPLE - START WITH THIS)

### **Windows (PowerShell Script):**

Create file: `backup-to-drive.ps1`

```powershell
# Gulf Coast Charters - Daily Backup Script
# Run this daily or after major changes

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$sourcePath = "C:\Users\YourUsername\Documents\GitHub\gulf-coast--charters-ai-team"
$backupName = "GCC_Backup_$timestamp.zip"
$desktopPath = "$env:USERPROFILE\Desktop\$backupName"

Write-Host "Creating backup..." -ForegroundColor Green

# Compress entire repo
Compress-Archive -Path $sourcePath -DestinationPath $desktopPath -Force

Write-Host "Backup created: $backupName" -ForegroundColor Green
Write-Host "Now drag this file to your Google Drive!" -ForegroundColor Yellow
Write-Host "Location: Desktop" -ForegroundColor Yellow

# Open Desktop folder
Start-Process "explorer.exe" "$env:USERPROFILE\Desktop"
```

**How to use:**
1. Save as `backup-to-drive.ps1` in your repo folder
2. Right-click → "Run with PowerShell"
3. Drag the ZIP file to Google Drive folder
4. Done!

---

## 📋 OPTION 2: GOOGLE DRIVE DESKTOP AUTO-SYNC (RECOMMENDED)

### **Setup Steps:**

1. **Install Google Drive for Desktop:**
   - Download: https://www.google.com/drive/download/
   - Install and login

2. **Configure Sync Folder:**
   - Open Google Drive app
   - Settings → Preferences
   - Add folder: `C:\Users\You\Documents\GitHub\gulf-coast--charters-ai-team`
   - Choose "Mirror files" (2-way sync)

3. **Exclude Sensitive Folders:**
   - Right-click repo folder → Google Drive → Don't sync
   - Select: `node_modules/`, `.next/`, `_PRIVATE/` (sync separately)

4. **Manual Sync for _PRIVATE/:**
   - Create separate Google Drive folder: "GCC - Private Files"
   - Manually copy _PRIVATE/ folder there when updated
   - DO NOT auto-sync secrets!

### **Result:**
- Code auto-syncs to Google Drive
- Secrets stay local (protected)
- Always have cloud backup
- Access from any device

---

## 📋 OPTION 3: AUTOMATED BACKUP SCRIPT (ADVANCED)

### **Windows Task Scheduler + PowerShell:**

Create file: `auto-backup.ps1`

```powershell
# Automated Daily Backup to Google Drive

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$date = Get-Date -Format "yyyyMMdd"
$sourcePath = "C:\Users\YourUsername\Documents\GitHub\gulf-coast--charters-ai-team"
$googleDrivePath = "G:\My Drive\Gulf Coast Backups"  # Adjust to your Google Drive path
$backupName = "GCC_Backup_$date.zip"
$backupPath = "$googleDrivePath\$backupName"

# Create log directory if it doesn't exist
$logPath = "$sourcePath\_PRIVATE\backup-logs"
if (-not (Test-Path $logPath)) {
    New-Item -ItemType Directory -Path $logPath | Out-Null
}

$logFile = "$logPath\backup_$timestamp.log"

function Write-Log {
    param($Message)
    $logMessage = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message"
    Write-Host $logMessage
    Add-Content -Path $logFile -Value $logMessage
}

try {
    Write-Log "Starting backup..."
    
    # Check if source exists
    if (-not (Test-Path $sourcePath)) {
        Write-Log "ERROR: Source path not found: $sourcePath"
        exit 1
    }
    
    # Check if Google Drive is accessible
    if (-not (Test-Path $googleDrivePath)) {
        Write-Log "ERROR: Google Drive path not found: $googleDrivePath"
        Write-Log "Make sure Google Drive for Desktop is running"
        exit 1
    }
    
    # Delete old backup if exists (keep only latest)
    if (Test-Path $backupPath) {
        Write-Log "Removing old backup..."
        Remove-Item $backupPath -Force
    }
    
    # Create new backup
    Write-Log "Creating backup archive..."
    Compress-Archive -Path $sourcePath -DestinationPath $backupPath -Force
    
    # Verify backup was created
    if (Test-Path $backupPath) {
        $backupSize = (Get-Item $backupPath).Length / 1MB
        Write-Log "SUCCESS: Backup created ($([math]::Round($backupSize, 2)) MB)"
        Write-Log "Location: $backupPath"
        
        # Keep last 7 days of backups
        $oldBackups = Get-ChildItem $googleDrivePath -Filter "GCC_Backup_*.zip" | 
                      Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) }
        
        if ($oldBackups) {
            Write-Log "Cleaning up old backups (>7 days)..."
            $oldBackups | ForEach-Object {
                Write-Log "Deleting: $($_.Name)"
                Remove-Item $_.FullName -Force
            }
        }
        
        Write-Log "Backup complete!"
    } else {
        Write-Log "ERROR: Backup file was not created"
        exit 1
    }
    
} catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    exit 1
}
```

**Schedule it:**
1. Open Task Scheduler
2. Create Basic Task
3. Name: "Gulf Coast Daily Backup"
4. Trigger: Daily at 11:59 PM
5. Action: Start a Program
   - Program: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File "C:\path\to\auto-backup.ps1"`
6. Save

**Result:**
- Automatic daily backups
- Keeps last 7 days
- Logs all backups
- Email on failure (optional)

---

## 📋 OPTION 4: GITHUB AS PRIMARY BACKUP (CURRENT)

### **What you're already doing:**
1. Code is in local Git repo ✅
2. Push to GitHub after changes ✅
3. GitHub = cloud backup ✅

### **Add Google Drive as secondary:**
1. Backup _PRIVATE/ folder manually (has secrets)
2. Backup complete repo weekly
3. GitHub has code, Google Drive has secrets

### **Best of both worlds:**
- GitHub: Version control + code backup
- Google Drive: Private files + full project backup
- Local: Working files

---

## ✅ RECOMMENDED SETUP FOR YOU

**Based on your situation:**

1. **GitHub (Primary):**
   - Push code daily
   - Version controlled
   - Accessible anywhere

2. **Google Drive (Secondary):**
   - Manual backup of _PRIVATE/ folder
   - Weekly full project backup
   - Contains API keys, secrets, legal docs

3. **Local External Drive (Tertiary):**
   - Monthly full backup
   - In case both cloud services fail
   - Physical possession

---

## 🚀 QUICK START CHECKLIST

**Do This Now:**
- [ ] Install Google Drive for Desktop
- [ ] Create folder: "Gulf Coast Charters - Backups"
- [ ] Copy _PRIVATE/ folder there
- [ ] Create backup-to-drive.ps1 script
- [ ] Test manual backup once
- [ ] Set reminder: "Weekly Google Drive backup"

**Later (Optional):**
- [ ] Set up auto-backup script
- [ ] Configure Task Scheduler
- [ ] Test automated backup
- [ ] Verify backups work

---

## 📊 BACKUP STRATEGY SUMMARY

| Location | What | How Often | Why |
|----------|------|-----------|-----|
| GitHub | Code only | After every session | Version control |
| Google Drive | Everything | Weekly | Cloud backup |
| External Drive | Everything | Monthly | Physical backup |
| _PRIVATE/ to GDrive | Secrets | After changes | Separate from code |

---

## 🔒 SECURITY NOTES

**NEVER sync to Google Drive:**
- .env files
- node_modules/
- Build folders (.next/, dist/)
- Database dumps with real data

**ALWAYS keep separate:**
- _PRIVATE/ folder (manual sync only)
- API keys
- Passwords
- Legal documents with sensitive info

---

## 💡 PRO TIPS

1. **Label your backups:**
   - Daily: `GCC_Daily_20251128.zip`
   - Before major changes: `GCC_Before_Navid_Meeting.zip`
   - Milestones: `GCC_v1.0_Launch_Ready.zip`

2. **Verify backups work:**
   - Once a month, try restoring from backup
   - Make sure you can actually recover files

3. **Keep multiple versions:**
   - Don't overwrite old backups immediately
   - Keep at least 3-7 days of history

---

**BACKUP CREATED!**

You now have:
- ✅ Backup scripts ready
- ✅ Google Drive strategy
- ✅ Security plan
- ✅ Multiple redundancy

🎣 **YOUR DATA IS SAFE!** 🎣
