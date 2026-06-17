# Build and zip for Afrihost cPanel upload (PHP API + React site)
# Run from project root:  npm run package:afrihost

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$out = Join-Path $root "village-netacad-afrihost.zip"
$temp = Join-Path $env:TEMP "village-netacad-afrihost"

Write-Host "Building frontend..."
Push-Location (Join-Path $root "frontend")
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Pop-Location

if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }
New-Item -ItemType Directory -Path $temp | Out-Null

# PHP API (exclude secrets and local DB)
$phpDest = Join-Path $temp "backend-php"
Copy-Item (Join-Path $root "backend-php") $phpDest -Recurse -Force
@(".env") | ForEach-Object {
    $p = Join-Path $phpDest $_
    if (Test-Path $p) { Remove-Item $p -Force }
}
$dbFolder = Join-Path $phpDest "database"
# SQL schema files are included; no local database file to strip

# React build -> public/ (keep index.php router)
$dist = Join-Path $root "frontend\dist"
$public = Join-Path $phpDest "public"
Get-ChildItem $dist -File | ForEach-Object {
    if ($_.Name -ne "index.php") {
        Copy-Item $_.FullName (Join-Path $public $_.Name) -Force
    }
}
if (Test-Path (Join-Path $dist "assets")) {
    Copy-Item (Join-Path $dist "assets") (Join-Path $public "assets") -Recurse -Force
}

# Deploy docs only (no VPS/Azure extras)
$deployDest = Join-Path $temp "deploy"
New-Item -ItemType Directory -Path $deployDest | Out-Null
Copy-Item (Join-Path $root "deploy\AFRIHOST.md") $deployDest -Force
Copy-Item (Join-Path $root "deploy\env.production.template") $deployDest -Force
Copy-Item (Join-Path $root "README.md") $temp -Force

if (Test-Path $out) { Remove-Item $out -Force }
Compress-Archive -Path "$temp\*" -DestinationPath $out
Remove-Item $temp -Recurse -Force

Write-Host ""
Write-Host "Created: $out"
Write-Host ""
Write-Host "Afrihost cPanel:"
Write-Host "  1. Upload and extract zip"
Write-Host "  2. Document root -> backend-php/public"
Write-Host "  3. deploy/env.production.template -> backend-php/.env (edit paths)"
Write-Host "  4. Create ~/village-netacad-data/ (writable) for DB + uploads"
Write-Host "  5. SSH: php backend-php/database/migrate.php"
Write-Host "  6. https://yourdomain.co.za/health"
Write-Host "  See deploy/AFRIHOST.md in the zip"
Write-Host ""
