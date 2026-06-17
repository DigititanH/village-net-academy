# One-shot Azure deploy: provision → configure → zip deploy → migrate hint
# Run from project root after: az login
#   powershell -ExecutionPolicy Bypass -File deploy/azure/deploy-now.ps1
# Optional: -AppName "my-unique-name" -ResourceGroup "rg-villagenetacad"

param(
    [string]$AppName = "villagenetacad-$(Get-Random -Maximum 99999)",
    [string]$ResourceGroup = "rg-villagenetacad",
    [string]$Location = "southafricanorth",
    [string]$Sku = "B1"
)

$ErrorActionPreference = "Stop"
$az = "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"
if (-not (Test-Path $az)) { $az = "az" }

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$zip = Join-Path $root "village-netacad-azure.zip"

function Invoke-Az {
    param([string[]]$Args)
    $out = & $az @Args 2>&1
    if ($LASTEXITCODE -ne 0) { throw ($out -join "`n") }
    return $out
}

Write-Host "=== Village NetAcad — Azure deploy ===" -ForegroundColor Cyan
Write-Host "App: $AppName  RG: $ResourceGroup  Region: $Location`n"

try { Invoke-Az @("account", "show") | Out-Null }
catch {
    Write-Host "Not logged in. Opening device login..." -ForegroundColor Yellow
    Invoke-Az @("login", "--use-device-code")
}

if (-not (Test-Path $zip)) {
    Write-Host "Building package..."
    Push-Location $root
    npm run package:azure
    Pop-Location
}

$jwt = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
$siteUrl = "https://${AppName}.azurewebsites.net"

Write-Host "Creating resource group..."
Invoke-Az @("group", "create", "--name", $ResourceGroup, "--location", $Location, "--output", "none") | Out-Null

$plan = "${AppName}-plan"
Write-Host "Creating App Service plan ($Sku)..."
Invoke-Az @(
    "appservice", "plan", "create",
    "--name", $plan,
    "--resource-group", $ResourceGroup,
    "--sku", $Sku,
    "--is-linux",
    "--output", "none"
) | Out-Null

Write-Host "Creating Web App (PHP 8.2)..."
Invoke-Az @(
    "webapp", "create",
    "--name", $AppName,
    "--resource-group", $ResourceGroup,
    "--plan", $plan,
    "--runtime", "PHP:8.2",
    "--output", "none"
) | Out-Null

Write-Host "Configuring app settings..."
Invoke-Az @(
    "webapp", "config", "appsettings", "set",
    "--name", $AppName,
    "--resource-group", $ResourceGroup,
    "--settings",
    "WEBSITE_DOCUMENT_ROOT=/home/site/wwwroot/public",
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE=true",
    "SCM_DO_BUILD_DURING_DEPLOYMENT=false",
    "NODE_ENV=production",
    "DATABASE_PATH=/home/site/data/database.sqlite",
    "UPLOADS_DIR=/home/site/data/uploads",
    "JWT_SECRET=$jwt",
    "JWT_EXPIRES_IN=7d",
    "CLIENT_URL=$siteUrl",
    "API_URL=$siteUrl",
    "PAYFAST_NOTIFY_URL=$siteUrl/api/payfast/notify",
    "PAYFAST_SANDBOX=true",
    "--output", "none"
) | Out-Null

Invoke-Az @(
    "webapp", "config", "set",
    "--name", $AppName,
    "--resource-group", $ResourceGroup,
    "--startup-file", "bash /home/site/wwwroot/startup.sh; php-fpm;",
    "--output", "none"
) | Out-Null

Write-Host "Deploying zip (may take 2–5 min)..."
Invoke-Az @(
    "webapp", "deploy",
    "--resource-group", $ResourceGroup,
    "--name", $AppName,
    "--src-path", $zip,
    "--type", "zip",
    "--timeout", "600000"
) | Out-Null

Write-Host ""
Write-Host "=== Deployed ===" -ForegroundColor Green
Write-Host "Site:   $siteUrl"
Write-Host "Health: $siteUrl/health"
Write-Host ""
Write-Host "Run database migrate once (Portal -> SSH):" -ForegroundColor Yellow
Write-Host "  cd /home/site/wwwroot && php database/migrate.php"
Write-Host ""
Write-Host "Save these for GitHub Actions secrets:" -ForegroundColor Cyan
Write-Host "  AZURE_WEBAPP_NAME=$AppName"
$profile = Invoke-Az @("webapp", "deployment", "list-publishing-profiles", "--name", $AppName, "--resource-group", $ResourceGroup, "--xml")
$profilePath = Join-Path $root "deploy/azure/publish-profile.xml"
$profile | Set-Content -Path $profilePath -Encoding UTF8
Write-Host "  Publish profile saved: deploy/azure/publish-profile.xml"
Write-Host "  (Add contents as secret AZURE_WEBAPP_PUBLISH_PROFILE — do not commit.)"
