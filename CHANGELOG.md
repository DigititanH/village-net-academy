# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-06-17

### Added
- Created a dynamic database connection compatibility layer in `Database.php` that supports both MySQL/MariaDB and SQLite based on environment variables.
- Implemented runtime SSL configuration support for MySQL databases using the `DB_SSL_CA` variable, enabling secure connections to Azure Database for MySQL Flexible Server.
- Registered custom SQLite User-Defined Functions (UDFs) for `NOW()` and `DATE_FORMAT()` to provide query compatibility with MySQL functions.
- Introduced an on-the-fly SQL translator in `migrate.php` to convert MySQL DDL statements into valid SQLite schemas during migration.
- Added a cross-platform bash packaging script `package-for-azure.sh` to compile frontend assets and bundle them with backend files on macOS and Linux.
- Added `package:azure:sh` script shortcut inside the root `package.json` for UNIX-like environments.
- Created root-level `.gitignore` to prevent tracking of local dependencies, compilation packages, and environment secrets.
- Created decoupled GitHub Actions workflows (`deploy-backend.yml` and `deploy-frontend.yml`) for monorepo-style isolated build and deployment.
- Added conditional checks (`skip_deploy_on_missing_secrets` and `if` filters) to GitHub Actions to prevent CI pipeline failures when publish profiles are not configured.
- Modified the frontend API utility to support custom API endpoints via the `VITE_API_URL` environment configuration.

### Modified
- Updated `Hosting.php` extensions checks and configuration rules to handle `pdo_sqlite` dynamically when running SQLite databases.
- Updated `Paths.php` to resolve database names using `DATABASE_PATH` first.
