# aaPanel Deployment Guide for Ganay (Naghma)

This document provides a step-by-step guide to deploying the **Ganay (Naghma)** Pakistani Music Discovery application on a Linux server running **aaPanel**.

---

## Architecture Overview

The application consists of two main components:
1. **Frontend (Vite / React / TypeScript)**: Compiles down to static HTML, CSS, and JS. Served directly via Nginx.
2. **Backend (Node.js / Express)**: Runs as a persistent Node.js service using aaPanel's Node Project Manager or PM2. Communicates with YouTube/Archive.org and serves API requests.
3. **Database & Cache (Optional)**:
   - **Database**: Defaults to a local JSON file (`backend/data/db.json`) or connects to PostgreSQL.
   - **Cache**: Defaults to local in-memory caching or connects to Redis.

---

## Prerequisites

Before starting, ensure the following are installed via the aaPanel **App Store**:
* **Nginx** (any stable version, e.g., 1.22+)
* **Node.js Version Manager** (or **PM2 Manager**)
* **PostgreSQL Manager** *(Optional, if using PostgreSQL)*
* **Redis** *(Optional, if using Redis caching)*

Ensure Python 3 is installed on your Linux server (required for `yt-dlp` to execute). Most Linux distributions have this pre-installed, but you can verify it by running `python3 --version`.

---

## Step 1: Configure the API URL for Frontend

The React frontend has been configured to check Vite's environment variables (`import.meta.env.VITE_API_URL`) at build time. By default, it falls back to your local development server (`http://192.168.19.32:5001`).

To point the frontend to your hosting server's API, you can either:
1. Create a `.env.production` file in the `frontend/` directory with:
   ```env
   VITE_API_URL=https://api.yourdomain.com
   ```
2. Or supply it directly when running the build command in **Step 2**.

---

## Step 2: Build the Frontend

On your local machine, compile the React frontend:

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the production package, passing your hosting server's API URL:
   - **On Linux / macOS**:
     ```bash
     VITE_API_URL=https://api.yourdomain.com npm run build
     ```
   - **On Windows (PowerShell)**:
     ```powershell
     $env:VITE_API_URL="https://api.yourdomain.com"; npm run build
     ```
   - **If you created a `.env.production` file**:
     ```bash
     npm run build
     ```
   ```
This will generate a `dist` folder inside `frontend/dist/`. This static folder contains the files you will upload to aaPanel for the website.

---

## Step 3: Deploy the Frontend Website in aaPanel

1. Log in to your **aaPanel control panel**.
2. Go to **Website** > **Add site**.
3. Fill in the details:
   - **Domain**: `yourdomain.com` (your main frontend domain)
   - **Database**: Do not create (frontend is static)
   - **Root directory**: Keep default (e.g., `/www/wwwroot/yourdomain.com`)
4. Click **Submit**.
5. Once created, click on the site's path to open the File Manager. Delete all default files (like `index.html`, `404.html`) in that directory.
6. Upload the **contents** of your local `frontend/dist/` directory directly into the root folder of this website.

---

## Step 4: Deploy the Backend API in aaPanel

### 1. Upload Backend Files
1. Create a new directory for your backend (e.g., `/www/wwwroot/api.yourdomain.com` or `/www/wwwroot/ganay-backend`).
2. Upload the `backend/` directory from your repository to this server folder.
3. Upload the `.env.example` to this folder, rename it to `.env`, and configure it.

### 2. Configure the `.env` File
Create or modify the `.env` file in the backend root directory:
```env
PORT=5001
NODE_ENV=production

# Database Config (Leave empty to use local JSON file database)
# DATABASE_URL=postgresql://db_user:db_password@localhost:5432/db_name

# Cache Config (Leave empty to use local in-memory caching)
# REDIS_URL=redis://127.0.0.1:6379

