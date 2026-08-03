param(
    [switch]$Force
)

# Git Checks
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-Error "Git is not installed or not in system PATH."; exit 1 }
if ((git rev-parse --is-inside-work-tree 2>$null) -ne "true") { Write-Error "This folder is not a Git repository. Run 'git init'."; exit 1 }
if (-not (git remote get-url origin 2>$null)) { Write-Error "No remote repository 'origin' configured."; exit 1 }
git ls-remote origin -h HEAD >$null 2>&1; if ($LASTEXITCODE -ne 0) { Write-Error "Cannot connect to the remote repository."; exit 1 }

if ($Force) {
    Write-Host "=== FORCE PULLING FROM GITHUB ===" -ForegroundColor Red
    Write-Host "Fetching from GitHub..."
    git fetch origin main
    git reset --hard origin/main
    Write-Host "Total files received from GitHub: All files (Force pull)" -ForegroundColor Cyan
    Write-Host "Total files sent to GitHub: 0" -ForegroundColor Cyan
    Write-Host "Local folder overwritten successfully!" -ForegroundColor Green
    exit 0
}

Write-Host "=== INCOMING SYNCHRONIZATION (PULL) ===" -ForegroundColor Cyan

# The commit both sides last agreed on. These scripts always finish by
# fast-forwarding local HEAD to origin/main (see the `git reset origin/main`
# below and the matching line in Sync-Push.ps1), so the pre-fetch HEAD is
# exactly that last common point.
$baseRef = git rev-parse HEAD

Write-Host "Fetching from GitHub..."
git fetch origin main

# Returns a map of path -> status ('A' added, 'D' deleted, 'M' modified)
# between $baseRef and $Target, so a deletion is never confused with "older
# content" the way a plain last-write-time comparison would (a missing file
# has no timestamp, so it always used to lose that comparison and get
# silently resurrected — that was the bug this replaces).
function Get-StatusMap([string]$Target) {
    $map = @{}
    if ($Target) { $diffArgs = @($baseRef, $Target) } else { $diffArgs = @($baseRef) }
    foreach ($line in (git diff --name-status @diffArgs)) {
        if ($line -match "^(\w)\s+(.+)$") { $map[$matches[2]] = $matches[1] }
    }
    return $map
}

$remoteChanges = Get-StatusMap "origin/main"   # what the remote did since $baseRef
$localChanges = Get-StatusMap $null             # what's uncommitted locally since $baseRef

$allFiles = @($remoteChanges.Keys) + @($localChanges.Keys) | Select-Object -Unique
$updatedCount = 0

foreach ($file in $allFiles) {
    $remoteStatus = $remoteChanges[$file]
    $localStatus = $localChanges[$file]

    if ($localStatus -eq 'D') {
        # Deleted locally since the last sync: never bring it back just
        # because the remote still has an (unrelated, older) copy.
        Write-Host "  -> [PRESERVE] Local deletion kept: $file" -ForegroundColor Green
        continue
    }
    if ($remoteStatus -eq 'D') {
        # Deleted upstream since the last sync and untouched here: apply it.
        if (Test-Path $file) {
            Write-Host "  -> [DELETE] Removed upstream: $file" -ForegroundColor Yellow
            Remove-Item -Force $file
            $updatedCount++
        }
        continue
    }
    if (-not $remoteStatus) { continue } # remote didn't touch this file — nothing to pull

    # Both sides touched the same existing file (not a deletion on either
    # side): fall back to the previous last-write-wins heuristic.
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

# Align Git history. This only moves HEAD/index to origin/main — the working
# tree deletions/imports handled above are left exactly as decided.
git reset origin/main
Write-Host "Total files received from GitHub: $updatedCount" -ForegroundColor Cyan
Write-Host "Total files sent to GitHub: 0" -ForegroundColor Cyan
Write-Host "Synchronization completed successfully!" -ForegroundColor Green
