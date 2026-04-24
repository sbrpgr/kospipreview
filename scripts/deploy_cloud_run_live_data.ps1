param(
  [string]$ProjectId = "kospipreview",
  [string]$Region = "asia-northeast3",
  [string]$ServiceName = "kospi-live-data",
  [string]$ServiceAccount = "firebase-adminsdk-fbsvc@kospipreview.iam.gserviceaccount.com",
  [string]$BucketName = "kospipreview-live-data",
  [string]$Schedule = "* * * * 1-5",
  [string]$SchedulerJobName = "kospi-live-refresh",
  [string]$RefreshToken = ""
)

$ErrorActionPreference = "Stop"
$env:CLOUDSDK_CORE_DISABLE_PROMPTS = "1"

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name is required but was not found in PATH."
  }
}

function Invoke-Gcloud {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
  )

  & gcloud @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "gcloud command failed: gcloud $($Arguments -join ' ')"
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
Write-Host "Using service account: $ServiceAccount"

Invoke-Gcloud config set project $ProjectId | Out-Null

Invoke-Gcloud services enable `
  run.googleapis.com `
  cloudscheduler.googleapis.com `
  cloudbuild.googleapis.com `
  artifactregistry.googleapis.com `
  storage.googleapis.com

$bucketExists = $false
try {
  Invoke-Gcloud storage buckets describe "gs://$BucketName" | Out-Null
  $bucketExists = $true
} catch {
  $bucketExists = $false
}

if (-not $bucketExists) {
  Invoke-Gcloud storage buckets create "gs://$BucketName" --location=$Region --uniform-bucket-level-access | Out-Null
}

Invoke-Gcloud storage cp frontend/public/data/*.json "gs://$BucketName/"

Invoke-Gcloud run deploy $ServiceName `
  --source . `
  --region $Region `
  --service-account $ServiceAccount `
  --allow-unauthenticated `
  --set-env-vars "LIVE_DATA_BUCKET=$BucketName,REFRESH_BEARER_TOKEN=$RefreshToken,LIVE_JSON_CACHE_SECONDS=10,MAX_REFRESH_BODY_BYTES=1024,REFRESH_TIMEOUT_SECONDS=240,NEWS_BUCKET_NAME=$BucketName,NEWS_STORAGE_PREFIX=youtube-news,NEWS_INDEX_FILE_NAME=youtube-news.json,NEWS_CACHE_SECONDS=15"

$serviceUrl = gcloud run services describe $ServiceName --region $Region --format="value(status.url)"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to describe Cloud Run service."
}
if (-not $serviceUrl) {
  throw "Failed to resolve Cloud Run service URL."
}

$jobExists = $false
try {
  Invoke-Gcloud scheduler jobs describe $SchedulerJobName --location=$Region | Out-Null
  $jobExists = $true
} catch {
  $jobExists = $false
}

if ($jobExists) {
  Invoke-Gcloud scheduler jobs update http `
    $SchedulerJobName `
    "--location=$Region" `
    "--schedule=$Schedule" `
    "--uri=$serviceUrl/api/tasks/refresh" `
    "--http-method=POST" `
    "--update-headers=Authorization=Bearer $RefreshToken"
} else {
  Invoke-Gcloud scheduler jobs create http `
    $SchedulerJobName `
    "--location=$Region" `
    "--schedule=$Schedule" `
    "--uri=$serviceUrl/api/tasks/refresh" `
    "--http-method=POST" `
    "--headers=Authorization=Bearer $RefreshToken"
}

Write-Host ""
Write-Host "Cloud Run live data service deployed."
Write-Host "Service URL: $serviceUrl"
Write-Host "Scheduler job: $SchedulerJobName"
Write-Host "Refresh token: configured"
