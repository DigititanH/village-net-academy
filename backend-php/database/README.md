# Database folder

MySQL/MariaDB schema and seed files for phpMyAdmin import.

| File / folder | Purpose |
|---------------|---------|
| `import.sql` | **Import this in phpMyAdmin** — full database setup |
| `tables/01_registrations.sql` | Signup / profile data (name, role, approval, verification) |
| `tables/02_logins.sql` | Login credentials (email, password, reset tokens) |
| `tables/03_*.sql` … `15_*.sql` | All other tables |
| `migrations.sql` | Incremental column changes (safe to re-run) |
| `seed.sql` | Default categories |
| `migrate.php` | Creates database and runs SQL files from CLI |

## Registration vs login

| Table | Stores |
|-------|--------|
| **`registrations`** | Profile at signup: name, role, phone, avatar, `is_verified`, `is_approved`, `verification_token` |
| **`logins`** | Auth: `email`, `password`, `reset_token`, `last_login_at` — linked by `registration_id` |

Other tables still use `user_id` → `registrations.id`.

## Import in phpMyAdmin (Afrihost / cPanel)

1. cPanel → **MySQL Databases** → create database + user.
2. phpMyAdmin → click **your database name** on the left (important).
3. **Import** tab → **Choose File** → `import.sql` → **Go**.

Do **not** paste SQL into the SQL tab (line breaks get lost).  
Do **not** import `.env` or `.env.database`.

Local dev: run `npm run migrate` instead, or create `village_netacad` in phpMyAdmin first, select it, then import `import.sql`.

Default admin after import: `admin@villagenetacad.com` / `Admin123!`

## CLI migrate (from project root)

```bash
npm run migrate
php backend-php/scripts/peek-db.php
```

Requires MySQL running and credentials in `backend-php/.env`:

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=village_netacad
DB_USER=root
DB_PASSWORD=
```
