# Local PHP API (Afrihost-compatible stack — no Node required)
Set-Location (Join-Path $PSScriptRoot "..\backend-php")
Write-Host "Village NetAcad PHP API — http://localhost:5000"
Write-Host "Health: http://localhost:5000/health"
php -S localhost:5000 -t public public/index.php
