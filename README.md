# Village NetAcad

Shop and support platform for **Afrihost** (cPanel) or **Microsoft Azure App Service** (Linux PHP 8.2+ + SQLite). No Node.js on the server.

## Project layout

```
frontend/       React app (Vite) — built into backend-php/public for production
backend-php/    PHP API + SQLite + serves the website from public/
deploy/         Afrihost + Azure upload scripts and production .env templates
docs/           Local PHP setup on Windows
```

## Local development

**Requirements:** Node.js (frontend build only), PHP 8.1+ with `pdo_mysql`, MySQL/MariaDB. See [docs/INSTALL-PHP-WINDOWS.md](docs/INSTALL-PHP-WINDOWS.md).

```powershell
cd backend-php
copy .env.example .env
cd ..
npm run install:all
npm run migrate

# Terminal 1 — API + built-in server
npm run dev:backend

# Terminal 2 — React with hot reload
npm run dev:frontend
```

- Website (dev): http://localhost:5173  
- API: http://localhost:5000  
- Health: http://localhost:5000/health  

Default admin after migrate: `admin@villagenetacad.com` / `Admin123!`

## Deploy to Afrihost

```powershell
npm run package:afrihost
```

Upload **`village-netacad-afrihost.zip`** to cPanel. Full steps: **[deploy/AFRIHOST.md](deploy/AFRIHOST.md)**

| Setting | Value |
|---------|--------|
| Document root | `.../backend-php/public` |
| Config | `backend-php/.env` (from `deploy/env.production.template`) |
| Data (writable, outside `public`) | `~/village-netacad-data/` |

## Deploy to Microsoft Azure

```powershell
npm run package:azure
```

Upload **`village-netacad-azure.zip`** or use GitHub Actions. Full steps: **[deploy/azure/AZURE.md](deploy/azure/AZURE.md)**

| Setting | Value |
|---------|--------|
| Runtime | Linux App Service, PHP 8.2 |
| Document root | `WEBSITE_DOCUMENT_ROOT=/home/site/wwwroot/public` |
| Data | `/home/site/data/` (SQLite + uploads) |
| CI/CD | `.github/workflows/azure-app-service.yml` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install frontend dependencies |
| `npm run build` | Build React to `frontend/dist` |
| `npm run migrate` | Create/update SQLite schema |
| `npm run dev:backend` | PHP API on :5000 |
| `npm run dev:frontend` | Vite dev server on :5173 |
| `npm run package:afrihost` | Build + zip for cPanel upload |
| `npm run package:azure` | Build + zip for Azure App Service |
| `npm run prepare:deploy` | Validate routes, build, sync public, both zips |
| `npm run validate:routes` | Check all API routes register (no 500 on boot) |
