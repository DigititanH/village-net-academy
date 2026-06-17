# Pre-deploy checks: validate routes, build frontend, sync to public, create zips
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $root

Write-Host "1/4 Validating PHP routes..."
php backend-php/scripts/validate-routes.php
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }

Write-Host "2/4 Building frontend..."
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }

Write-Host "3/4 Syncing build to backend-php/public..."
& (Join-Path $PSScriptRoot "sync-public.ps1")

Write-Host "4/4 Creating deployment zips..."
npm run package:afrihost
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
npm run package:azure
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }

Pop-Location
Write-Host ""
Write-Host "Ready for deployment:" -ForegroundColor Green
Write-Host "  Afrihost: village-netacad-afrihost.zip  (see deploy/AFRIHOST.md)"
Write-Host "  Azure:    village-netacad-azure.zip     (see deploy/azure/AZURE.md)"
Write-Host ""
Write-Host "Before go-live: set production JWT_SECRET, CLIENT_URL, API_URL in .env"
