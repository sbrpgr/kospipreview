param(
  [switch]$SkipCommit,
  [switch]$SkipWorkflow,
  [switch]$NoPause
)

$ErrorActionPreference = "Stop"

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Command,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
  )

  Write-Host "[news] $Command $($Arguments -join ' ')"
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed ($LASTEXITCODE): $Command $($Arguments -join ' ')"
  }
}

function Invoke-GitQuiet {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  & git @Arguments | Out-Null
  return $LASTEXITCODE
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$workflowName = "publish-youtube-news.yml"
$now = Get-Date -Format "yyyy-MM-dd HH:mm"

try {
  Set-Location $repoRoot

  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git command not found."
  }

  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "gh command not found. Install GitHub CLI and login first."
  }

  if (-not (Test-Path (Join-Path $repoRoot "news"))) {
    throw "news directory not found: $repoRoot\news"
  }

  Push-Location (Join-Path $repoRoot "frontend")
  try {
    Invoke-CheckedCommand "npm.cmd" "run" "sync-news"
  }
  finally {
    Pop-Location
  }

  if (-not $SkipCommit) {
    Invoke-CheckedCommand "git" "pull" "--rebase" "--autostash" "origin" "main"
    Invoke-CheckedCommand "git" "add" "--" ":(glob)news/**/digest_db.json"

    $diffExitCode = Invoke-GitQuiet @("diff", "--cached", "--quiet")
    if ($diffExitCode -eq 0) {
      Write-Host "[news] No new digest_db.json changes to commit."
    }
    elseif ($diffExitCode -eq 1) {
      Invoke-CheckedCommand "git" "commit" "-m" "chore: publish youtube news $now"
      Invoke-CheckedCommand "git" "push" "origin" "main"
    }
    else {
      throw "git diff --cached failed ($diffExitCode)."
    }
  }

  if (-not $SkipWorkflow) {
    $workflowOutput = & gh workflow run $workflowName --ref main 2>&1
    if ($LASTEXITCODE -ne 0) {
      $workflowOutput | Write-Host
      throw "Failed to trigger $workflowName."
    }

    $workflowText = ($workflowOutput | Out-String).Trim()
    if ($workflowText) {
      Write-Host $workflowText
    }

    $runId = $null
    $match = [regex]::Match($workflowText, "/actions/runs/(\d+)")
    if ($match.Success) {
      $runId = $match.Groups[1].Value
    }

    if (-not $runId) {
      Start-Sleep -Seconds 5
      $runId = (& gh run list --workflow $workflowName --branch main --limit 1 --json databaseId --jq ".[0].databaseId").Trim()
    }

    if (-not $runId) {
      throw "Could not resolve GitHub Actions run id."
    }

    Invoke-CheckedCommand "gh" "run" "watch" $runId "--exit-status"

    Start-Sleep -Seconds 20
    $response = Invoke-WebRequest -Uri "https://kospipreview.com/api/news/youtube-news.json" -Headers @{ "Cache-Control" = "no-cache" } -UseBasicParsing
    $payload = $response.Content | ConvertFrom-Json
    $source = $response.Headers["X-Kospi-News-Source"]
    Write-Host "[news] Published. API status=$($response.StatusCode), source=$source, items=$(@($payload.latestItems).Count), reports=$(@($payload.reports).Count)"
    if ($source -ne "bucket") {
      throw "News publish verification failed: expected source=bucket, got source=$source"
    }
    Write-Host "[news] Home shows latest 10. Full board: https://kospipreview.com/youtube-news"
  }

  Write-Host "[news] Done."
}
catch {
  Write-Error $_
  exit 1
}
finally {
  if (-not $NoPause -and $Host.Name -eq "ConsoleHost") {
    Write-Host ""
    Write-Host "Press Enter to close..."
    [void][System.Console]::ReadLine()
  }
}
