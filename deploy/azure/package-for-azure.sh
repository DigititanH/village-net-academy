#!/usr/bin/env bash
# Build PHP API + React for Azure App Service (Linux, PHP 8.2+)
# Run from project root:  bash deploy/azure/package-for-azure.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUT_ZIP="$ROOT_DIR/village-netacad-azure.zip"
RELEASE_ZIP="$SCRIPT_DIR/release.zip"
TEMP_DIR="/tmp/village-netacad-azure-build"

echo "=== Packaging Village NetAcad for Azure ==="

# Build frontend
echo "Building frontend React app..."
cd "$ROOT_DIR/frontend"
npm install
npm run build
cd "$ROOT_DIR"

# Clean temp dir
if [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
fi
mkdir -p "$TEMP_DIR"

# Flatten backend-php into temp root
echo "Copying backend files..."
cp -R "$ROOT_DIR/backend-php/"* "$TEMP_DIR/"

# Remove local configs and DBs
rm -f "$TEMP_DIR/.env"
rm -rf "$TEMP_DIR/database/database.sqlite"* 2>/dev/null || true
rm -rf "$TEMP_DIR/database.sqlite"* 2>/dev/null || true

# React build -> public/
echo "Copying built frontend to public/..."
mkdir -p "$TEMP_DIR/public"

# Copy files except index.php (if any) from frontend/dist
if [ -d "$ROOT_DIR/frontend/dist" ]; then
    find "$ROOT_DIR/frontend/dist" -maxdepth 1 -type f ! -name "index.php" -exec cp {} "$TEMP_DIR/public/" \;
    if [ -d "$ROOT_DIR/frontend/dist/assets" ]; then
        cp -R "$ROOT_DIR/frontend/dist/assets" "$TEMP_DIR/public/"
    fi
fi

# Copy Azure configuration and scripts
echo "Adding Azure-specific configurations..."
mkdir -p "$TEMP_DIR/deploy/azure"
cp "$SCRIPT_DIR/AZURE.md" "$TEMP_DIR/deploy/azure/"
cp "$SCRIPT_DIR/env.azure.template" "$TEMP_DIR/deploy/azure/"
cp "$SCRIPT_DIR/startup.sh" "$TEMP_DIR/"

# Zip it up
echo "Zipping application..."
rm -f "$OUT_ZIP" "$RELEASE_ZIP"

# Zip contents of $TEMP_DIR into both locations
cd "$TEMP_DIR"
zip -r "$OUT_ZIP" . > /dev/null
cp "$OUT_ZIP" "$RELEASE_ZIP"

# Cleanup
rm -rf "$TEMP_DIR"

echo "=== Done ==="
echo "Package created at:"
echo "  $OUT_ZIP"
echo "  $RELEASE_ZIP"
echo ""
