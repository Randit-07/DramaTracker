import { Router } from "express";
import { logger } from "../logger.js";
import { cacheGet, cacheSet } from "../cache.js";

const ANIWATCH_API = "https://api.consumet.org/anime/gogoanime";
const CACHE_TTL_ANIME = 60 * 30; // 30 min

export const animeRouter = Router();

animeRouter.get("/search", async (req, res) => {
  try {
    const query = (req.query.q as string)?.trim();
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    
    if (!query) {
      return res.status(400).json({ error: "Query 'q' required" });
    }

    const cacheKey = `aniwatch:search:${query.toLowerCase()}:${page}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const url = `${ANIWATCH_API}?query=${encodeURIComponent(query)}&page=${page}`;
    const r = await fetch(url);
    
    if (!r.ok) {
      return res.status(r.status).json({ error: "Aniwatch API request failed" });
    }

    const data = (await r.json()) as Record<string, any>;
    const results = (data.results || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      poster: a.image,
      jTitle: a.jTitle || null,
      url: a.url,
      description: a.description || null,
      updatedOn: a.updatedOn || null,
    }));

    const payload = {
      currentPage: data.currentPage || page,
      hasNextPage: data.hasNextPage || false,
      results,
    };

    await cacheSet(cacheKey, payload, CACHE_TTL_ANIME);
    res.json(payload);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Search failed" });
  }
});

animeRouter.get("/trending", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const cacheKey = `aniwatch:trending:${page}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const url = `${ANIWATCH_API}/recent-episodes?page=${page}`;
    const r = await fetch(url);
    
    if (!r.ok) {
      return res.status(r.status).json({ error: "Aniwatch API request failed" });
    }

    const data = (await r.json()) as Record<string, any>;
    const results = (data.results || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      url: a.url,
      image: a.image,
      episodeNum: a.episodeNum,
    }));

    const payload = {
      currentPage: data.currentPage || page,
      hasNextPage: data.hasNextPage || false,
      results,
    };

    await cacheSet(cacheKey, payload, CACHE_TTL_ANIME);
    res.json(payload);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Failed to fetch trending anime" });
  }
});

animeRouter.get("/:id/info", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Anime ID required" });
    }

    const cacheKey = `aniwatch:info:${id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const url = `${ANIWATCH_API}/info?id=${encodeURIComponent(id)}`;
    const r = await fetch(url);
    
    if (!r.ok) {
      if (r.status === 404) {
        return res.status(404).json({ error: "Anime not found" });
      }
      return res.status(r.status).json({ error: "Aniwatch API request failed" });
    }

    const data = (await r.json()) as Record<string, any>;
    const payload = {
      id: data.id,
      title: data.title,
      image: data.image,
      description: data.description,
      genres: data.genres,
      status: data.status,
      episodes: data.episodes,
      totalEpisodes: data.totalEpisodes,
      type: data.type,
      releaseDate: data.releaseDate,
    };

    await cacheSet(cacheKey, payload, CACHE_TTL_ANIME);
    res.json(payload);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Failed to fetch anime info" });
  }
});

animeRouter.get("/:id/episodes", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Anime ID required" });
    }

    const cacheKey = `aniwatch:episodes:${id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const url = `${ANIWATCH_API}/episodes?id=${encodeURIComponent(id)}`;
    const r = await fetch(url);
    
    if (!r.ok) {
      return res.status(r.status).json({ error: "Aniwatch API request failed" });
    }

    const data = (await r.json()) as Record<string, any>;
    const episodes = (data.episodes || []).map((ep: any) => ({
      id: ep.id,
      number: ep.number,
      title: ep.title,
      url: ep.url,
    }));

    const payload = { episodes };
    await cacheSet(cacheKey, payload, CACHE_TTL_ANIME);
    res.json(payload);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Failed to fetch episodes" });
  }
});
