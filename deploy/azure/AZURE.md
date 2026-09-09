# Deploy to Azure App Service (Linux, PHP 8.2)

**Stack:** PHP API + built React SPA in `public/` (monolithic App Service).

## One-shot from Windows

```powershell
npm run package:azure
# optional if Azure CLI is logged in:
npm run deploy:azure -- -ResourceGroup YOUR_RG -AppName villagenetacad
```

Creates `deploy/azure/release.zip` (wwwroot = contents of `backend-php/` with frontend already synced into `public/`).

## App Service settings

1. **Stack:** PHP 8.2 (Linux).
2. **Startup Command:** `/home/site/wwwroot/startup.sh`  
   This points NGINX at `public/` and reloads the server.
3. **Application settings:** copy from `deploy/azure/env.azure.template`  
   Minimum: `NODE_ENV=production`, `JWT_SECRET` (≥32 chars), `CLIENT_URL`, `API_URL`, plus MySQL **or** `DATABASE_PATH`.
4. **Uploads:** set `UPLOADS_DIR=/home/site/wwwroot/uploads` (startup creates the folder).

## Database

- **MySQL (recommended):** Azure Database for MySQL Flexible Server; set `DB_*` and optionally `DB_SSL_CA=database/DigiCertGlobalRootG2.crt.pem`.
- **SQLite:** set `DATABASE_PATH=/home/site/wwwroot/database/database.sqlite`, then SSH/Kudu and run `php database/migrate.php`.

## GitHub Actions

- Workflow: `.github/workflows/main_villagenetacad.yml` (push to `main` + manual).
- Secret: `AZUREAPPSERVICE_PUBLISHPROFILE_...` (from Azure Portal publish profile).

Manual alternative: `.github/workflows/azure-app-service.yml` (`workflow_dispatch`) with secrets `AZURE_WEBAPP_NAME` + `AZURE_WEBAPP_PUBLISH_PROFILE`.

## Smoke test

- `https://YOUR_APP.azurewebsites.net/` — SPA loads  
- `https://YOUR_APP.azurewebsites.net/health` — `"status":"ok"`  
- Login and a PayFast sandbox payment if enabled  

## Local package layout (zip root)

```
public/          ← document root (index.php + index.html + assets/)
lib/
controllers/
routes/
database/
startup.sh
deploy/azure/    ← nginx-default.conf, AZURE.md, env template
```
