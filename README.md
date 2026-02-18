# DramaTracker

Track movies, create watch-together playlists with friends, and send recommendations. **React** frontend, **TypeScript** backend, **Supabase** (PostgreSQL). Backend deployable on **Render**, frontend on **Vercel**.

## Repo structure

```
apps/
  api/          # Express + TypeScript backend (Render)
  web/          # React + Vite frontend (Vercel)
supabase/
  schema.sql    # Run once in Supabase SQL Editor to create tables
  migrations/   # Optional migration history
```

## Features

- **Accounts** – Register and sign in
- **Search movies** – TMDB search, add to watched
- **Watched list** – Personal list
- **Watch together playlists** – Create playlists, invite friends, add movies
- **Recommendations** – Send and receive movie recommendations

## Supabase: create tables

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the contents of **`supabase/schema.sql`** (one-time).
3. In **Project Settings → API** copy **Project URL** and **service_role** key.

## Connection checklist

| Connection | Where | What to set |
|------------|--------|-------------|
| **Supabase** | API reads from `apps/api/.env` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (from Supabase Dashboard → Project Settings → API). Run `supabase/schema.sql` in SQL Editor once. |
| **API .env** | Must live in `apps/api/.env` | The API loads **only** `apps/api/.env` (not root `.env`). Copy `apps/api/.env.example` → `apps/api/.env` and fill in values. |
| **Frontend → API (dev)** | Vite proxy | Web app at localhost:5173 proxies `/api` to localhost:3001; no extra env needed. |
| **Frontend → API (prod)** | Vercel env | Set `VITE_API_URL` to your Render API URL (e.g. `https://your-api.onrender.com`). |
| **API CORS (prod)** | Render env | Set `FRONTEND_URL` to your Vercel URL (e.g. `https://your-app.vercel.app`) so the browser can call the API. |
| **Redis (optional)** | Render Redis + API | Create a Redis instance on Render, then set `REDIS_URL` in Render (use Internal Redis URL). API caches TMDB search/movie responses when `REDIS_URL` is set. |

## Local development

### 1. Install (from repo root)

```bash
npm install
```

### 2. API env (apps/api)

```bash
cp apps/api/.env.example apps/api/.env
```

Edit **`apps/api/.env`** (this is the only .env the API loads):

- `SUPABASE_URL` – Supabase project URL  
- `SUPABASE_SERVICE_ROLE_KEY` – Service role key (secret)  
- `JWT_SECRET` – Long random string  
- `TMDB_ACCESS_TOKEN` – From [TMDB API Settings](https://www.themoviedb.org/settings/api)  
- `FRONTEND_URL` – Leave empty in dev (localhost allowed by default)  
- `REDIS_URL` – Optional; leave empty unless you run Redis locally

### 3. Run

```bash
npm run dev
```

- **API:** http://localhost:3001  
- **Web:** http://localhost:5173 (proxies `/api` to API)

## Backend protection (apps/api)

- **Config** – `apps/api/src/config.ts`: validates required env, CORS origins, rate limit.
- **Helmet** – Security headers.
- **Rate limit** – 100 requests per minute per IP (configurable in config).
- **CORS** – Allowed origins from `FRONTEND_URL` (comma-separated) or localhost in dev.
- **Body size** – `express.json({ limit: "256kb" })`.

Required env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `TMDB_ACCESS_TOKEN`.  
Optional: `PORT`, `NODE_ENV`, `FRONTEND_URL`, `REDIS_URL` (Render Redis; when set, TMDB responses are cached).

## Deploy: Render (API)

1. New **Web Service** on [Render](https://render.com), connect this repo.
2. **Root Directory:** `apps/api`.
3. **Build:** `npm install && npm run build`
4. **Start:** `npm run start`
5. **Environment variables** (in Render dashboard):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `TMDB_ACCESS_TOKEN`
   - `FRONTEND_URL` = your Vercel app URL (e.g. `https://your-app.vercel.app`)
   - `REDIS_URL` = from your Render Redis instance (Connect → Internal Redis URL) for TMDB response caching

Render sets `PORT`; no need to set it.

## Deploy: Vercel (frontend)

1. New project on [Vercel](https://vercel.com), connect this repo.
2. **Root Directory:** `apps/web`.
3. **Environment variable:**
   - `VITE_API_URL` = your Render API URL (e.g. `https://your-api.onrender.com`) — no trailing slash.

Build and deploy; the app will call the API at `VITE_API_URL` in production.

## Scripts (from repo root)

| Command | Description |
|--------|-------------|
| `npm run dev` | Run API + web dev servers |
| `npm run dev:api` | Run API only |
| `npm run dev:web` | Run web only |
| `npm run build` | Build API and web |
| `npm run start` | Run built API (e.g. on Render) |

## Database schema (from supabase/schema.sql)

- **users** – id, email, password_hash, name, created_at  
- **watched_entries** – user_id, movie_id, title, poster_path, added_at  
- **playlists** – name, owner_id, created_at  
- **playlist_members** – playlist_id, user_id, joined_at  
- **playlist_movies** – playlist_id, movie_id, title, poster_path, added_by_id, added_at  
- **recommendations** – from_user_id, to_user_id, movie_id, title, poster_path, message, read_at, created_at  

## API (auth where noted)

- `POST /api/auth/register`, `POST /api/auth/login`  
- `GET /api/movies/search?q=...`, `GET /api/movies/:id` (no auth)  
- `GET/POST/DELETE /api/watched`  
- `GET/POST /api/playlists`, `GET /api/playlists/:id`, `POST .../members`, `POST .../movies`, `DELETE .../movies/:movieId`  
- `GET /api/recommendations/received`, `/sent`, `POST /api/recommendations`, `PATCH .../:id/read`  
- `GET /api/users/search?q=...`, `GET /api/users/me`  

Auth header: `Authorization: Bearer <token>`.
