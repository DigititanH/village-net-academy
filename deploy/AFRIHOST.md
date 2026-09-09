# Deploy to Afrihost (shared hosting / cPanel)

**Stack:** `backend-php/` (PHP 8.1+) + MySQL/MariaDB + React built into `backend-php/public`.  
**No Node.js** on the server.

**Requirements:** PHP 8.1+, extensions `pdo_mysql`, `curl`, `mbstring`, `fileinfo`, `json`, `openssl`.

---

## 1. Build the zip on your PC

```powershell
cd path\to\villagenetacad
npm run package:afrihost
```

Creates **`village-netacad-afrihost.zip`** (includes built frontend, PHP API, `import.sql`, deploy docs, and **`backend-php/.env`** for Afrihost).

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
  README-DEPLOY.txt
  backend-php/
    public/          ← document root
    database/import.sql
    scripts/post-deploy.php
    .env.example
  deploy/
    AFRIHOST.md
    env.production.template
    env.afrihost.env          (optional filled example)
```

---

## 4. Document root (critical)

cPanel → **Domains** → your domain → **Document Root**:

```
/home/YOUR_USER/public_html/village-netacad/backend-php/public
```

Must end in **`public`** so `.env` stays private.

---

## 5. PHP version + extensions

cPanel → **Select PHP Version** / **MultiPHP** → **8.1+** (8.2 preferred) → enable:

`pdo_mysql`, `curl`, `mbstring`, `fileinfo`, `json`, `openssl`

---

## 6. Writable uploads (outside `public`)

Under `/home/YOUR_USER/`:

1. Create `village-netacad-data/uploads/`
2. Permissions **755** or **775**

---

## 7. `.env` on the server

The zip includes **`backend-php/.env`** (Afrihost production values).

After extract, open `backend-php/.env` and confirm:

| Key | Notes |
|-----|--------|
| `DB_*` | Match your cPanel MySQL database/user |
| `UPLOADS_DIR` | `/home/YOUR_USER/village-netacad-data/uploads` |
| `JWT_SECRET` | Already set in package — keep or rotate |
| `CLIENT_URL` / `API_URL` | Public HTTPS site URLs |
| `SMTP_PASS` / `MAIL_PASSWORD` | Set the real mailbox password (replace `YOUR_EMAIL_PASSWORD`) |
| `PAYFAST_*` | Live merchant settings; URLs must be public HTTPS |

If `.env` is missing, copy `deploy/env.afrihost.env` to `backend-php/.env`.

---

## 8. Database

**Option A — phpMyAdmin (fresh install)**

1. cPanel → **MySQL Databases** → create DB + user → **All Privileges**
2. phpMyAdmin → select that database → **Import** → `backend-php/database/import.sql` → **Go**

**Option B — SSH / Terminal (fresh or upgrade)**

```bash
cd ~/public_html/village-netacad/backend-php
php scripts/post-deploy.php
```

This runs migrations, store categories, product subcategory, hero columns, and academy role.

Default admin after import/migrate: `admin@villagenetacad.com` / `Admin123!` — **change immediately**.

---

## 9. SSL

cPanel → **SSL/TLS** / AutoSSL → enable HTTPS for the domain.  
Force HTTPS if available.

---

## 10. PayFast (live)

In PayFast merchant settings, notify/return URLs must match `.env` and be public HTTPS, e.g.:

- Notify: `https://www.villagenetacad.co.za/payfast/notify.php`
- Return: `https://www.villagenetacad.co.za/payment/success`
- Cancel: `https://www.villagenetacad.co.za/payment/cancel`

Never use `localhost` on live.

---

## 11. Go-live checklist

- [ ] Document root ends with `backend-php/public`
- [ ] `https://www.villagenetacad.co.za` homepage loads (SPA + images)
- [ ] `https://www.villagenetacad.co.za/health` → status ok / DB connected
- [ ] Admin password changed
- [ ] SMTP set — register → confirmation email → verify link → login
- [ ] Shop Merchandise / Electronics + product types
- [ ] Checkout reaches PayFast (not CloudFront 403)
- [ ] Donations reach PayFast
- [ ] Admin: Hero, Products, Map academies
- [ ] Academy affiliate dashboard (map academy name matches reseller academy)

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 500 on `/api/*` | Check `.env` next to `public/`, run `php scripts/post-deploy.php`, check `/health` |
| Registration email missing | Set `SMTP_HOST/USER/PASS` (or `MAIL_*`) in `.env` |
| Blank page / wrong assets | Rebuild zip (`npm run package:afrihost`) and re-upload `public/assets` |
| Uploads fail | Fix `UPLOADS_DIR` path + folder permissions |
| PayFast CloudFront 403 | Return/cancel/notify URLs must be live HTTPS, not localhost |

---

## Backups

Weekly from cPanel:

- MySQL dump of the site database
- `/home/YOUR_USER/village-netacad-data/uploads/`

---

## Quick reference

| Item | Value |
|------|--------|
| Document root | `backend-php/public` |
| API | `https://yourdomain.co.za/api/...` |
| Health | `https://yourdomain.co.za/health` |
| PayFast ITN | `https://www.villagenetacad.co.za/payfast/notify.php` |
| Local package | `npm run package:afrihost` |
| Server upgrade | `php scripts/post-deploy.php` |

Afrihost support: [clientzone.afrihost.com](https://clientzone.afrihost.com)
