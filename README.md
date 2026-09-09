# Village NetAcad

React (Vite) frontend + PHP API. Deploy on Afrihost/cPanel or Azure App Service (Linux PHP).

## Structure

- `frontend/` — React SPA
- `backend-php/` — PHP API, migrations, `public/` front controller
- `deploy/` — packaging scripts and hosting docs
- `docs/` — local setup notes

## Local development

Prerequisites: Node 18+, PHP 8.1+

```bash
cd backend-php && cp .env.example .env
cd .. && npm run install:all
npm run migrate
npm run dev:backend    # http://localhost:5000
npm run dev:frontend   # http://localhost:5173 (proxies /api)
```

## Production packaging

Always build and sync the SPA into `backend-php/public` before upload:

```powershell
npm run prepare:deploy
```

| Target | Command | Output |
|--------|---------|--------|
| Afrihost / cPanel | `npm run package:afrihost` | `village-netacad-afrihost.zip` |
| Azure App Service | `npm run package:azure` | `deploy/azure/release.zip` |

Guides: `deploy/AFRIHOST.md`, `deploy/azure/AZURE.md`

## Azure App Service

1. Create a **PHP 8.2 Linux** Web App (not Python).
2. Set **Startup Command** to `/home/site/wwwroot/startup.sh`
3. Configure Application settings from `deploy/azure/env.azure.template`
4. Deploy via GitHub Actions or `npm run deploy:azure -- -ResourceGroup YOUR_RG`

### CI/CD

| Workflow | Trigger | Notes |
|----------|---------|--------|
| `.github/workflows/main_villagenetacad.yml` | push to `main` | Portal-connected app `villagenetacad` |
| `.github/workflows/azure-app-service.yml` | manual | Uses `AZURE_WEBAPP_NAME` + `AZURE_WEBAPP_PUBLISH_PROFILE` |

Optional decoupled frontend: set `VITE_API_URL=https://your-api.azurewebsites.net` when building the SPA.

## Database

SQLite: `DATABASE_PATH=...`  
MySQL: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (optional `DB_SSL_CA` for Azure MySQL)
