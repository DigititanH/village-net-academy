# Deploy to Afrihost (shared hosting / cPanel)

**Stack:** `backend-php/` (PHP 8.1+) + MySQL/MariaDB + React (built into `backend-php/public`).  
**No Node.js** on the server.

**Requirements:** PHP 8.1+, extensions `pdo_mysql`, `curl`, `mbstring`, `fileinfo`.

---

## 1. Build zip on your PC

```powershell
cd path\to\shop-share-support-main
npm run package:afrihost
```

Creates **`village-netacad-afrihost.zip`**.

---

## 2. DNS (Client Zone)

1. [clientzone.afrihost.com](https://clientzone.afrihost.com) → **Domains** → your domain → **DNS**
2. Point **A** records `@` and `www` to your hosting IP (from cPanel welcome email).

---

## 3. Upload (cPanel File Manager)

1. Upload the zip to `public_html` (or your domain folder).
2. Extract (e.g. into `village-netacad/`).

Expected layout:

```
village-netacad/
  backend-php/
    public/          ← document root (index.php, index.html, assets/)
    database/
    ...
  deploy/
    AFRIHOST.md
    env.production.template
```

---

## 4. Document root

cPanel → **Domains** → your domain → set **Document Root** to:

```
/home/YOUR_USER/public_html/village-netacad/backend-php/public
```

Must end in **`public`** so `.env` and the database stay private.

---

## 5. PHP version

cPanel → **Select PHP Version** / **MultiPHP** → **8.1+** → enable:

`pdo_mysql`, `curl`, `mbstring`, `fileinfo`, `json`

---

## 6. Writable data (outside `public`)

In File Manager, under `/home/YOUR_USER/`:

1. Create folder `village-netacad-data/`
2. Create `village-netacad-data/uploads/`
3. Permissions **755** or **775**

---

## 7. `.env` on the server

1. Copy `deploy/env.production.template` → `backend-php/.env`
2. Edit (use your real cPanel username in paths):

```env
NODE_ENV=production
DB_HOST=localhost
DB_NAME=YOUR_USER_villagenetacad
DB_USER=YOUR_USER_dbuser
DB_PASSWORD=YOUR_DB_PASSWORD
UPLOADS_DIR=/home/YOUR_USER/village-netacad-data/uploads
JWT_SECRET=<64+ random characters>
CLIENT_URL=https://yourdomain.co.za
API_URL=https://yourdomain.co.za
PAYFAST_NOTIFY_URL=https://yourdomain.co.za/api/payfast/notify
PAYFAST_SANDBOX=true
PAYFAST_MERCHANT_ID=...
PAYFAST_MERCHANT_KEY=...
```

---

## 8. Database

1. cPanel → **MySQL Databases** → create database + user, add user to database with **All Privileges**.
2. cPanel → **phpMyAdmin** → **Import** → choose `backend-php/database/import.sql` → **Go**.

If your host prefixes database names (e.g. `youruser_villagenetacad`), edit `import.sql` before importing or create the database in cPanel first and import only the table statements from `schema.sql` + `seed.sql`.

**Alternative (SSH):**

```bash
cd ~/public_html/village-netacad/backend-php
php database/migrate.php
```

Default admin: `admin@villagenetacad.com` / `Admin123!` — change after login.

---

## 9. SSL

cPanel → **SSL/TLS** / AutoSSL → enable HTTPS for your domain.

---

## 10. Go-live checklist

- [ ] https://yourdomain.co.za — homepage loads
- [ ] https://yourdomain.co.za/health — `"status":"ok"`, all checks green
- [ ] Login works; admin password changed
- [ ] PayFast sandbox payment tested
- [ ] SMTP set for contact form (optional)

---

## Backups

Weekly download from cPanel:

- `village-netacad-data/database.sqlite`
- `village-netacad-data/uploads/`

---

## Quick reference

| Item | Value |
|------|--------|
| Document root | `backend-php/public` |
| API | `https://yourdomain.co.za/api/...` |
| PayFast ITN | `https://yourdomain.co.za/api/payfast/notify` |
| Local build | `npm run package:afrihost` |

Afrihost support: [clientzone.afrihost.com](https://clientzone.afrihost.com)