# YouTube Data API Key (Optional)
# YOUTUBE_API_KEY=your_api_key_here
```

### 3. Setup `yt-dlp` for Linux Server
Because `yt-dlp` is a Python executable, the Windows version (`yt-dlp.exe`) in the repo will not work on Linux. You must fetch the Linux binary:

1. Open the **aaPanel Terminal** (or SSH into your server).
2. Navigate to your backend directory:
   ```bash
   cd /www/wwwroot/ganay-backend
   ```
3. Create the `bin` directory if it doesn't exist:
   ```bash
   mkdir -p bin
   ```
4. Download the latest Linux release of `yt-dlp` into this folder:
   ```bash
   curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o bin/yt-dlp
   ```
5. Grant execute permissions to the binary:
   ```bash
   chmod +x bin/yt-dlp
   ```

### 4. Create Node.js Project in aaPanel
1. In aaPanel, go to **Website** > **Node Projects** (or open the **PM2 Manager** app from App Store).
2. Click **Add Node Project**.
3. Configure the fields:
   - **Path**: `/www/wwwroot/ganay-backend`
   - **Project Name**: `ganay-backend`
   - **Run Command**: Choose `npm start` or specify `server.js` as the startup file.
   - **Node.js Version**: Select Node v18+ or v20+.
   - **Port**: `5001` (Must match the `PORT` in your `.env` file)
4. Click **Submit**. The manager will automatically run `npm install` and start the Node process.

---

## Step 5: Database Seeding (Optional)

If you wish to populate the database with default classic Pakistani singer collections and songs:
1. Access the terminal inside your backend directory:
   ```bash
   cd /www/wwwroot/ganay-backend
   ```
2. Execute the seed script:
   ```bash
   node scripts/seed.js
   ```
This will either initialize schemas and seed your PostgreSQL database, or construct the local `backend/data/db.json` database.

---

## Step 6: Configure Reverse Proxy & SSL

To ensure security (HTTPS) and avoid CORS issues, route your backend through a domain name.

### Option A: Hosting Backend on a Subdomain (e.g. `api.yourdomain.com`)
1. Create a new website in aaPanel with the domain `api.yourdomain.com`. Set its root directory to a blank folder.
2. Click on the newly created website, go to **SSL**, and generate a free Let's Encrypt certificate. Turn on **Force HTTPS**.
3. Go to the site settings > **Reverse Proxy** > **Add reverse proxy**.
   - **Proxy Name**: `api-proxy`
   - **Target URL**: `http://127.0.0.1:5001` (The address of the running Node.js service)
   - **Sent Domain**: `$host`
4. Click **Submit**.

### Option B: Hosting Backend under a Subpath (e.g. `yourdomain.com/api`)
If you want both frontend and backend on the same domain:
1. Click on your main frontend website (`yourdomain.com`).
2. Go to **SSL**, generate a Let's Encrypt certificate, and enable **Force HTTPS**.
3. Go to site settings > **Reverse Proxy** > **Add reverse proxy**.
   - **Proxy Name**: `api-proxy`
   - **Target URL**: `http://127.0.0.1:5001`
   - **Path**: `/api` (Matches request paths starting with `/api`)
   - **Sent Domain**: `$host`
4. Click **Submit**.

---

## Git Integration for Seamless Updates (Push & Pull)

Instead of manually uploading zip files or copying folders via the aaPanel File Manager, it is highly recommended to use a Git repository (like GitHub, GitLab, or Gitea). This allows you to manage local development changes and pull updates onto your production server easily.

### 1. Initialize Git Locally (Your PC)
If you haven't already initialized Git in your project directory:
1. Initialize the repository:
   ```bash
   git init
   ```
2. Create a `.gitignore` in your project root to exclude local configs, database files, and node packages:
   ```gitignore
   node_modules/
   dist/
   .env
   backend/data/db.json
   frontend/android/
   ```
3. Commit your changes:
   ```bash
   git add .
   git commit -m "Initial commit"
   ```
4. Create a repository on GitHub (e.g., `github.com/username/naghma`) and link it:
   ```bash
   git remote add origin https://github.com/username/naghma.git
   git branch -M main
   git push -u origin main
   ```

### 2. Set Up Git on the Production Server (aaPanel)
1. SSH into your server (or open the **aaPanel Terminal**).
2. Generate an SSH key on your server if using private repositories:
   ```bash
   ssh-keygen -t ed25519 -C "server@yourdomain.com"
   cat ~/.ssh/id_ed25519.pub
   ```
   Add this public key to your GitHub repository's **Deploy Keys** with read-only access.
3. Clone your repository directly into the server's web directory:
   ```bash
   git clone git@github.com:username/naghma.git /www/wwwroot/naghma
   ```

### 3. Workflow for Rolling Out Updates
Whenever you make improvements or changes locally (such as fixing song links, updating lists, or adding features):
1. **On your local computer (PC)**:
   ```bash
   git add .
   git commit -m "feat: updated country filter and self-healing link database"
   git push origin main
   ```
2. **On the production server (aaPanel)**:
   Navigate to the repository folder and pull the latest changes:
   ```bash
   cd /www/wwwroot/naghma
   git pull origin main
   ```
3. **Rebuild the Frontend (If client code changed)**:
   ```bash
   cd frontend
   # Ensure devDependencies (like TypeScript/Vite) are installed on the server
   npm install --include=dev
   npm run build
   # copy the new dist folder contents to the website's document root
   cp -r dist/* /www/wwwroot/yourdomain.com/
   ```
4. **Restart the Backend Service (If server code changed)**:
   - Go to aaPanel > **Website** > **Node Projects**.
   - Find `ganay-backend` and click **Restart**.

---

## Troubleshooting

### `yt-dlp` Streaming Failures
If songs fail to play, check the backend server logs via aaPanel Node Project Manager.
- Ensure **Python 3** is installed on the host server:
  ```bash
  python3 --version
  ```
- Ensure the binary has execute permissions:
  ```bash
  chmod +x /www/wwwroot/ganay-backend/bin/yt-dlp
  ```
- Ensure the server has outbound access to YouTube. Some hosting providers block outgoing traffic on certain ports or IPs.
