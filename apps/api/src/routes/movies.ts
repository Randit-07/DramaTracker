import { Router } from "express";
import { getConfig } from "../config.js";
import { cacheGet, cacheSet } from "../cache.js";

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
    const cacheKey = `tmdb:search:${encodeURIComponent(query.toLowerCase())}:${page}`;
    const cached = await cacheGet<{ page: number; total_pages: number; total_results: number; results: unknown[] }>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const url = new URL(`${TMDB_BASE}/search/movie`);
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
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Search failed" });
  }
});

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
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to fetch movie" });
  }
});
