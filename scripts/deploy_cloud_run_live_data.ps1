param(
  [string]$ProjectId = "kospipreview",
  [string]$Region = "asia-northeast3",
  [string]$ServiceName = "kospi-live-data",
  [string]$BucketName = "kospipreview-live-data",
  [string]$Schedule = "* * * * 1-5",
  [string]$SchedulerJobName = "kospi-live-refresh",
  [string]$RefreshToken = ""
)

$ErrorActionPreference = "Stop"

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name is required but was not found in PATH."
  }
}

Require-Command "gcloud"

if ([string]::IsNullOrWhiteSpace($RefreshToken)) {
  $RefreshToken = @'
import secrets
print(secrets.token_urlsafe(32))
'@ | python -
}

Write-Host "Using project: $ProjectId"
Write-Host "Using region: $Region"
Write-Host "Using bucket: gs://$BucketName"
Write-Host "Using service: $ServiceName"

gcloud config set project $ProjectId | Out-Null

gcloud services enable `
  run.googleapis.com `
  cloudscheduler.googleapis.com `
  cloudbuild.googleapis.com `
  artifactregistry.googleapis.com `
  storage.googleapis.com

$bucketExists = $false
try {
  gcloud storage buckets describe "gs://$BucketName" | Out-Null
  $bucketExists = $true
} catch {
  $bucketExists = $false
}

if (-not $bucketExists) {
  gcloud storage buckets create "gs://$BucketName" --location=$Region --uniform-bucket-level-access
}

gcloud storage cp frontend/public/data/*.json "gs://$BucketName/"

gcloud run deploy $ServiceName `
  --source . `
  --region $Region `
  --allow-unauthenticated `
  --set-env-vars "LIVE_DATA_BUCKET=$BucketName,REFRESH_BEARER_TOKEN=$RefreshToken"

$serviceUrl = gcloud run services describe $ServiceName --region $Region --format="value(status.url)"
if (-not $serviceUrl) {
  throw "Failed to resolve Cloud Run service URL."
}

$jobExists = $false
try {
  gcloud scheduler jobs describe $SchedulerJobName --location=$Region | Out-Null
  $jobExists = $true
} catch {
  $jobExists = $false
}

$schedulerArgs = @(
  $SchedulerJobName,
  "--location=$Region",
  "--schedule=$Schedule",
  "--uri=$serviceUrl/api/tasks/refresh",
  "--http-method=POST",
  "--headers=Authorization=Bearer $RefreshToken"
)

if ($jobExists) {
  gcloud scheduler jobs update http @schedulerArgs
} else {
  gcloud scheduler jobs create http @schedulerArgs
}

Write-Host ""
Write-Host "Cloud Run live data service deployed."
Write-Host "Service URL: $serviceUrl"
Write-Host "Scheduler job: $SchedulerJobName"
Write-Host "Refresh token (store securely): $RefreshToken"
