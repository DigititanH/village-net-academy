# Village NetAcad — PHP API (Afrihost)

PHP 8.1+ API for **Afrihost cPanel** shared hosting. Same `/api/*` JSON API for the React frontend. No Composer, no Node.js, no background process.

## Requirements

- PHP 8.1+ with `pdo_mysql`, `json`, `mbstring`, `curl`, `fileinfo`
- MySQL 5.7+ or MariaDB 10.3+

## Setup

```bash
cp .env.example .env
# Edit DB_HOST, DB_NAME, DB_USER, DB_PASSWORD
php database/migrate.php
```

Or import `database/import.sql` in phpMyAdmin.

Default admin: `admin@villagenetacad.com` / `Admin123!`

## Local development

From project root:

```powershell
npm run dev:backend
```

Or:

```bash
php -S localhost:5000 -t public public/index.php
```

- API: http://localhost:5000/api/...
- Health: http://localhost:5000/health

## Afrihost / cPanel

1. Document root → **`backend-php/public/`**
2. `mod_rewrite` enabled (`.htaccess` in `public/`)
3. Create MySQL database + user in cPanel
4. Import **`database/import.sql`** in phpMyAdmin
5. Copy `deploy/env.production.template` → `.env` with `DB_*` credentials and writable `UPLOADS_DIR`

See [../deploy/AFRIHOST.md](../deploy/AFRIHOST.md) or [../deploy/azure/AZURE.md](../deploy/azure/AZURE.md) for Azure App Service.

## Environment

| Variable | Description |
|----------|-------------|
| `DB_HOST` | MySQL host (usually `localhost` on cPanel) |
| `DB_PORT` | MySQL port (default `3306`) |
| `DB_NAME` | Database name |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `UPLOADS_DIR` | Product images |
| `JWT_SECRET` | Bearer token signing (32+ chars in production) |
| `CLIENT_URL` | Site URL for CORS and emails |
| `API_URL` | Public API base URL |
| `PAYFAST_*` | PayFast credentials and notify URL |

## Notes

- Admin PDF reports download as plain text on shared hosting (no PDF library).
- Email: configure SMTP in `.env`, or PHP `mail()` fallback.
