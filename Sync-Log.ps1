# Shared helper dot-sourced by Sync-Push.ps1 and Sync-Pull.ps1.
# Appends a line to GitHistory.txt so you can tell which computer did the last Push/Pull.

function Write-GitHistoryLog {
    param(
        [Parameter(Mandatory)]
        [ValidateSet("PUSH", "PULL")]
        [string]$Action
    )

    $line = "{0} | {1,-4} | {2} | {3}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Action, $env:COMPUTERNAME, $env:USERNAME
    Add-Content -Path (Join-Path $PSScriptRoot "GitHistory.txt") -Value $line
}
