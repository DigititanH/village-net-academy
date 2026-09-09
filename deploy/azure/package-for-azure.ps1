#Requires -Version 5.1
<#
.SYNOPSIS
  Build + package for Azure App Service (Linux PHP). Output: deploy/azure/release.zip
  Zip root = backend-php contents (wwwroot), with React assets already in public/.
#>
$ErrorActionPreference = "Stop"
# .../deploy/azure -> repo root
$AzureDir = $PSScriptRoot
$Root = Split-Path -Parent (Split-Path -Parent $AzureDir)
Set-Location $Root

& (Join-Path $Root "deploy\prepare-production.ps1")

$temp = Join-Path $env:TEMP ("village-netacad-azure-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $temp | Out-Null

try {
  Write-Host "==> Staging Azure package (wwwroot = backend-php)"
  Copy-Item (Join-Path $Root "backend-php\*") $temp -Recurse -Force

  @(".env", ".env.local") | ForEach-Object {
    $p = Join-Path $temp $_
    if (Test-Path $p) { Remove-Item $p -Force }
  }

  $dbDir = Join-Path $temp "database"
  @("database.sqlite", "database.sqlite-wal", "database.sqlite-shm") | ForEach-Object {
    foreach ($base in @($temp, $dbDir)) {
      $p = Join-Path $base $_
      if (Test-Path $p) { Remove-Item $p -Force }
    }
  }

  $uploads = Join-Path $temp "uploads"
  if (Test-Path $uploads) {
    Get-ChildItem $uploads -Force | Where-Object { $_.Name -ne ".gitkeep" } | Remove-Item -Recurse -Force
  }
  $publicUploads = Join-Path $temp "public\uploads"
  if (Test-Path $publicUploads) {
    Get-ChildItem $publicUploads -Force | Where-Object { $_.Name -ne ".gitkeep" } | Remove-Item -Recurse -Force
  }

  $azureDeploy = Join-Path $temp "deploy\azure"
  New-Item -ItemType Directory -Path $azureDeploy -Force | Out-Null
  foreach ($f in @("AZURE.md", "env.azure.template", "nginx-default.conf")) {
    $src = Join-Path $AzureDir $f
    if (Test-Path $src) { Copy-Item $src $azureDeploy -Force }
  }
  Copy-Item (Join-Path $AzureDir "startup.sh") (Join-Path $temp "startup.sh") -Force

  $release = Join-Path $AzureDir "release.zip"
  if (Test-Path $release) { Remove-Item $release -Force }

  Write-Host "==> Creating deploy/azure/release.zip"
  Compress-Archive -Path (Join-Path $temp "*") -DestinationPath $release -Force

  $sizeMb = [math]::Round((Get-Item $release).Length / 1MB, 2)
  Write-Host "OK - $release ($sizeMb MB)"
  Write-Host "Set App Service startup command to: /home/site/wwwroot/startup.sh"
  Write-Host "See deploy/azure/AZURE.md"
}
finally {
  if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }
}
