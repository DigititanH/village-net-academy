#!/usr/bin/env bash
# Create Azure resources (requires Azure CLI: az login)
# Usage: ./deploy/azure/provision.sh YOUR_APP_NAME [resource-group] [region]

set -euo pipefail

APP_NAME="${1:?App name required (globally unique, e.g. villagenetacad-prod)}"
RG="${2:-rg-villagenetacad}"
LOCATION="${3:-southafricanorth}"
PLAN="${APP_NAME}-plan"

echo "Resource group: $RG ($LOCATION)"
echo "Web app:        $APP_NAME (PHP 8.2 Linux)"

az group create --name "$RG" --location "$LOCATION" --output none

az appservice plan create \
  --name "$PLAN" \
  --resource-group "$RG" \
  --sku B1 \
  --is-linux \
  --output none

az webapp create \
  --name "$APP_NAME" \
  --resource-group "$RG" \
  --plan "$PLAN" \
  --runtime "PHP:8.2" \
  --output none

az webapp config set \
  --name "$APP_NAME" \
  --resource-group "$RG" \
  --startup-file "/home/site/wwwroot/startup.sh" \
  --output none

az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RG" \
  --settings \
    WEBSITE_DOCUMENT_ROOT="/home/site/wwwroot/public" \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE=true \
    SCM_DO_BUILD_DURING_DEPLOYMENT=false \
    NODE_ENV=production \
    DATABASE_PATH="/home/site/data/database.sqlite" \
    UPLOADS_DIR="/home/site/data/uploads" \
  --output none

echo ""
echo "Created: https://${APP_NAME}.azurewebsites.net"
echo ""
echo "Next:"
echo "  1. npm run package:azure"
echo "  2. az webapp deploy --resource-group $RG --name $APP_NAME --src-path village-netacad-azure.zip --type zip"
echo "  3. Set JWT_SECRET, CLIENT_URL, API_URL, PAYFAST_* in Portal → Configuration"
echo "  4. SSH: cd /home/site/wwwroot && php database/migrate.php"
echo "  5. Open https://${APP_NAME}.azurewebsites.net/health"
echo ""
echo "See deploy/azure/AZURE.md"
