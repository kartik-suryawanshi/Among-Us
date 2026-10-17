# GitStory 🚀

### Explore a GitHub repository's history in one place

GitStory is a visual explorer for public GitHub repositories. Enter a repository URL or an `owner/repo` name to get a clearer picture of its activity, contributors, programming languages, and changing files—without having to jump between multiple GitHub pages.

**Team:** Among-Us

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-success?style=for-the-badge&logo=vercel)](https://among-us-gitstory.vercel.app/)
[![Backend API](https://img.shields.io/badge/Backend_API-Render-blue?style=for-the-badge&logo=render)](https://among-us-vgv3.onrender.com)
[![Tests](https://img.shields.io/badge/Tests-54%2F54_Passing-brightgreen?style=for-the-badge&logo=node.js)](https://github.com/kartik-suryawanshi/Among-Us)

## 👥 Team

- **Kartik Vijay Suryawanshi**
- **Aniket Vijay Vasane**
- **Purvesh Sanjay Mali**

## 🔗 Project links

- **Live application:** https://among-us-gitstory.vercel.app/
- **Backend API:** https://among-us-vgv3.onrender.com
- **Source code:** https://github.com/kartik-suryawanshi/Among-Us
- **Demo video:** [Add the final demo video link](https://youtu.be/placeholder)

> The demo video URL above is a placeholder and should be replaced before submitting the project.

## 📖 What is GitStory?

A repository can have hundreds—or thousands—of commits. Understanding how it has changed over time often means opening different pages, checking contributors, and digging through file history.

GitStory brings that information into a single dashboard. It is designed for developers who want a quick overview of a project, as well as students and new contributors who are trying to understand an unfamiliar codebase.

With GitStory, you can:

- Search for a public repository using its GitHub URL or `owner/repo` format.
- Explore commit activity over the past 52 weeks and see activity by day of the week.
- View programming languages by byte count and percentage.
- Find frequently modified files and review their additions and deletions.
- Browse recent commits and inspect the files and diffs associated with a commit.
- Play **GitStory Mode**, an animated walkthrough of a repository's commit history.
- Benefit from Redis caching and PostgreSQL snapshots to reduce repeated work and retain fetched analytics.

The analytics are based on data returned by GitHub. File-change analysis covers the commits fetched by the application, so it should be treated as a view of that sample—not a guarantee about the repository's entire history.

## 🧰 Tech stack & Technical Justifications

*(Evaluated under technical architecture & tech stack justification judging criteria)*

| Area | Technology | Technical Justification & Role |
| --- | --- | --- |
| **Frontend** | React 18, TypeScript | Provides concurrent rendering and typed interfaces to reliably manage nested GitHub API data without runtime errors. |
| **Build tool** | Vite 6 | Delivers sub-second Hot Module Replacement (HMR) and optimized Rollup tree-shaking for minimal bundle size (~239 kB gzip). |
| **Styling & icons** | Tailwind CSS, Lucide React | Utility-first CSS compiling only referenced classes for zero stylesheet bloat, paired with accessible SVG icons. |
| **Charts & animation** | Recharts, HTML5 Canvas | Recharts renders responsive, hardware-accelerated SVG charts. HTML5 Canvas powers the high-performance 60 FPS Story Mode particle engine without DOM thrashing. |
| **Audio** | Web Audio API | Synthesizes dynamic audio cues directly via browser oscillators, eliminating audio file download latency and external dependencies. |
| **Backend** | Node.js 18+, Express.js, ES modules | Asynchronous non-blocking I/O allows orchestrating upstream GitHub REST sub-requests concurrently via `Promise.allSettled`. |
| **Repository data** | GitHub REST API v3 | Official upstream data source ensuring verifiable, authentic statistics (no fabricated data) with rate-limit tracking. |
| **Cache layer** | Redis (`redis` v6) | In-memory key-value cache with tiered TTLs (300s analytics, 60s commits, 3600s details) enabling sub-5ms responses and preventing GitHub rate exhaustion. Gracefully falls back if Redis is offline. |
| **Persistence** | PostgreSQL (`pg`) | Relational integrity and structured JSONB snapshot storage for historical repository audits. Gracefully skips persistence if database is offline. |
| **Deployment** | Vercel & Render | Vercel delivers the frontend via global Edge CDN with SPA rewrites; Render runs the persistent Node.js Express server to avoid serverless function timeouts. |

### Why Redis and PostgreSQL?

Redis is used as a high-speed cache, not as the source of truth. If it is unavailable, the API seamlessly attempts to fetch fresh data directly from GitHub instead without crashing.

PostgreSQL stores repository metadata and analytics snapshots as structured JSONB so previously fetched results can be audited and retained. Both services are completely optional for local development with graceful degradation.

## 🏛️ Architecture

```mermaid
graph TD
    User["Browser"]
    Frontend["Vercel: React + Vite + Tailwind"]
    Backend["Render: Node.js + Express API"]
    GitHub["GitHub REST API"]
    Redis[("Redis cache")]
    Postgres[("PostgreSQL snapshots and metadata")]

    User -->|"HTTPS"| Frontend
    Frontend -->|"REST API requests"| Backend
    Backend -->|"Check cache"| Redis
    Backend -->|"Fetch repository data"| GitHub
    Backend -->|"Save metadata and snapshots"| Postgres
    Backend -->|"JSON response and cache status"| Frontend
    Frontend -->|"Render dashboard"| User
```

In a typical request, the backend checks Redis first. If there is no usable cached response, it requests the required information from GitHub, processes the response, and stores relevant data in the cache and database when those services are configured.

## 🌟 Features

### Repository overview
View key repository details such as stars, forks, open issues, default branch, and language information.

### Commit activity
Explore commit activity over the past 52 weeks, including a breakdown by day of the week.

### Language breakdown
See the languages reported by GitHub, with byte counts and percentages.

### Frequently changed files
Identify files that appear often in the analyzed commit sample. Where available, the view also includes additions and deletions. Frequent changes indicate activity; they do not automatically mean a file has a defect.

### Contributor leaderboard
Compare contributors using the contribution data returned by GitHub, along with profile links and avatars.

### Commit inspector
Open a commit to view its SHA, message, author information, modified files, and available diffs.

### GitStory Mode
Watch an animated, canvas-based walkthrough of the repository's commit history, with visual transitions and optional sound effects.

### Caching and stored snapshots
Redis helps avoid repeating the same GitHub requests, while PostgreSQL stores metadata and analytics snapshots. Cache TTLs can differ by endpoint—for example, repository analytics, recent commits, and individual commit details can use different expiration periods.

## 📡 API reference

The backend supports repository endpoints under `/api/repositories/...` and `/api/repos/...`.

| Method | Endpoint | Description | Cache policy |
| --- | --- | --- | --- |
| `GET` | `/` | API status and endpoint directory | No cache |
| `GET` | `/api/health` | Service health and database/cache status | No cache |
| `GET` | `/api/repositories/:owner/:repo` | Repository overview | 300 seconds |
| `GET` | `/api/repositories/:owner/:repo/languages` | Language byte counts and percentages | 300 seconds |
| `GET` | `/api/repositories/:owner/:repo/activity` | 52-week commit activity and day-of-week breakdown | 300 seconds |
| `GET` | `/api/repositories/:owner/:repo/contributors` | Contributor information and contribution counts | 300 seconds |
| `GET` | `/api/repositories/:owner/:repo/frequent-files` | Frequently changed files and change statistics | 300 seconds |
| `GET` | `/api/repositories/:owner/:repo/commits?page=1&per_page=20` | Paginated commit history | 60 seconds |
| `GET` | `/api/repositories/:owner/:repo/commits/:sha` | Commit details, changed files, and available diffs | 3600 seconds |
| `GET` | `/api/repositories/:owner/:repo/analytics` | Combined repository analytics response | 300 seconds |

Cache durations are configuration/implementation details and may be adjusted. A cached response may include an `X-Cache` header such as `HIT` or `MISS`.

### Example requests

Replace `expressjs` and `express` with the owner and repository you want to explore.

```bash
curl https://among-us-vgv3.onrender.com/api/health
```

```bash
curl https://among-us-vgv3.onrender.com/api/repositories/expressjs/express
```

```bash
curl https://among-us-vgv3.onrender.com/api/repositories/expressjs/express/analytics
```

## 🛠️ Run locally

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- PostgreSQL and Redis for database persistence and caching (optional if the application is configured to run without them)

### 1. Clone the repository

```bash
git clone https://github.com/kartik-suryawanshi/Among-Us.git
cd Among-Us
```

Install the root, frontend, and backend dependencies:

```bash
npm run install:all
```

### 2. Configure the backend

Create `server/.env` and add the variables your setup needs:

```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Optional: a GitHub token raises the API rate limit for authenticated requests.
GITHUB_TOKEN=

# Optional: PostgreSQL and Redis
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gitstory
REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=300
```

Use credentials that match your local PostgreSQL setup. Do not commit `.env` files or share your GitHub token.

Unauthenticated requests to public repositories are supported, but GitHub applies lower rate limits. Configure `GITHUB_TOKEN` on the backend if you need a higher limit.

### 3. Configure the frontend

Create `client/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

Only public configuration should use a `VITE_` variable. Never put the GitHub token or database credentials in the frontend environment.

### 4. Start the application

Open two terminal windows from the repository root.

**Terminal 1 — backend**

```bash
npm run server
```

The backend should be available at `http://localhost:4000`.

**Terminal 2 — frontend**

```bash
npm run client
```

The frontend should be available at `http://localhost:5173`.

Check the backend health endpoint at `http://localhost:4000/api/health`.

### 5. Run the tests

```bash
npm test
```

The project test suite has **54/54 automated integration tests passing**. Run the command in your environment to confirm the result for your current checkout.

## 🚀 Deployment

The frontend and backend are deployed separately.

### Frontend — Vercel

1. Import the GitHub repository into [Vercel](https://vercel.com).
2. Set the project root directory to `client`.
3. Select Vite, with `npm run build` as the build command and `dist` as the output directory.
4. Set `VITE_API_URL` to `https://among-us-vgv3.onrender.com/api`.
5. Check `client/vercel.json` for the project's SPA routing and API proxy configuration.

### Backend — Render

1. Create a Web Service on [Render](https://render.com).
2. Set the root directory to `server`.
3. Use `npm install` as the build command.
4. Use `npm start` as the start command.
5. Configure the required environment variables in Render:

   - `NODE_ENV=production`
   - `CLIENT_URL=https://among-us-gitstory.vercel.app`
   - `GITHUB_TOKEN` (recommended to raise API rate limits from 60 to 5,000 req/hr)
   - `DATABASE_URL` and `REDIS_URL` if using hosted PostgreSQL and Redis

   Configure `PORT` only if required by your host; Render normally provides it automatically.

After deployment, check `/api/health` and test the repository overview and analytics endpoints. Make sure the production frontend URL is included in the backend's allowed CORS origins.

## 🧪 Implementation checklist

The project implementation checklist records these areas as completed:

- [x] Express server and health endpoint
- [x] GitHub repository URL and `owner/repo` validation
- [x] Repository metadata endpoint
- [x] Language byte counts and percentage calculations
- [x] Paginated commits and commit detail responses
- [x] Contributor statistics
- [x] 52-week activity timeline and day-of-week breakdown
- [x] Frequently changed files and code-churn analysis
- [x] PostgreSQL migrations and analytics snapshot persistence
- [x] Redis caching with TTL and fallback handling
- [x] Unified repository analytics endpoint
- [x] Automated test suite (54/54 passing tests)
- [x] Deployment configuration and API documentation

## ⚠️ Notes and limitations

- GitHub rate limits apply, especially when requests are unauthenticated.
- Activity and file-change results depend on the data available from GitHub and the commits the backend analyzes.
- Some commits may not have a linked GitHub user profile or complete author information.
- Redis and PostgreSQL need to be configured for caching and persistent snapshots; behavior without them falls back gracefully.
- The demo video link is a placeholder and needs to be updated before final submission.

---

Built by **Team Among-Us** for the hackathon. 🚀
