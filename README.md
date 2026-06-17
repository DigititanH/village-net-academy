# Village NetAcad

Village NetAcad is a web application featuring a React frontend (Vite) and a PHP-based backend API. The project supports flexible hosting configurations, allowing deployment on standard PHP shared hosting (such as Afrihost via cPanel) or Microsoft Azure App Service.

## Repository Structure

- `frontend/`: Single Page Application (SPA) built using React and Vite.
- `backend-php/`: Core API backend containing controllers, routing, libraries, and database migrations.
- `deploy/`: Deployment automation scripts, environment configurations, and documentation.
- `docs/`: Guides for setting up local environments.

---

## Technical Architecture

The application is designed to operate in two distinct hosting topologies:

1. **Monolithic Hosting (cPanel / Standard App Service)**: The React frontend is compiled and copied into the backend's `public/` directory. The entire package is hosted on a single server instance, and the backend handles routing for both static assets and API requests.
2. **Decoupled Hosting (Azure Web App + Static Web Apps)**: The React frontend is hosted on a static hosting service, and the PHP API is hosted separately on an App Service instance. The frontend routes requests to the API backend using cross-origin endpoints.

---

## Local Development Setup

### Prerequisites

- Node.js (v18 or v20 recommended)
- PHP (v8.1 or higher)
- MySQL/MariaDB or SQLite

### Installation Steps

1. Configure the backend environment variables:
   ```bash
   cd backend-php
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   cd ..
   npm run install:all
   ```
3. Run database migrations:
   ```bash
   npm run migrate
   ```
4. Start the development servers:
   - Run the backend API server:
     ```bash
     npm run dev:backend
     ```
   - In a separate terminal, start the React dev server:
     ```bash
     npm run dev:frontend
     ```

---

## Database Configuration

The backend includes a dynamic database driver layer in `Database.php` supporting both SQLite and MySQL/MariaDB. 

### SQLite Configuration
To use SQLite, define the path to the database file in your environment:
```ini
DATABASE_PATH=backend-php/database/database.sqlite
```
The migration pipeline automatically translates MySQL schema files into SQLite-compatible schemas on-the-fly.

### MySQL Configuration
To use MySQL/MariaDB, configure the standard host parameters:
```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=village_netacad
DB_USER=root
DB_PASSWORD=
```
To enable secure SSL connections (e.g., for Azure Database for MySQL), provide the relative path to the CA PEM file:
```ini
DB_SSL_CA=database/DigiCertGlobalRootG2.crt.pem
```

---

## Build and Packaging

Build scripts are located in the `deploy/` directory:

- **UNIX Environments (macOS/Linux)**:
  Use the bash packaging tool to compile the frontend and package it with the PHP API for Azure:
  ```bash
  npm run package:azure:sh
  ```
- **Windows Environments**:
  Use the PowerShell scripts:
  - For cPanel/Afrihost: `npm run package:afrihost`
  - For Azure App Service: `npm run package:azure`

---

## CI/CD Deployment via GitHub Actions

The repository includes two separate workflows in `.github/workflows/` to deploy the application on push to the `main` branch.

### Frontend Deployment (`deploy-frontend.yml`)
Deploys the static React assets to Azure Static Web Apps.
- **Trigger**: Changes pushed to `frontend/**`.
- **Required Secrets**:
  - `AZURE_STATIC_WEB_APPS_API_TOKEN`: The deployment token retrieved from the Azure Portal overview page for your Static Web App.
  - `VITE_API_URL`: The URL of the backend API App Service (e.g., `https://village-net-acad-api.azurewebsites.net`).

### Backend Deployment (`deploy-backend.yml`)
Deploys the PHP API to Azure App Service.
- **Trigger**: Changes pushed to `backend-php/**`.
- **Required Secrets**:
  - `AZURE_WEBAPP_NAME`: The name of the Web App instance (e.g., `village-net-acad-api`).
  - `AZURE_WEBAPP_PUBLISH_PROFILE`: The XML contents of the publish profile downloaded from the Azure Portal.
