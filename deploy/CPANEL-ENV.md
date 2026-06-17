# cPanel `.env` setup (Afrihost)

The PHP app reads **only** `backend-php/.env`.

It does **not** read `env/env.php`, `.env.txt`, or `.env.htlm`.

## Quick deploy

1. On your PC, open `backend-php/.env` (already filled for production).
2. Confirm **DB_USER**, **DB_PASSWORD**, and **UPLOADS_DIR** match cPanel.
3. Upload to `backend-php/.env` via File Manager (enable **Show Hidden Files**).
4. Import `backend-php/database/PHPMYADMIN-IMPORT-THIS-FILE.sql` in phpMyAdmin.
5. Document root → `.../backend-php/public`
6. Test: `https://villagenetacad.co.za/health` → `"status":"ok"`

## Create on cPanel (alternative)

1. **File Manager** → `backend-php/` (same folder as `public/`, **not** inside `public/`).
2. **+ File** → name: `.env`
3. Paste contents from `backend-php/.env` or `deploy/env.cpanel.template`.
4. Save.

## Values from cPanel

| Setting | Where to find it |
|---------|------------------|
| `DB_NAME` | MySQL Databases → database name |
| `DB_USER` | MySQL Databases → user name (often `prefix_dbname`) |
| `DB_PASSWORD` | Password you set when creating the DB user |
| `UPLOADS_DIR` | `/home/YOUR_CPANEL_USER/village-netacad-data/uploads` |

`DB_HOST` is almost always `localhost` on cPanel.

## Wrong vs right

| Wrong | Right |
|-------|--------|
| `backend-php/env/env.php` | `backend-php/.env` |
| `.env.txt` | `.env` |
| `backend-php/public/.env` | `backend-php/.env` |
| Importing `.env` in phpMyAdmin | Import `PHPMYADMIN-IMPORT-THIS-FILE.sql` only |

## Required for login to work

- `NODE_ENV=production`
- `JWT_SECRET` — at least 32 characters (not `dev-secret`)
- `CLIENT_URL` and `API_URL` — your live `https://` domain
- `PAYFAST_NOTIFY_URL` — `https://villagenetacad.co.za/api/payfast/notify` if PayFast keys are set
- Database imported with admin: `admin@villagenetacad.com` / `Admin123!`

## After upload checklist

- [ ] `https://villagenetacad.co.za/health` returns JSON (not 404)
- [ ] Login works
- [ ] Change admin password after first login
