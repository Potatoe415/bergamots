param(
    [switch]$Force
)

# Git Checks
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-Error "Git is not installed or not in system PATH."; exit 1 }
if ((git rev-parse --is-inside-work-tree 2>$null) -ne "true") { Write-Error "This folder is not a Git repository. Run 'git init'."; exit 1 }
if (-not (git remote get-url origin 2>$null)) { Write-Error "No remote repository 'origin' configured."; exit 1 }
git ls-remote origin -h HEAD >$null 2>&1; if ($LASTEXITCODE -ne 0) { Write-Error "Cannot connect to the remote repository."; exit 1 }

$historyFile = Join-Path $PSScriptRoot "SYNC-HISTORY.md"

function Add-SyncHistoryEntry {
    param([string]$Action, [string]$Details)
    if (-not (Test-Path $historyFile)) {
        "# Sync History`n`nFormat: date/heure | action | machine (utilisateur) | details`n" | Set-Content -Path $historyFile -Encoding UTF8
    }
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $who = "$env:COMPUTERNAME ($env:USERNAME)"
    $line = "- $timestamp | $Action | $who | $Details"
    Add-Content -Path $historyFile -Value $line -Encoding UTF8
}

function Publish-SyncHistoryEntry {
    # Commits and pushes ONLY the history file, leaving any other local
    # uncommitted work untouched (that stays for the next Sync-Push).
    git add -- "SYNC-HISTORY.md"
    git commit -m "History: pull by $env:COMPUTERNAME ($env:USERNAME)" >$null 2>&1
    git push origin main 2>&1 | Out-Null
}

if ($Force) {
    Write-Host "=== FORCE PULLING FROM GITHUB ===" -ForegroundColor Red
    Write-Host "Fetching from GitHub..."
    git fetch origin main
    git reset --hard origin/main
    Add-SyncHistoryEntry -Action "PULL [FORCE]" -Details "Local folder overwritten with GitHub state"
    Publish-SyncHistoryEntry
    Write-Host "Total files received from GitHub: All files (Force pull)" -ForegroundColor Cyan
    Write-Host "Total files sent to GitHub: 0" -ForegroundColor Cyan
    Write-Host "Local folder overwritten successfully!" -ForegroundColor Green
    exit 0
}

Write-Host "=== INCOMING SYNCHRONIZATION (PULL) ===" -ForegroundColor Cyan

# Fetch remote state
Write-Host "Fetching from GitHub..."
git fetch origin main

# Compare and overwrite if remote is newer
$diffs = git diff --name-only origin/main | Where-Object { $_ -ne "" }
$updatedCount = 0
foreach ($file in $diffs) {
    $localTime = if (Test-Path $file) { (Get-Item $file).LastWriteTimeUtc } else { [DateTime]::MinValue }
    $remoteTimeRaw = git log -1 --format=%cI origin/main -- $file
    $remoteTime = if ($remoteTimeRaw) { [DateTimeOffset]::Parse($remoteTimeRaw).UtcDateTime } else { [DateTime]::MinValue }

    if ($remoteTime -gt $localTime) {
        Write-Host "  -> [IMPORT] Remote is newer: $file" -ForegroundColor Yellow
        git checkout origin/main -- $file
        $updatedCount++
    } else {
        Write-Host "  -> [PRESERVE] Local is newer: $file" -ForegroundColor Green
    }
}

# Align Git history, log the pull, and publish just that log entry to GitHub
git reset origin/main
Add-SyncHistoryEntry -Action "PULL" -Details "$updatedCount file(s) received"
Publish-SyncHistoryEntry

Write-Host "Total files received from GitHub: $updatedCount" -ForegroundColor Cyan
Write-Host "Total files sent to GitHub: 0" -ForegroundColor Cyan
Write-Host "Synchronization completed successfully!" -ForegroundColor Green