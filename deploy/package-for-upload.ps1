#Requires -Version 5.1
<#
.SYNOPSIS
  Build + package for Afrihost / cPanel upload (village-netacad-afrihost.zip).
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

# Keep phpMyAdmin import in sync with table definitions
Write-Host "==> Rebuilding import.sql"
php (Join-Path $Root "backend-php/scripts/rebuild-import-sql.php")
if ($LASTEXITCODE -ne 0) { throw "rebuild-import-sql failed" }

& (Join-Path $PSScriptRoot "prepare-production.ps1")

$zipName = "village-netacad-afrihost.zip"
$zipPath = Join-Path $Root $zipName
$temp = Join-Path $env:TEMP ("village-netacad-afrihost-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $temp | Out-Null

try {
  Write-Host "==> Staging Afrihost package"
  $backendDest = Join-Path $temp "backend-php"
  New-Item -ItemType Directory -Path $backendDest | Out-Null
  Copy-Item (Join-Path $Root "backend-php\*") $backendDest -Recurse -Force

  # Replace local .env with Afrihost production .env inside the package
  @(
    (Join-Path $backendDest ".env"),
    (Join-Path $backendDest ".env.local"),
    (Join-Path $backendDest ".env.production")
  ) | ForEach-Object { if (Test-Path $_) { Remove-Item $_ -Force } }

  $afrihostEnv = Join-Path $Root "deploy\env.afrihost.env"
  $packagedEnv = Join-Path $backendDest ".env"
  if (Test-Path $afrihostEnv) {
    Copy-Item $afrihostEnv $packagedEnv -Force
    Write-Host "==> Included backend-php/.env (Afrihost production)"
  } else {
    $template = Join-Path $Root "deploy\env.production.template"
    if (Test-Path $template) {
      Copy-Item $template $packagedEnv -Force
      Write-Host "==> Included backend-php/.env from template"
    } else {
      throw "Missing deploy/env.afrihost.env - cannot package .env"
    }
  }

  Get-ChildItem $backendDest -Recurse -Force -Include "*.log",".DS_Store","Thumbs.db" -ErrorAction SilentlyContinue |
    Remove-Item -Force -ErrorAction SilentlyContinue

  $dbDir = Join-Path $backendDest "database"
  @("database.sqlite", "database.sqlite-wal", "database.sqlite-shm") | ForEach-Object {
    foreach ($base in @($backendDest, $dbDir)) {
      $p = Join-Path $base $_
      if (Test-Path $p) { Remove-Item $p -Force }
    }
  }

  foreach ($uploadsRel in @("uploads", "public\uploads")) {
    $uploads = Join-Path $backendDest $uploadsRel
    if (Test-Path $uploads) {
      Get-ChildItem $uploads -Force | Where-Object { $_.Name -ne ".gitkeep" } | Remove-Item -Recurse -Force
      if (-not (Test-Path (Join-Path $uploads ".gitkeep"))) {
        New-Item -ItemType File -Path (Join-Path $uploads ".gitkeep") -Force | Out-Null
      }
    }
  }

  # Verify SPA + PHP front controller are present
  $mustExist = @(
    "public\index.php",
    "public\index.html",
    "public\.htaccess",
    "public\assets",
    "public\payfast\notify.php",
    "public\geo\sa-provinces.json",
    "public\IM1.png",
    "database\import.sql",
    "scripts\post-deploy.php",
    ".env",
    ".env.example"
  )
  foreach ($rel in $mustExist) {
    $p = Join-Path $backendDest $rel
    if (-not (Test-Path $p)) { throw "Package missing required path: backend-php/$rel" }
  }

  $deployDest = Join-Path $temp "deploy"
  New-Item -ItemType Directory -Path $deployDest | Out-Null
  Copy-Item (Join-Path $Root "deploy\AFRIHOST.md") $deployDest -Force
  Copy-Item (Join-Path $Root "deploy\AFRIHOST-QUICKSTART.txt") $deployDest -Force
  Copy-Item (Join-Path $Root "deploy\env.production.template") $deployDest -Force
  if (Test-Path (Join-Path $Root "deploy\env.afrihost.env")) {
    Copy-Item (Join-Path $Root "deploy\env.afrihost.env") $deployDest -Force
  }

  Copy-Item (Join-Path $Root "deploy\AFRIHOST-QUICKSTART.txt") (Join-Path $temp "README-DEPLOY.txt") -Force

  foreach ($f in @(".htaccess", ".user.ini", "php.ini")) {
    $src = Join-Path $Root $f
    if (Test-Path $src) { Copy-Item $src $temp -Force }
  }

  if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
  Write-Host "==> Creating $zipName"
  Compress-Archive -Path (Join-Path $temp "*") -DestinationPath $zipPath -Force

  $sizeMb = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
  Write-Host "OK - $zipPath ($sizeMb MB)"
  Write-Host "Upload to cPanel, extract, set document root to backend-php/public"
  Write-Host "See README-DEPLOY.txt or deploy/AFRIHOST.md inside the zip"
}
finally {
  if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }
}
