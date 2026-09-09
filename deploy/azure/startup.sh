#!/usr/bin/env bash
# Azure App Service (Linux PHP 8.x) startup — point NGINX at /public and enable SPA/API front controller.
set -euo pipefail

WWWROOT="/home/site/wwwroot"
NGINX_SRC="${WWWROOT}/deploy/azure/nginx-default.conf"
NGINX_AVAILABLE="/etc/nginx/sites-available/default"
NGINX_ENABLED="/etc/nginx/sites-enabled/default"

echo "[startup] Village NetAcad Azure startup"

if [[ -f "${NGINX_SRC}" ]]; then
  cp "${NGINX_SRC}" "${NGINX_AVAILABLE}"
  cp "${NGINX_SRC}" "${NGINX_ENABLED}" 2>/dev/null || true
  echo "[startup] Installed custom NGINX config (root → public/)"
else
  # Fallback: rewrite default root in place
  if [[ -f "${NGINX_AVAILABLE}" ]]; then
    sed -i 's|root /home/site/wwwroot;|root /home/site/wwwroot/public;|g' "${NGINX_AVAILABLE}"
    sed -i 's|try_files $uri ./index.php;|try_files $uri $uri/ /index.php?$query_string;|g' "${NGINX_AVAILABLE}" || true
    sed -i 's|try_files $uri $uri/ =404;|try_files $uri $uri/ /index.php?$query_string;|g' "${NGINX_AVAILABLE}" || true
    cp "${NGINX_AVAILABLE}" "${NGINX_ENABLED}" 2>/dev/null || true
    echo "[startup] Patched default NGINX root to public/"
  else
    echo "[startup] WARNING: NGINX default config not found"
  fi
fi

mkdir -p "${WWWROOT}/uploads" "${WWWROOT}/database" || true
chmod -R ug+rwX "${WWWROOT}/uploads" "${WWWROOT}/database" 2>/dev/null || true

if command -v service >/dev/null 2>&1; then
  service nginx reload || service nginx restart || true
elif command -v nginx >/dev/null 2>&1; then
  nginx -s reload || true
fi

echo "[startup] Done"
