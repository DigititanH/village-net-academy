#Requires -Version 5.1
<#
.SYNOPSIS
  Build the React app and sync it into backend-php/public for monolithic hosting.
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "==> Installing frontend dependencies (if needed)"
if (-not (Test-Path (Join-Path $Root "frontend/node_modules"))) {
  npm run install:all
}

Write-Host "==> Building frontend"
npm run build --prefix frontend
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }

$dist = Join-Path $Root "frontend/dist"
$public = Join-Path $Root "backend-php/public"
if (-not (Test-Path $dist)) { throw "Missing frontend/dist - build did not produce output" }

Write-Host "==> Syncing frontend/dist -> backend-php/public"
# Replace hashed JS/CSS bundles
$assetsDest = Join-Path $public "assets"
if (Test-Path $assetsDest) {
  Remove-Item $assetsDest -Recurse -Force
}
if (Test-Path (Join-Path $dist "assets")) {
  Copy-Item (Join-Path $dist "assets") $assetsDest -Recurse -Force
}

# Copy static folders from dist (e.g. geo/ for SA province map) — root-file copy alone misses these
Get-ChildItem $dist -Directory | ForEach-Object {
  if ($_.Name -ieq "assets") { return }
  $destDir = Join-Path $public $_.Name
  if (Test-Path $destDir) {
    Remove-Item $destDir -Recurse -Force
  }
  Copy-Item $_.FullName $destDir -Recurse -Force
  Write-Host "    synced folder: $($_.Name)/"
}

# Copy root files from dist except anything that would overwrite the PHP front controller
Get-ChildItem $dist -File | ForEach-Object {
  if ($_.Name -ieq "index.php") { return }
  Copy-Item $_.FullName (Join-Path $public $_.Name) -Force
}

$geoFile = Join-Path $public "geo\sa-provinces.json"
if (-not (Test-Path $geoFile)) {
  throw "Missing public/geo/sa-provinces.json after sync - Training Academy map will be blank"
}

# Keep PHP routing + hosting files intact (do not delete .htaccess, index.php, etc.)
Write-Host "==> Validating PHP routes"
php (Join-Path $Root "backend-php/scripts/validate-routes.php")
if ($LASTEXITCODE -ne 0) { throw "Route validation failed" }

$spa = Join-Path $public "index.html"
if (-not (Test-Path $spa)) { throw "backend-php/public/index.html missing after sync" }

Write-Host "OK - production frontend is in backend-php/public"
Write-Host "Next: npm run package:afrihost   OR   npm run package:azure"
