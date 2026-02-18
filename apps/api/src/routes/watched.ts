import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../db.js";
import type { AuthRequest } from "../types.js";

export const watchedRouter = Router();
watchedRouter.use(requireAuth as import("express").RequestHandler);

watchedRouter.get("/", async (req, res) => {
  const authReq = req as unknown as AuthRequest;
  try {
    const { data: list, error } = await supabase
      .from("watched_entries")
      .select("*")
      .eq("user_id", authReq.user.id)
      .order("added_at", { ascending: false });
    if (error) throw error;
    const rows = (list ?? []) as Array<{ id: string; user_id: string; movie_id: number; title: string | null; poster_path: string | null; added_at: string }>;
    const watched = rows.map((e) => ({
      id: e.id,
      userId: e.user_id,
      movieId: e.movie_id,
      title: e.title,
      posterPath: e.poster_path,
      addedAt: e.added_at,
    }));
    res.json({ watched });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load watched list" });
  }
});

watchedRouter.post("/", async (req, res) => {
  const authReq = req as unknown as AuthRequest;
  try {
    const { movieId, title, posterPath } = req.body as { movieId?: number | string; title?: string; posterPath?: string };
    const id = typeof movieId === "number" ? movieId : parseInt(String(movieId), 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Valid movieId required" });
      return;
    }
    const { data: existing } = await supabase
      .from("watched_entries")
      .select("id")
      .eq("user_id", authReq.user.id)
      .eq("movie_id", id)
      .maybeSingle();

    if (existing) {
      const { data: entry } = await supabase
        .from("watched_entries")
        .select("*")
        .eq("id", existing.id)
        .single();
      if (entry) {
        const e = entry as { id: string; user_id: string; movie_id: number; title: string | null; poster_path: string | null; added_at: string };
        res.status(201).json({ id: e.id, userId: e.user_id, movieId: e.movie_id, title: e.title, posterPath: e.poster_path, addedAt: e.added_at });
      }
      return;
    }

    const { data: entry, error } = await supabase
      .from("watched_entries")
      .insert({
        user_id: authReq.user.id,
        movie_id: id,
        title: title || null,
        poster_path: posterPath || null,
      })
      .select()
      .single();
    if (error) throw error;
    const e = entry as { id: string; user_id: string; movie_id: number; title: string | null; poster_path: string | null; added_at: string };
    res.status(201).json({ id: e.id, userId: e.user_id, movieId: e.movie_id, title: e.title, posterPath: e.poster_path, addedAt: e.added_at });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to add to watched" });
  }
});

watchedRouter.delete("/:movieId", async (req, res) => {
  const authReq = req as unknown as AuthRequest;
  try {
    const movieId = parseInt(req.params.movieId, 10);
    if (Number.isNaN(movieId)) {
      res.status(400).json({ error: "Invalid movie id" });
      return;
    }
    await supabase
      .from("watched_entries")
      .delete()
      .eq("user_id", authReq.user.id)
      .eq("movie_id", movieId);
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to remove from watched" });
  }
});
