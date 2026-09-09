# Install PHP on Windows (Village NetAcad)

Use this to run the **PHP API** (`backend-php/`) locally before deploying to Afrihost.

## Option A — Winget (fastest)

Open **PowerShell** (not necessarily Admin):

```powershell
winget install --id PHP.PHP.8.3 -e --accept-package-agreements --accept-source-agreements
```

Close and reopen the terminal, then:

```powershell
php -v
```

If `php` is not recognized, restart Cursor/VS Code or log out and back in.

### Enable MySQL (required)

Winget’s PHP zip ships without `php.ini`. One-time setup:

1. Find PHP folder:
   ```powershell
   (Get-Command php).Source
   ```
   Example: `C:\Users\diteb\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.3_...\php.exe`

2. In that folder, copy `php.ini-development` → `php.ini`.

3. Edit `php.ini` and uncomment (remove leading `;`):
   - `extension_dir = "ext"`
   - `extension=curl`
   - `extension=mbstring`
   - `extension=openssl`
   - `extension=pdo_mysql`
   - `extension=mysqli`
   - `extension=fileinfo`

4. Verify:
   ```powershell
   php -m | findstr mysql
   ```
   You should see `pdo_mysql` and `mysqli`.

5. Install **MySQL** or **XAMPP**, create database `village_netacad`, and set credentials in `backend-php/.env`.

---

## Option B — Manual download

1. https://windows.php.net/download/
2. Download **VS16 x64 Thread Safe** ZIP (PHP 8.3).
3. Extract to e.g. `C:\php`
4. Add `C:\php` to **System → Environment Variables → Path**
5. Copy `php.ini-development` to `php.ini` and enable extensions as above.

---

## Run the project

**Terminal 1 — PHP API:**

```powershell
cd c:\Users\diteb\Downloads\shop-share-support-main\shop-share-support-main
npm run dev:backend
```

Or:

```powershell
cd backend-php
php -S localhost:5000 -t public public/index.php
```

**Terminal 2 — React:**

```powershell
npm run dev:frontend
```

- Site: http://localhost:5173  
- API health: http://localhost:5000/health  
- Database: MySQL (`village_netacad`) — import `backend-php/database/import.sql` or run `npm run migrate`  
- View DB: `php backend-php/scripts/peek-db.php`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `php` not recognized | Restart terminal; check Path includes PHP folder |
| `could not find driver` | Enable `pdo_mysql` in `php.ini` and ensure MySQL is running |
| Port 5000 in use | `Get-NetTCPConnection -LocalPort 5000` then stop the process using that port |
| CORS errors | Ensure `CLIENT_URL=http://localhost:5173` in `backend-php/.env` |

---

## Afrihost

On shared hosting, PHP is usually pre-installed. Upload `backend-php/` and set document root to `backend-php/public/` — no local install needed.

See [deploy/AFRIHOST.md](../deploy/AFRIHOST.md).
