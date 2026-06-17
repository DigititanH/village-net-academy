# Copy frontend/dist into backend-php/public for local production testing
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dist = Join-Path $root "frontend\dist"
$public = Join-Path $root "backend-php\public"

if (-not (Test-Path (Join-Path $dist "index.html"))) {
    Write-Error "Run npm run build first."
    exit 1
}

Get-ChildItem $dist -File | ForEach-Object {
    if ($_.Name -ne "index.php") {
        Copy-Item $_.FullName (Join-Path $public $_.Name) -Force
    }
}
if (Test-Path (Join-Path $dist "assets")) {
    $dest = Join-Path $public "assets"
    if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
    Copy-Item (Join-Path $dist "assets") $dest -Recurse -Force
}
Write-Host "Synced frontend build -> backend-php/public"
