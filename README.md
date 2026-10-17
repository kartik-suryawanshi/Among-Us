# GitStory 🚀
### Visual GitHub Repository & Commit History Explorer

GitStory is an interactive, visual repository intelligence explorer built for hackathons and developer teams. It transforms raw GitHub repositories into engaging, insightful visual narratives—featuring programming language breakdowns, 52-week commit velocity timelines, contributor leaderboards, code churn hotspots, commit diff inspection, and an animated Story Mode trailer engine with particle morphing.

---

## 🌟 Key Features

- **🔎 Smart Repository Search:** Instant resolution of GitHub URLs (`https://github.com/owner/repo`) and shorthand identifiers (`owner/repo`), with input validation and security sanitization.
- **📊 Unified Analytics Engine (`Stage 12`):** Aggregates complete repository metadata, language distribution, contributor statistics, commit history, and activity timelines in a single resilient API call (`/api/repositories/:owner/:repo/analytics`).
- **📈 52-Week Activity & Velocity:** Visualizes commit frequency over the past year and day-of-week productivity patterns using interactive charts.
- **🔥 Code Churn Hotspots:** Identifies frequently modified files and tracks cumulative additions and deletions to pinpoint high-activity modules.
- **👥 Contributor Leaderboard:** Interactive cards and rankings showing top contributors, avatars, and commit share.
- **🔍 Deep Commit Inspector:** Side-by-side commit viewer displaying author details, SHA, full commit messages, and color-coded file diffs.
- **🎬 Interactive Story Engine:** Animated canvas trailer featuring particle morphing, audio-visual feedback, and commit-by-commit repository journey playback.
- **⚡ Dual Caching & Resilience:** Integrated Redis caching (300s TTL) with `X-Cache: HIT/MISS` headers and PostgreSQL snapshot persistence. Operates with 100% graceful degradation if databases or cache layers are offline.

---

## 🏛️ System Architecture

```mermaid
graph TD
    Client["React + Vite Client<br/>(Tailwind CSS + Recharts + Lucide)"]
    Server["Express.js Server (Port 4000)"]
    GitHub["Official GitHub REST API v3"]
    PostgreSQL[("PostgreSQL Database<br/>(Snapshots & Repos)")]
    Redis[("Redis Cache<br/>(TTL Caching)")]

    Client -->|"HTTP / REST API"| Server
    Server -->|"Cached Query"| Redis
    Server -->|"Persist Snapshots"| PostgreSQL
    Server -->|"Rate-Limited REST"| GitHub
```

---

## 📡 API Reference

All repository endpoints are accessible via `/api/repositories/...` and `/api/repos/...` aliases.

| Method | Endpoint | Description | Cache Policy |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health, uptime, and database/cache status | No cache |
| `GET` | `/api/repositories/:owner/:repo` | Repository overview (stars, forks, open issues, license) | Redis (300s) |
| `GET` | `/api/repositories/:owner/:repo/languages` | Programming language byte distribution and percentages | Redis (300s) |
| `GET` | `/api/repositories/:owner/:repo/activity` | 52-week commit activity timeline & day-of-week breakdown | Redis (300s) |
| `GET` | `/api/repositories/:owner/:repo/contributors` | Contributor rankings, avatars, and commit counts | Redis (300s) |
| `GET` | `/api/repositories/:owner/:repo/frequent-files` | Hotspots & frequently changed files analysis | Redis (300s) |
| `GET` | `/api/repositories/:owner/:repo/commits` | Paginated commit history (`?page=1&per_page=20`) | Redis (60s) |
| `GET` | `/api/repositories/:owner/:repo/commits/:sha` | Commit detail with modified files and unified diffs | Redis (3600s) |
| `GET` | `/api/repositories/:owner/:repo/analytics` | **Stage 12 Unified Analytics Bundle** | Redis (300s) |

---

## 🛠️ Quickstart & Local Setup

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- *(Optional)* PostgreSQL & Redis for full persistence and caching

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/kartik-suryawanshi/Among-Us.git
cd Among-Us

# Install root, backend, and frontend dependencies
npm run install:all
```

### 2. Configure Environment Variables

**Backend (`server/.env`):**
```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Optional: Add GitHub token to increase rate limit from 60 to 5,000 req/hr
GITHUB_TOKEN=

# Optional: PostgreSQL & Redis
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gitstory
REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=300
```

**Frontend (`client/.env`):**
```env
VITE_API_URL=http://localhost:4000/api
```

### 3. Run the Development Servers
Open two terminal windows:

```bash
# Terminal 1: Backend Express Server (starts on http://localhost:4000)
npm run server

# Terminal 2: Frontend Vite Client (starts on http://localhost:5173)
npm run client
```

### 4. Run Automated Test Suite
```bash
# Run backend test suite (54 automated tests)
npm test
```

---

## 🚀 Production Deployment

### Frontend (Vercel)
1. Link repository on [Vercel](https://vercel.com).
2. Set Root Directory to `client`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variable: `VITE_API_URL=https://your-backend.onrender.com/api`
6. `client/vercel.json` is pre-configured for client-side SPA routing.

### Backend (Render / Railway)
1. Deploy as a Web Service on [Render](https://render.com).
2. Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment Variables:
   - `PORT=4000`
   - `CLIENT_URL=https://your-frontend.vercel.app`
   - `GITHUB_TOKEN=your_token`
   - *(Optional)* Provision Managed PostgreSQL and Redis instances and attach `DATABASE_URL` and `REDIS_URL`.

---

## 🧪 Hackathon Verification Checklist

- [x] **Stage 1:** Architecture & repo discovery complete
- [x] **Stage 2:** Express.js app initialized with `/api/health`
- [x] **Stage 3:** GitHub URL and owner/repo parser with validation middleware
- [x] **Stage 4:** Real GitHub repository metadata endpoint
- [x] **Stage 5:** Language breakdown with byte counts and percentage calculations
- [x] **Stage 6:** Paginated commits and commit detail with colored unified diffs
- [x] **Stage 7:** Contributor statistics with rankings and commit frequency
- [x] **Stage 8:** 52-week activity timeline and day-of-week productivity distribution
- [x] **Stage 9:** Code churn hotspots and frequently changed files analysis
- [x] **Stage 10:** PostgreSQL database migrations and analytics snapshot persistence
- [x] **Stage 11:** Redis caching layer with TTL and offline fallback
- [x] **Stage 12:** Complete unified analytics API endpoint (`GET /api/repositories/:owner/:repo/analytics`)
- [x] **Stage 13:** End-to-end integration testing and automated test suite (54/54 tests passing)
- [x] **Stage 14:** Production deployment preparation (`client/vercel.json`, Render build scripts)
- [x] **Stage 15:** Comprehensive documentation, architecture diagram, and API contracts

---

## 👥 Contributors
- **Kartik Suryawanshi** ([@kartik-suryawanshi](https://github.com/kartik-suryawanshi))
- **GitStory Development Team**
