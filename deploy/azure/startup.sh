#!/bin/bash
# Optional Azure App Service startup (Linux).
# Portal → Configuration → General settings → Startup Command:
#   /home/site/wwwroot/startup.sh
#
# Ensures persistent data dirs exist. Run migrate once via SSH if DB is missing:
#   cd /home/site/wwwroot && php database/migrate.php

set -e
mkdir -p /home/site/data/uploads
chmod -R 775 /home/site/data 2>/dev/null || true

# Remove default Azure holding pages to prevent them from blocking index.php
rm -f /home/site/wwwroot/hostingstart.html
rm -f /home/site/wwwroot/index.html

# Apply custom Nginx configuration for routing
if [ -f "/home/site/wwwroot/deploy/azure/nginx.conf" ]; then
    echo "Applying custom Nginx configuration..."
    cp /home/site/wwwroot/deploy/azure/nginx.conf /etc/nginx/sites-available/default
    # Try reloading nginx using various service commands available in standard App Service images
    service nginx reload || systemctl reload nginx || nginx -s reload || true
fi
