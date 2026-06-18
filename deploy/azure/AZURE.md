# Deploy to Microsoft Azure App Service

**Stack:** `backend-php/` (PHP 8.2+) + SQLite + React (built into `public/`).  
**No Node.js** on the server — same app as Afrihost, different host settings.

| Requirement | Value |
|-------------|--------|
| Plan | Linux App Service (B1+ recommended for persistent `/home`) |
| Runtime | **PHP 8.2** (8.1+ supported) |
| Extensions | `pdo_sqlite`, `curl`, `mbstring`, `fileinfo`, `json` |

---

## Architecture

```
Browser → https://yourapp.azurewebsites.net
              ├── /api/*     → PHP router (index.php)
              ├── /uploads/* → files in /home/site/data/uploads
              └── /*         → React SPA (index.html)
SQLite + uploads → /home/site/data/  (persists across restarts)
```

---

## 1. Build deployment zip (local)

```powershell
cd path\to\shop-share-support-main
npm run install:all
npm run package:azure
```

Creates:

- `village-netacad-azure.zip` (project root)
- `deploy/azure/release.zip` (for CI)

Zip contents deploy **directly** to `/home/site/wwwroot` (not nested in `backend-php/`).

---

## 2. Create Azure resources

### Option A — Azure CLI (script)

```bash
chmod +x deploy/azure/provision.sh
./deploy/azure/provision.sh villagenetacad-prod rg-villagenetacad southafricanorth
az login
```

### Option B — Azure Portal

1. **Create a resource** → **Web App**
2. **Publish:** Code  
3. **Runtime stack:** PHP 8.2  
4. **Operating System:** Linux  
5. **Region:** South Africa North (or nearest)

---

## 3. Required application settings

Portal → your Web App → **Configuration** → **Application settings**:

| Name | Value |
|------|--------|
| `WEBSITE_DOCUMENT_ROOT` | `/home/site/wwwroot/public` |
| `WEBSITES_ENABLE_APP_SERVICE_STORAGE` | `true` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` |
| `NODE_ENV` | `production` |
| `DATABASE_PATH` | `/home/site/data/database.sqlite` |
| `UPLOADS_DIR` | `/home/site/data/uploads` |
| `JWT_SECRET` | 64+ random chars (`openssl rand -hex 32`) |
| `CLIENT_URL` | `https://yourapp.azurewebsites.net` |
| `API_URL` | `https://yourapp.azurewebsites.net` |
| `PAYFAST_NOTIFY_URL` | `https://yourapp.azurewebsites.net/api/payfast/notify` |
| `PAYFAST_MERCHANT_ID` | (your PayFast ID) |
| `PAYFAST_MERCHANT_KEY` | (your key) |
| `PAYFAST_SANDBOX` | `true` until live |

Template: `deploy/azure/env.azure.template`

**Startup command** (optional, creates data folders):

```
bash /home/site/wwwroot/startup.sh
```

---

## 4. Deploy the zip

### Azure CLI

```bash
az webapp deploy \
  --resource-group rg-villagenetacad \
  --name villagenetacad-prod \
  --src-path village-netacad-azure.zip \
  --type zip
```

### Portal

**Deployment Center** → ZIP deploy → upload `village-netacad-azure.zip`

### GitHub Actions

See `.github/workflows/azure-app-service.yml`. Add repository secrets:

| Secret | Description |
|--------|-------------|
| `AZURE_WEBAPP_NAME` | Web app name |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Download from Portal → **Get publish profile** |

---

## 5. Initialize database

**SSH** (Portal → **SSH** or Advanced Tools → Kudu):

```bash
cd /home/site/wwwroot
php database/migrate.php
```

**Or** upload an existing `database.sqlite` to `/home/site/data/database.sqlite`.

Default admin after migrate: `admin@villagenetacad.com` / `Admin123!` — change immediately.

---

## 6. Verify

| Check | URL |
|--------|-----|
| Site | `https://yourapp.azurewebsites.net` |
| Health | `https://yourapp.azurewebsites.net/health` |
| API | `https://yourapp.azurewebsites.net/api/...` |

Health should show `"status":"ok"` and `"hosting":"azure-app-service"`.

---

## 7. Custom domain & HTTPS

1. Portal → **Custom domains** → add domain  
2. **TLS/SSL settings** → bind certificate (App Service Managed Certificate)  
3. Update `CLIENT_URL`, `API_URL`, `PAYFAST_NOTIFY_URL` to your custom domain  
4. Restart the app

---

## 8. Go-live checklist

- [ ] `WEBSITE_DOCUMENT_ROOT` points to `public`
- [ ] SQLite and uploads under `/home/site/data` (not in `public/`)
- [ ] `JWT_SECRET` is strong (not a placeholder)
- [ ] HTTPS URLs in all env vars
- [ ] Admin password changed
- [ ] PayFast sandbox payment tested
- [ ] SMTP configured for contact email (optional)

---

## 9. Backups

`/home/site/data` persists on Linux when `WEBSITES_ENABLE_APP_SERVICE_STORAGE=true`.

- Schedule download of `database.sqlite` and `uploads/` via Kudu or Azure Backup  
- For production scale, consider **Azure Database for PostgreSQL** (requires code changes; not included today)

---

## 10. CI/CD (GitHub)

Push to `main` runs `.github/workflows/azure-app-service.yml` when secrets are set.

Manual run: **Actions** → **Deploy to Azure App Service** → **Run workflow**

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 404 on all routes | Set `WEBSITE_DOCUMENT_ROOT=/home/site/wwwroot/public` |
| 503 misconfigured | Set `JWT_SECRET`, `CLIENT_URL`, `API_URL` in Configuration |
| DB resets on restart | Enable `WEBSITES_ENABLE_APP_SERVICE_STORAGE`; use `/home/site/data` |
| React loads, API 404 | Re-deploy zip; confirm `public/index.php` exists |
| PayFast ITN fails | `PAYFAST_NOTIFY_URL` must be public HTTPS (not localhost) |

---

## Quick reference

| Item | Value |
|------|--------|
| Document root | `/home/site/wwwroot/public` |
| Data | `/home/site/data/` |
| Local package | `npm run package:azure` |
| Provision | `./deploy/azure/provision.sh APP_NAME` |

Azure docs: [App Service on Linux](https://learn.microsoft.com/azure/app-service/overview)
