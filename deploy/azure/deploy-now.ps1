#Requires -Version 5.1
<#
.SYNOPSIS
  Package and deploy to Azure App Service using az webapp deploy (or zip deploy via publish profile path).

.PARAMETER AppName
  Azure Web App name (default: villagenetacad)

.PARAMETER ResourceGroup
  Resource group containing the web app (required for az CLI deploy)

.PARAMETER PublishProfile
  Optional path to *.PublishSettings / publish-profile.xml
#>
param(
  [string]$AppName = "villagenetacad",
  [string]$ResourceGroup = "",
  [string]$PublishProfile = ""
)

$ErrorActionPreference = "Stop"
$AzureDir = $PSScriptRoot
$Root = Split-Path -Parent (Split-Path -Parent $AzureDir)
Set-Location $Root

& (Join-Path $AzureDir "package-for-azure.ps1")
$zip = Join-Path $AzureDir "release.zip"
if (-not (Test-Path $zip)) { throw "Missing $zip" }

$az = Get-Command az -ErrorAction SilentlyContinue
if (-not $az) {
  Write-Host "Azure CLI (az) not found. Package is ready at:"
  Write-Host "  $zip"
  Write-Host "Upload via Azure Portal -> Deployment Center / Advanced Tools (Kudu) -> Zip Deploy,"
  Write-Host "or install Azure CLI and re-run with -ResourceGroup YourRg"
  exit 0
}

if ($PublishProfile -and (Test-Path $PublishProfile)) {
  Write-Host "==> Deploying with publish profile"
  az webapp deployment source config-zip `
    --src $zip `
    --name $AppName `
    --resource-group $ResourceGroup `
    --timeout 600
} elseif ($ResourceGroup) {
  Write-Host "==> Deploying $zip to $AppName ($ResourceGroup)"
  az webapp deploy `
    --resource-group $ResourceGroup `
    --name $AppName `
    --src-path $zip `
    --type zip `
    --async true
} else {
  Write-Host "Package ready: $zip"
  Write-Host "Deploy with:"
  Write-Host "  npm run deploy:azure -- -ResourceGroup YOUR_RG [-AppName $AppName]"
  Write-Host "Or set GitHub secrets and run the Actions workflow."
}
