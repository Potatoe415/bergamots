param(
    [switch]$Force
)

# Git Checks
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-Error "Git is not installed or not in system PATH."; exit 1 }
if ((git rev-parse --is-inside-work-tree 2>$null) -ne "true") { Write-Error "This folder is not a Git repository. Run 'git init'."; exit 1 }
if (-not (git remote get-url origin 2>$null)) { Write-Error "No remote repository 'origin' configured."; exit 1 }
git ls-remote origin -h HEAD >$null 2>&1; if ($LASTEXITCODE -ne 0) { Write-Error "Cannot connect to the remote repository."; exit 1 }

if ($Force) {
    Write-Host "=== FORCE PUSHING TO GITHUB ===" -ForegroundColor Red
    git add -A
    git commit -m "Sync from $env:COMPUTERNAME ($env:USERNAME) [FORCE]" >$null 2>&1
    git push -f origin main
    Write-Host "Total files received from GitHub: 0 (Force push)" -ForegroundColor Cyan
    Write-Host "Total files sent to GitHub: All local files (Force push)" -ForegroundColor Cyan
    Write-Host "GitHub overwritten successfully!" -ForegroundColor Green
    exit 0
}

Write-Host "=== OUTGOING SYNCHRONIZATION (PUSH) ===" -ForegroundColor Cyan

# The commit both sides last agreed on, captured before this run's own
# commit/fetch move HEAD (see Sync-Pull.ps1 for the same assumption).
$baseRef = git rev-parse HEAD

# Add and commit locally first, so local deletions are captured as real 'D'
# entries in git history instead of just "file missing from disk".
git add -A
git commit -m "Sync from $env:COMPUTERNAME ($env:USERNAME)"

# Fetch remote state
git fetch origin main

# Returns a map of path -> status ('A' added, 'D' deleted, 'M' modified)
# between $baseRef and $Target.
function Get-StatusMap([string]$Target) {
    $map = @{}
    foreach ($line in (git diff --name-status $baseRef $Target)) {
        if ($line -match "^(\w)\s+(.+)$") { $map[$matches[2]] = $matches[1] }
    }
    return $map
}

$remoteChanges = Get-StatusMap "origin/main"  # what another machine pushed since $baseRef
$localChanges = Get-StatusMap "HEAD"           # what this push just committed since $baseRef

# If another machine pushed in the meantime, resolve by merging changes —
# but never let a file this machine intentionally deleted get resurrected
# just because it still exists, unmodified, on the remote (that silent
# resurrection was the bug that broke the client/socket.ts removal earlier).
$allFiles = @($remoteChanges.Keys) + @($localChanges.Keys) | Select-Object -Unique
$divergentUpdates = 0

foreach ($file in $allFiles) {
    $remoteStatus = $remoteChanges[$file]
    $localStatus = $localChanges[$file]

    if (-not $remoteStatus) { continue }   # remote didn't touch it since $baseRef
    if ($localStatus -eq 'D') { continue } # we just deleted it — keep it deleted

    if ($remoteStatus -eq 'D' -and -not $localStatus) {
        # Deleted on the remote by someone else, untouched here: apply it.
        if (Test-Path $file) {
            Write-Host "  -> [IMPORT] Removed upstream: $file" -ForegroundColor Yellow
            Remove-Item -Force $file
        }
        $divergentUpdates++
        continue
    }

    # Both sides touched the same existing file (not a deletion on either
    # side): fall back to the previous last-write-wins heuristic.
    $localTime = if (Test-Path $file) { (Get-Item $file).LastWriteTimeUtc } else { [DateTime]::MinValue }
    $remoteTimeRaw = git log -1 --format=%cI origin/main -- $file
    $remoteTime = if ($remoteTimeRaw) { [DateTimeOffset]::Parse($remoteTimeRaw).UtcDateTime } else { [DateTime]::MinValue }

    if ($remoteTime -gt $localTime) {
        Write-Host "  -> [IMPORT] Remote is newer: $file" -ForegroundColor Yellow
        git checkout origin/main -- $file
        $divergentUpdates++
    }
}

# Realign and push
git reset origin/main
git add -A
git commit -m "Sync from $env:COMPUTERNAME ($env:USERNAME) (date resolved)" >$null 2>&1

$pushedCount = (git diff --name-only origin/main..HEAD | Where-Object { $_ -ne "" }).Count
git push origin main

Write-Host "Total files received from GitHub: $divergentUpdates" -ForegroundColor Cyan
Write-Host "Total files sent to GitHub: $pushedCount" -ForegroundColor Cyan
Write-Host "Changes pushed successfully!" -ForegroundColor Green
