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
