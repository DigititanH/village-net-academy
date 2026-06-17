# Deployment checklist

Run locally before upload:

```powershell
npm run prepare:deploy
```

## Afrihost (cPanel)

1. Upload `village-netacad-afrihost.zip` and extract
2. Document root → `backend-php/public`
3. Copy `deploy/env.production.template` → `backend-php/.env`
4. Create `~/village-netacad-data/` (database + uploads)
5. `php backend-php/database/migrate.php` (SSH) or upload `database.sqlite`
6. https://yourdomain.co.za/health → `"status":"ok"`

## Azure App Service

1. Set app settings from `deploy/azure/env.azure.template`
2. Deploy `village-netacad-azure.zip` or run GitHub Action (workflow_dispatch)
3. SSH: `cd /home/site/wwwroot && php database/migrate.php`
4. https://YOUR_APP.azurewebsites.net/health

## Production `.env` (required)

- `JWT_SECRET` — 64+ random chars (not the dev placeholder)
- `CLIENT_URL` / `API_URL` — your public HTTPS URL
- `PAYFAST_NOTIFY_URL` — public HTTPS (not localhost)
- Change default admin password after migrate
