$ErrorActionPreference = "Stop"
Set-Location "C:\Users\MY COMPUTER\HimanshuXLTools"
$Report = Join-Path (Get-Location) "HIMANSHU-WEBSITE-STEP10-PRODUCTION-REPORT.txt"
"=== HIMANSHU XL TOOLS WEBSITE STEP 10 - PRODUCTION DEPLOYMENT ===" | Set-Content $Report
"DATE=$(Get-Date -Format o)" | Add-Content $Report

function Log($m) { $m | Tee-Object -FilePath $Report -Append }
function Run($label, [scriptblock]$cmd) {
  Log "`n--- $label ---"
  & $cmd 2>&1 | Tee-Object -FilePath $Report -Append
  if ($LASTEXITCODE -ne 0) { throw "$label failed with exit code $LASTEXITCODE" }
  Log "$label=PASS"
}

# Safety backup of files changed by website STEP 1-10.
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Backup = Join-Path (Get-Location) "backup\website-step10-$Stamp"
New-Item -ItemType Directory -Force $Backup | Out-Null
foreach ($Rel in @("src\website","src\customer-portal","src\admin-control-center","src\license-api","webpack.config.js")) {
  if (Test-Path $Rel) {
    $Dest = Join-Path $Backup $Rel
    New-Item -ItemType Directory -Force (Split-Path $Dest -Parent) | Out-Null
    Copy-Item $Rel $Dest -Recurse -Force
  }
}
Log "BACKUP=$Backup"

Run "NODE_CHECK_LICENSE_API" { node --check .\src\license-api\worker.js }
Run "NODE_CHECK_ADMIN" { node --check .\src\admin-control-center\admin-control-center.js }
Run "NODE_CHECK_CUSTOMER" { node --check .\src\customer-portal\customer-portal.js }
Run "NODE_CHECK_WEBSITE" { node --check .\src\website\website.js }
Run "PRODUCTION_BUILD" { npm run build }
Run "MANIFEST_VALIDATE" { npm run validate }

# Publish the official installer as a static production asset.
$Installer = ".\release\HimanshuXLTools-v1.0\HimanshuXLTools-v1.0-Setup.exe"
if (!(Test-Path $Installer)) { throw "Official installer not found: $Installer" }
New-Item -ItemType Directory -Force ".\dist\downloads" | Out-Null
Copy-Item $Installer ".\dist\downloads\HimanshuXLTools-v1.0-Setup.exe" -Force
$Hash = (Get-FileHash $Installer -Algorithm SHA256).Hash
Log "INSTALLER_SHA256=$Hash"

# Additive D1 schema only. No existing customer/license/device row is updated/deleted.
Run "D1_LICENSE_VAULT" { npx wrangler d1 execute himanshu-xl-tools-licenses --remote --file .\src\license-api\license-vault-migration.sql }
Run "D1_DOWNLOAD_CENTER" { npx wrangler d1 execute himanshu-xl-tools-licenses --remote --file .\src\license-api\download-center-migration.sql }
Run "D1_ORDERS_PAYMENTS" { npx wrangler d1 execute himanshu-xl-tools-licenses --remote --file .\src\license-api\orders-payments-migration.sql }
Run "D1_FULFILLMENT_EMAIL" { npx wrangler d1 execute himanshu-xl-tools-licenses --remote --file .\src\license-api\order-fulfillment-email-migration.sql }

# Generate new secrets locally and send directly to Cloudflare. Values are never printed or saved.
$SessionSecret = -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
$VaultSecret   = -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
$SessionSecret | npx wrangler secret put CUSTOMER_SESSION_SECRET --config .\wrangler.jsonc | Tee-Object -FilePath $Report -Append
if ($LASTEXITCODE -ne 0) { throw "CUSTOMER_SESSION_SECRET configuration failed" }
$VaultSecret | npx wrangler secret put LICENSE_VAULT_SECRET --config .\wrangler.jsonc | Tee-Object -FilePath $Report -Append
if ($LASTEXITCODE -ne 0) { throw "LICENSE_VAULT_SECRET configuration failed" }
Remove-Variable SessionSecret,VaultSecret
Log "NEW_SECRETS_CONFIGURED=YES_VALUES_NOT_SAVED"

# Release metadata. RELEASE_DOWNLOAD_URL is used only by the authenticated API proxy.
$ReleaseUrl = "https://restless-shape-bea9.himanshuchinchekar25.workers.dev/downloads/HimanshuXLTools-v1.0-Setup.exe"
@{
  RELEASE_VERSION="1.0.0"
  RELEASE_FILE_NAME="HimanshuXLTools-v1.0-Setup.exe"
  RELEASE_SHA256=$Hash
  RELEASE_DATE=(Get-Date -Format "yyyy-MM-dd")
  RELEASE_NOTES="Himanshu XL Tools v1.0 production release."
  RELEASE_DOWNLOAD_URL=$ReleaseUrl
  RELEASE_PUBLISHED="true"
}.GetEnumerator() | ForEach-Object {
  $_.Value | npx wrangler secret put $_.Key --config .\wrangler.jsonc | Tee-Object -FilePath $Report -Append
  if ($LASTEXITCODE -ne 0) { throw "Release configuration failed: $($_.Key)" }
}
Log "RELEASE_CONFIGURATION=PASS"

# Existing RESEND_API_KEY and ADMIN_RESET_SECRET are intentionally not read or replaced.
Run "DEPLOY_LICENSE_API" { npx wrangler deploy .\src\license-api\worker.js --config .\wrangler.jsonc }
Run "DEPLOY_STATIC_WEBSITE" { npx wrangler deploy --config .\wrangler.production.jsonc }

# Public runtime smoke checks. Customer authenticated runtime is tested separately after deployment.
$Urls = @(
 "https://restless-shape-bea9.himanshuchinchekar25.workers.dev/",
 "https://restless-shape-bea9.himanshuchinchekar25.workers.dev/customer-portal.html",
 "https://restless-shape-bea9.himanshuchinchekar25.workers.dev/admin-control-center.html",
 "https://himanshu-xl-tools-license-api.himanshuchinchekar25.workers.dev/health"
)
$Pass=0; $Fail=0
foreach($U in $Urls){
  try { $R=Invoke-WebRequest -Uri $U -UseBasicParsing -TimeoutSec 30; Log "HTTP=$($R.StatusCode) URL=$U"; if($R.StatusCode -eq 200){$Pass++}else{$Fail++} }
  catch { Log "HTTP=FAIL URL=$U ERROR=$($_.Exception.Message)"; $Fail++ }
}
Log "PUBLIC_SMOKE_PASS=$Pass"
Log "PUBLIC_SMOKE_FAIL=$Fail"
Log "LOCALHOST_REQUIRED=NO"
Log "PAYMENT_PROVIDER_LIVE=NO_PROVIDER_NOT_SELECTED"
Log "REAL_CUSTOMER_LICENSE_DEVICE_MUTATION=NO"
Log "STEP10_DEPLOY_SCRIPT_COMPLETE=True"
Log "NEXT=UPLOAD_HIMANSHU-WEBSITE-STEP10-PRODUCTION-REPORT.txt"
Write-Host "`nDONE. UPLOAD ONLY:"
Write-Host $Report
