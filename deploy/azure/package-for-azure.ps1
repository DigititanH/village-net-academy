# Build PHP API + React for Azure App Service (Linux, PHP 8.2+)
# Run from project root:  npm run package:azure
#
# Zip layout (extracts to /home/site/wwwroot):
#   public/          <- WEBSITE_DOCUMENT_ROOT
#   bootstrap.php, controllers/, database/, ...
#   deploy/azure/    <- env template + docs (not web-accessible if doc root is public/)

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$out = Join-Path $root "village-netacad-azure.zip"
$release = Join-Path $PSScriptRoot "release.zip"
$temp = Join-Path $env:TEMP "village-netacad-azure"

Write-Host "Building frontend..."
Push-Location (Join-Path $root "frontend")
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Pop-Location

if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }
New-Item -ItemType Directory -Path $temp | Out-Null

# Flatten backend-php into zip root (Azure wwwroot)
Copy-Item (Join-Path $root "backend-php\*") $temp -Recurse -Force
@(".env") | ForEach-Object {
    $p = Join-Path $temp $_
    if (Test-Path $p) { Remove-Item $p -Force }
}
$dbDir = Join-Path $temp "database"
@("database.sqlite", "database.sqlite-wal", "database.sqlite-shm") | ForEach-Object {
    $p = Join-Path $dbDir $_
    if (Test-Path $p) { Remove-Item $p -Force }
}
# Legacy path (pre database/ folder)
@("database.sqlite", "database.sqlite-wal", "database.sqlite-shm") | ForEach-Object {
    $p = Join-Path $temp $_
    if (Test-Path $p) { Remove-Item $p -Force }
}

# React build -> public/
$dist = Join-Path $root "frontend\dist"
$public = Join-Path $temp "public"
Get-ChildItem $dist -File | ForEach-Object {
    if ($_.Name -ne "index.php") {
        Copy-Item $_.FullName (Join-Path $public $_.Name) -Force
    }
}
if (Test-Path (Join-Path $dist "assets")) {
    Copy-Item (Join-Path $dist "assets") (Join-Path $public "assets") -Recurse -Force
}

# Azure deploy assets inside package (outside document root when WEBSITE_DOCUMENT_ROOT=public)
$azureDeploy = Join-Path $temp "deploy\azure"
New-Item -ItemType Directory -Path $azureDeploy -Force | Out-Null
Copy-Item (Join-Path $PSScriptRoot "AZURE.md") $azureDeploy -Force
Copy-Item (Join-Path $PSScriptRoot "env.azure.template") $azureDeploy -Force
Copy-Item (Join-Path $PSScriptRoot "startup.sh") (Join-Path $temp "startup.sh") -Force

foreach ($zipPath in @($out, $release)) {
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Compress-Archive -Path "$temp\*" -DestinationPath $zipPath
}

Remove-Item $temp -Recurse -Force

Write-Host ""
Write-Host "Created:"
Write-Host "  $out"
Write-Host "  $release  (used by GitHub Actions)"
Write-Host ""
Write-Host "Next: see deploy/azure/AZURE.md"
Write-Host "  - App Service Linux, PHP 8.2+"
Write-Host "  - WEBSITE_DOCUMENT_ROOT=/home/site/wwwroot/public"
Write-Host "  - DATABASE_PATH=/home/site/data/database.sqlite"
Write-Host ""
