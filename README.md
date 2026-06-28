# Naghma — Classic Pakistani Music Discovery & Streaming App

Naghma (نغمہ) is a vintage-inspired, full-stack streaming archive for classic Pakistani music (1950s–1990s). It streams audio on-demand by resolving YouTube videos into direct media links using `yt-dlp`. It is designed with a premium "vintage record sleeve" aesthetic (deep emerald green, warm gold, cream paper noise, and rotating vinyl record animations).

---

## 🏛️ System Architecture & Fallbacks

Naghma is built to be production-ready while requiring **zero configuration** for local development. Since tools like PostgreSQL, Redis, and Python are not always pre-installed, Naghma features automated local fallback systems:

1. **Audio Streaming (yt-dlp)**:
   - *Production*: Uses `yt-dlp` executable.
   - *Local*: A setup script automatically downloads the standalone Windows binary `yt-dlp.exe` to a local `bin/` folder. This means you do **not** need to install Python locally.
2. **Database Mode**:
   - *Production*: Connects to **PostgreSQL** via a `DATABASE_URL` environment variable.
   - *Local Fallback*: Falls back to a local JSON file-based database client (`backend/data/db.json`). All queries are simulated in pure JS, working out-of-the-box.
3. **Caching Layer**:
   - *Production*: Connects to **Redis** via `REDIS_URL` to cache streaming URLs (preventing rate-limits).
   - *Local Fallback*: Falls back to a local, in-memory Map-based cache with Time-To-Live (TTL) expirations.
4. **YouTube Search API**:
   - *Production*: Uses official YouTube Data API v3 if `YOUTUBE_API_KEY` is provided.
   - *Local Fallback*: Scrapes search metadata using `yt-dlp --dump-json` queries, avoiding the need for a developer key.
5. **Archive.org Fallback**:
   - If a YouTube link fails to resolve or is geoblocked, Naghma queries the **Archive.org API** for public-domain Pakistani radio broadcasts and audio files, playing them seamlessly.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Framer Motion + Zustand + TanStack React Query (v5) + Lucide Icons.
- **Backend**: Node.js (ESM) + Express + `child_process` (yt-dlp) + pg (node-postgres) + redis.

---

## 📂 Project Structure

```
Ganay/
├── package.json         # Root scripts (starts backend + frontend concurrently)
├── docker-compose.yml   # Spins up PostgreSQL, Redis, API, and Web containers
├── .env.example         # Template for production variables
├── README.md            # Documentation
├── backend/
│   ├── package.json
│   ├── server.js        # Server Entrypoint
│   ├── .env             # Local environment configurations
│   ├── bin/
│   │   └── yt-dlp.exe   # Standalone Windows executable (downloaded on setup)
│   ├── scripts/
│   │   ├── setup-ytdlp.js # Downloads Windows yt-dlp binary
│   │   └── seed.js      # Seed collections and songs
│   └── src/
│       ├── config.js
│       ├── database.js  # Dual PostgreSQL / JSON client
│       ├── cache.js     # Dual Redis / In-memory cache client
│       ├── ytdlpService.js # Executes yt-dlp & handles fallbacks
│       └── routes.js    # API Router
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── index.html       # SEO optimized template
    └── src/
        ├── main.tsx
        ├── App.tsx      # Application layout & page router
        ├── index.css    # Tailwind v4 styles, paper noise filters, fonts
        ├── store/
        │   └── usePlayerStore.ts # Zustand global player store
        ├── components/
        │   ├── Navigation.tsx   # Sidebar / Mobile nav
        │   ├── MusicPlayer.tsx  # Persistent bar & fullscreen vinyl animations
        │   ├── SongCard.tsx     # Item card with slide-out vinyl on hover
        │   └── CollectionCard.tsx # Gold-ornamented playlist card
        └── pages/
            ├── Home.tsx         # Hero banner, singer shelf, collections list
            ├── Search.tsx       # Text query, decade chips, genre tags
            └── Collections.tsx  # Collection catalog and song list details
```

---

## 🚀 Quick Start Guide

### 1. Install & Setup
Run the setup command from the project root. This installs root dependencies, installs frontend/backend dependencies, and downloads the Windows `yt-dlp.exe` binary:
```bash
npm run setup
```

### 2. Seed Database
Populate the database (either PostgreSQL or `db.json`) with vintage collections (Mehdi Hassan, Noor Jehan, Qawwalis, Pop Hits):
```bash
npm run seed
```

### 3. Start Development Servers
Run the development command in the root folder. It starts the backend API (port `5000`) and the frontend React app (port `5173`) concurrently:
```bash
npm run dev
```

Open your browser to [http://localhost:5173](http://localhost:5173) to listen.

---

## 🐳 Docker Deployment

To spin up PostgreSQL, Redis, the backend server, and the Nginx-hosted frontend inside Docker:
```bash
docker-compose up --build
```
This serves:
- Web Client: `http://localhost` (Port 80)
- API Server: `http://localhost:5000`

---

## 📡 REST API Endpoints

- `GET  /api/search?q={query}&decade={1970s}&genre={Ghazal}`
  - Searches database and YouTube (via yt-dlp). Caches results.
- `GET  /api/stream?videoId={youtube_video_id}`
  - Resolves a fresh, direct CDN audio streaming URL. Increments song play counts.
- `GET  /api/collections`
  - Retrieves all curated album sleeve collections.
- `GET  /api/collections/{id}`
  - Retrieves a specific collection and its list of songs.
- `GET  /api/discover`
  - Returns a random song from the archives (Surprise Me feature).
- `GET  /api/singer/{name}`
  - Returns songs associated with a singer.
- `GET  /api/trending`
  - Returns the top 10 most played songs.
- `POST /api/playlist`
  - Saves/creates user playlists.
- `GET  /api/playlists?userId={id}`
  - Fetches playlists.

---

## 🎨 Visual Signature Features

1. **Spinning Vinyl Record**: Fully animated black vinyl grooves with a rotating cover art sticker. The center label border changes color depending on the decade of the song:
   - **1950s/1960s**: Vintage Sepia/Gold (`#C9A84C`)
   - **1970s**: Retro Emerald Green (`#1A4A3A`)
   - **1980s**: Vibrant Rust/Orange (`#B85C38`)
   - **1990s**: Vintage Teal/Blue (`#2B6777`)
2. **Slide-Out Hover Animation**: In the song card grid, hovering over the sleeve slides the grooved vinyl disc out from behind the cover art.
3. **Paper Noise Overlay**: Uses a pure CSS SVG turbulence filter overlay to simulate vintage textured paper grain.
