import { Router } from "express";
import { getConfig } from "../config.js";
import { cacheGet, cacheSet } from "../cache.js";
import { logger } from "../logger.js";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const CACHE_TTL_SEARCH = 60 * 10; // 10 min
const CACHE_TTL_MOVIE = 60 * 60; // 1 hour

export const moviesRouter = Router();

function getTmdbHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getConfig().tmdbAccessToken}`,
    accept: "application/json",
  };
}

moviesRouter.get("/search", async (req, res) => {
  try {
    const query = (req.query.q as string)?.trim();
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    if (!query) {
      res.status(400).json({ error: "Query 'q' required" });
      return;
    }
    const type = (req.query.type as string) || "movie";
    const cacheKey = `tmdb:search:${type}:${encodeURIComponent(query.toLowerCase())}:${page}`;
    const cached = await cacheGet<{ page: number; total_pages: number; total_results: number; results: unknown[] }>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const url = new URL(`${TMDB_BASE}/search/${type}`);
    url.searchParams.set("query", query);
    url.searchParams.set("page", String(page));
    url.searchParams.set("include_adult", "false");
    url.searchParams.set("language", "en-US");

    const r = await fetch(url.toString(), { headers: getTmdbHeaders() });
    if (!r.ok) {
      const text = await r.text();
      res.status(r.status).json({ error: "TMDB request failed", detail: text });
      return;
    }
    const data = (await r.json()) as {
      page: number;
      total_pages: number;
      total_results: number;
      results?: Array<{
        id: number;
        title: string;
        overview?: string;
        release_date?: string;
        poster_path?: string;
        backdrop_path?: string;
        vote_average?: number;
        vote_count?: number;
      }>;
    };
    const results = (data.results || []).map((m) => ({
      id: m.id,
      title: m.title,
      overview: m.overview,
      release_date: m.release_date,
      poster_path: m.poster_path ? TMDB_IMAGE_BASE + m.poster_path : null,
      backdrop_path: m.backdrop_path ? TMDB_IMAGE_BASE + m.backdrop_path : null,
      vote_average: m.vote_average,
      vote_count: m.vote_count,
    }));
    const payload = { page: data.page, total_pages: data.total_pages, total_results: data.total_results, results };
    await cacheSet(cacheKey, payload, CACHE_TTL_SEARCH);
    res.json(payload);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Search failed" });
  }
});

// Trending / discover endpoint
// Query params: media=movie|tv (default movie), genre (comma-separated ids), page
moviesRouter.get("/trending", async (req, res) => {
  try {
    const media = (req.query.media as string) || "movie";
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const genres = (req.query.genre as string) || "";

    // If genres provided use discover endpoint (supports with_genres), else use trending (day)
    let url: string;
    if (genres.trim()) {
      url = `${TMDB_BASE}/discover/${media}?language=en-US&page=${page}&sort_by=popularity.desc&with_genres=${encodeURIComponent(
        genres
      )}`;
    } else {
      url = `${TMDB_BASE}/trending/${media}/day?page=${page}`;
    }

    const cacheKey = `tmdb:trending:${media}:${genres}:${page}`;
    const cached = await cacheGet<{ page: number; total_pages: number; total_results: number; results: unknown[] }>(cacheKey);
    if (cached) return res.json(cached);

    const r = await fetch(url, { headers: getTmdbHeaders() });
    if (!r.ok) return res.status(r.status).json({ error: "TMDB request failed" });
    const data = await r.json();
    const results = (data.results || []).map((m: any) => ({
      id: m.id,
      title: m.title ?? m.name,
      media_type: m.media_type ?? media,
      overview: m.overview ?? m.biography ?? null,
      poster_path: m.poster_path ? TMDB_IMAGE_BASE + m.poster_path : null,
      backdrop_path: m.backdrop_path ? TMDB_IMAGE_BASE + m.backdrop_path : null,
      vote_average: m.vote_average ?? m.vote_average,
    }));
    const payload = { page: data.page ?? page, total_pages: data.total_pages ?? 1, total_results: data.total_results ?? results.length, results };
    await cacheSet(cacheKey, payload, CACHE_TTL_SEARCH);
    res.json(payload);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Failed to fetch trending" });
  }
});

// Get TMDB genre list for movie or tv
moviesRouter.get("/genres", async (req, res) => {
  try {
    const media = (req.query.media as string) || "movie";
    const cacheKey = `tmdb:genres:${media}`;
    const cached = await cacheGet<{ genres: Array<{ id: number; name: string }> }>(cacheKey as any);
    if (cached) return res.json(cached);
    const url = `${TMDB_BASE}/genre/${media}/list?language=en-US`;
    const r = await fetch(url, { headers: getTmdbHeaders() });
    if (!r.ok) return res.status(r.status).json({ error: "TMDB request failed" });
    const data = await r.json();
    await cacheSet(cacheKey, data, CACHE_TTL_MOVIE);
    res.json(data);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Failed to fetch genres" });
  }
});

// Person details
moviesRouter.get("/person/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid person id" });
    const cacheKey = `tmdb:person:${id}`;
    const cached = await cacheGet<Record<string, unknown>>(cacheKey);
    if (cached) return res.json(cached);
    const url = `${TMDB_BASE}/person/${id}`;
    const r = await fetch(url, { headers: getTmdbHeaders() });
    if (!r.ok) {
      if (r.status === 404) return res.status(404).json({ error: "Person not found" });
      return res.status(r.status).json({ error: "TMDB request failed" });
    }
    const p = await r.json();
    const payload = {
      id: p.id,
      name: p.name,
      biography: p.biography,
      birthday: p.birthday,
      profile_path: p.profile_path ? TMDB_IMAGE_BASE + p.profile_path : null,
      known_for: p.known_for,
    };
    await cacheSet(cacheKey, payload, CACHE_TTL_MOVIE);
    res.json(payload);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Failed to fetch person" });
  }
});

moviesRouter.get("/tv/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid tv id" });
    const cacheKey = `tmdb:tv:${id}`;
    const cached = await cacheGet<Record<string, unknown>>(cacheKey);
    if (cached) return res.json(cached);
    const url = `${TMDB_BASE}/tv/${id}?language=en-US`;
    const r = await fetch(url, { headers: getTmdbHeaders() });
    if (!r.ok) {
      if (r.status === 404) return res.status(404).json({ error: "TV not found" });
      return res.status(r.status).json({ error: "TMDB request failed" });
    }
    const t = await r.json();
    const payload = {
      id: t.id,
      name: t.name,
      overview: t.overview,
      first_air_date: t.first_air_date,
      poster_path: t.poster_path ? TMDB_IMAGE_BASE + t.poster_path : null,
      backdrop_path: t.backdrop_path ? TMDB_IMAGE_BASE + t.backdrop_path : null,
      vote_average: t.vote_average,
      vote_count: t.vote_count,
      genres: t.genres,
      seasons: t.seasons,
    };
    await cacheSet(cacheKey, payload, CACHE_TTL_MOVIE);
    res.json(payload);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Failed to fetch tv" });
  }
});

// Videos for TV
moviesRouter.get('/tv/:id/videos', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const cacheKey = `tmdb:videos:tv:${id}`;
    const cached = await cacheGet<Record<string, unknown>>(cacheKey);
    if (cached) return res.json(cached);
    const url = `${TMDB_BASE}/tv/${id}/videos?language=en-US`;
    const r = await fetch(url, { headers: getTmdbHeaders() });
    if (!r.ok) return res.status(r.status).json({ error: 'TMDB request failed' });
    const data = await r.json();
    await cacheSet(cacheKey, data, CACHE_TTL_SEARCH);
    res.json(data);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: 'Failed to fetch tv videos' });
  }
});

// Videos (trailers) for movie
moviesRouter.get('/:id/videos', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const cacheKey = `tmdb:videos:movie:${id}`;
    const cached = await cacheGet<Record<string, unknown>>(cacheKey);
    if (cached) return res.json(cached);
    const url = `${TMDB_BASE}/movie/${id}/videos?language=en-US`;
    const r = await fetch(url, { headers: getTmdbHeaders() });
    if (!r.ok) return res.status(r.status).json({ error: 'TMDB request failed' });
    const data = await r.json();
    await cacheSet(cacheKey, data, CACHE_TTL_SEARCH);
    res.json(data);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get movie details by ID (must be last - catch-all route)
moviesRouter.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid movie id" });
      return;
    }
    const cacheKey = `tmdb:movie:${id}`;
    const cached = await cacheGet<Record<string, unknown>>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const url = `${TMDB_BASE}/movie/${id}?language=en-US`;
    const r = await fetch(url, { headers: getTmdbHeaders() });
    if (!r.ok) {
      if (r.status === 404) res.status(404).json({ error: "Movie not found" });
      else res.status(r.status).json({ error: "TMDB request failed" });
      return;
    }
    const m = (await r.json()) as {
      id: number;
      title: string;
      overview?: string;
      release_date?: string;
      poster_path?: string;
      backdrop_path?: string;
      vote_average?: number;
      vote_count?: number;
      runtime?: number;
      genres?: Array<{ id: number; name: string }>;
    };
    const payload = {
      id: m.id,
      title: m.title,
      overview: m.overview,
      release_date: m.release_date,
      poster_path: m.poster_path ? TMDB_IMAGE_BASE + m.poster_path : null,
      backdrop_path: m.backdrop_path ? TMDB_IMAGE_BASE + m.backdrop_path : null,
      vote_average: m.vote_average,
      vote_count: m.vote_count,
      runtime: m.runtime,
      genres: m.genres,
    };
    await cacheSet(cacheKey, payload, CACHE_TTL_MOVIE);
    res.json(payload);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to fetch movie" });
  }
});
