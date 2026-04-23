param(
  [string]$SourceRoot = "",
  [string]$Date = "",
  [switch]$Build,
  [switch]$UploadDynamic,
  [switch]$Deploy,
  [string]$ProjectId = "kospipreview",
  [string]$DynamicBucketName = "kospipreview-live-data",
  [string]$DynamicPrefix = "youtube-news"
)

$ErrorActionPreference = "Stop"

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Command,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
  )

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed ($LASTEXITCODE): $Command $($Arguments -join ' ')"
  }
}

function Resolve-DynamicReportHref {
  param(
    [string]$ReportId,
    [string]$FallbackHref
  )

  if ($ReportId -match '^(?<date>\d{4}-\d{2}-\d{2})-(?<run>[^/]+)$') {
    return "/api/news/reports/$($Matches['date'])/$($Matches['run'])/index.html"
  }

  if ($FallbackHref -match '^/news/(?<date>\d{4}-\d{2}-\d{2})/(?<run>[^/]+)/') {
    return "/api/news/reports/$($Matches['date'])/$($Matches['run'])/index.html"
  }

  return $FallbackHref
}

$repoRoot = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($Date)) {
  $Date = (Get-Date).ToString("yyyy-MM-dd")
}

if ([string]::IsNullOrWhiteSpace($SourceRoot)) {
  $antiGravityRoot = "C:\Users\dw\Desktop\AntiGravity"
  if (-not (Test-Path $antiGravityRoot)) {
    throw "SourceRoot is empty and AntiGravity base directory was not found: $antiGravityRoot"
  }

  $candidateResultsDirs = Get-ChildItem $antiGravityRoot -Directory |
    ForEach-Object { Join-Path $_.FullName "results" } |
    Where-Object { Test-Path $_ } |
    Sort-Object

  $matchedSourceRoot = $candidateResultsDirs |
    Where-Object { Test-Path (Join-Path $_ $Date) } |
    Select-Object -First 1

  if (-not $matchedSourceRoot) {
    throw "Could not auto-resolve SourceRoot. Pass -SourceRoot explicitly."
  }

  $SourceRoot = $matchedSourceRoot
}

$sourceDateDir = Join-Path $SourceRoot $Date
$targetDateDir = Join-Path $repoRoot "news\$Date"

if (-not (Test-Path $sourceDateDir)) {
  throw "Source date directory not found: $sourceDateDir"
}

New-Item -ItemType Directory -Force -Path $targetDateDir | Out-Null

$runs = Get-ChildItem $sourceDateDir -Directory | Sort-Object Name
foreach ($run in $runs) {
  Copy-Item -Path $run.FullName -Destination $targetDateDir -Recurse -Force
}

$reportCount = 0
$itemCount = 0
Get-ChildItem $targetDateDir -Directory | ForEach-Object {
  $digestPath = Join-Path $_.FullName "digest_db.json"
  if (-not (Test-Path $digestPath)) {
    return
  }

  $digest = Get-Content $digestPath -Raw -Encoding utf8 | ConvertFrom-Json
  $reportCount += 1
  if ($digest.items) {
    $itemCount += @($digest.items).Count
  }
}

Write-Host "[news] Source sync complete: $sourceDateDir -> $targetDateDir"
Write-Host "[news] Candidate runs: $($runs.Count), reports with digest: $reportCount, items: $itemCount"

Push-Location (Join-Path $repoRoot "frontend")
try {
  Invoke-CheckedCommand "npm.cmd" "run" "sync-news"

  if ($Build -or $Deploy) {
    Invoke-CheckedCommand "npm.cmd" "run" "build"
  }

  if ($Deploy) {
    Invoke-CheckedCommand "npx.cmd" "firebase-tools" "deploy" "--project" $ProjectId "--only" "hosting" "--non-interactive"
  }
}
finally {
  Pop-Location
}

if ($UploadDynamic) {
  if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    throw "gcloud command not found. Install Google Cloud SDK first."
  }

  $newsRootDir = Join-Path $repoRoot "news"
  $publicIndexPath = Join-Path $repoRoot "frontend\public\data\youtube-news.json"
  if (-not (Test-Path $publicIndexPath)) {
    throw "Generated news index not found: $publicIndexPath"
  }

  $newsIndex = Get-Content $publicIndexPath -Raw -Encoding utf8 | ConvertFrom-Json

  foreach ($report in @($newsIndex.reports)) {
    $report.href = Resolve-DynamicReportHref -ReportId $report.id -FallbackHref $report.href
  }

  foreach ($item in @($newsIndex.latestItems)) {
    $item.reportHref = Resolve-DynamicReportHref -ReportId $item.reportId -FallbackHref $item.reportHref
  }

  $tmpIndexPath = Join-Path ([System.IO.Path]::GetTempPath()) ("youtube-news.dynamic.$Date.$([guid]::NewGuid().ToString('N')).json")
  $newsIndex | ConvertTo-Json -Depth 100 | Set-Content -Path $tmpIndexPath -Encoding utf8

  try {
    $reportsUri = "gs://$DynamicBucketName/$DynamicPrefix/reports"
    $indexUri = "gs://$DynamicBucketName/$DynamicPrefix/youtube-news.json"

    Invoke-CheckedCommand "gcloud" "storage" "rsync" $newsRootDir $reportsUri "--recursive"
    Invoke-CheckedCommand "gcloud" "storage" "cp" $tmpIndexPath $indexUri "--cache-control=no-store" "--content-type=application/json; charset=utf-8"
  }
  finally {
    if (Test-Path $tmpIndexPath) {
      Remove-Item -LiteralPath $tmpIndexPath -Force
    }
  }

  Write-Host "[news] Dynamic upload complete: gs://$DynamicBucketName/$DynamicPrefix"
}

Write-Host "[news] Done."
