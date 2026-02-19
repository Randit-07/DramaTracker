import { logger } from "../logger.js";
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../db.js";
import type { AuthRequest } from "../types.js";

export const recommendationsRouter = Router();
recommendationsRouter.use(requireAuth as import("express").RequestHandler);

recommendationsRouter.get("/received", async (req, res) => {
  const authReq = req as unknown as AuthRequest;
  try {
    const { data: list, error } = await supabase
      .from("recommendations")
      .select("*")
      .eq("to_user_id", authReq.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    type RecRow = { id: string; from_user_id: string; to_user_id: string; movie_id: number; title: string | null; poster_path: string | null; message: string | null; read_at: string | null; created_at: string };
    const rows = (list ?? []) as RecRow[];
    const fromIds = [...new Set(rows.map((r) => r.from_user_id))];
    const { data: users } = fromIds.length > 0
      ? await supabase.from("users").select("id, email, name").in("id", fromIds)
      : { data: [] };
    const userMap = new Map((users ?? []).map((u: { id: string; email: string; name: string | null }) => [u.id, u]));
    const recommendations = rows.map((r) => ({
      id: r.id,
      fromUserId: r.from_user_id,
      toUserId: r.to_user_id,
      movieId: r.movie_id,
      title: r.title,
      posterPath: r.poster_path,
      message: r.message,
      readAt: r.read_at,
      createdAt: r.created_at,
      fromUser: userMap.get(r.from_user_id),
    }));
    res.json({ recommendations });
  } catch (e) {
      logger.error(e);
    res.status(500).json({ error: "Failed to load recommendations" });
  }
});

recommendationsRouter.get("/sent", async (req, res) => {
  const authReq = req as unknown as AuthRequest;
  try {
    const { data: list, error } = await supabase
      .from("recommendations")
      .select("*")
      .eq("from_user_id", authReq.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    type RecRow = { id: string; from_user_id: string; to_user_id: string; movie_id: number; title: string | null; poster_path: string | null; message: string | null; read_at: string | null; created_at: string };
    const rows = (list ?? []) as RecRow[];
    const toIds = [...new Set(rows.map((r) => r.to_user_id))];
    const { data: users } = await supabase.from("users").select("id, email, name").in("id", toIds);
    const userMap = new Map((users ?? []).map((u: { id: string; email: string; name: string | null }) => [u.id, u]));
    const recommendations = rows.map((r) => ({
      id: r.id,
      fromUserId: r.from_user_id,
      toUserId: r.to_user_id,
      movieId: r.movie_id,
      title: r.title,
      posterPath: r.poster_path,
      message: r.message,
      readAt: r.read_at,
      createdAt: r.created_at,
      toUser: userMap.get(r.to_user_id),
    }));
    res.json({ recommendations });
  } catch (e) {
      logger.error(e);
    res.status(500).json({ error: "Failed to load sent recommendations" });
  }
});

recommendationsRouter.post("/", async (req, res) => {
  const authReq = req as unknown as AuthRequest;
  try {
    const { toUserId, movieId, title, posterPath, message } = req.body as {
      toUserId?: string;
      movieId?: number | string;
      title?: string;
      posterPath?: string;
      message?: string;
    };
    const id = typeof movieId === "number" ? movieId : parseInt(String(movieId), 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Valid movieId required" });
      return;
    }
    if (!toUserId) {
      res.status(400).json({ error: "toUserId required" });
      return;
    }
    const { data: toUser } = await supabase.from("users").select("id").eq("id", toUserId).single() as { data: { id: string } | null };
    if (!toUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (toUser.id === authReq.user.id) {
      res.status(400).json({ error: "Cannot recommend to yourself" });
      return;
    }
    const { data: rec, error } = await supabase
      .from("recommendations")
      .insert({
        from_user_id: authReq.user.id,
        to_user_id: toUser.id,
        movie_id: id,
        title: title || null,
        poster_path: posterPath || null,
        message: message || null,
      })
      .select()
      .single();
    if (error) throw error;
    type RecRow = { id: string; from_user_id: string; to_user_id: string; movie_id: number; title: string | null; poster_path: string | null; message: string | null; read_at: string | null; created_at: string };
    const recRow = rec as RecRow;
    const { data: toUserRow } = await supabase.from("users").select("id, email, name").eq("id", toUser.id).single();
    res.status(201).json({
      id: recRow.id,
      fromUserId: recRow.from_user_id,
      toUserId: recRow.to_user_id,
      movieId: recRow.movie_id,
      title: recRow.title,
      posterPath: recRow.poster_path,
      message: recRow.message,
      readAt: recRow.read_at,
      createdAt: recRow.created_at,
      toUser: toUserRow ?? undefined,
    });
  } catch (e) {
      logger.error(e);
    res.status(500).json({ error: "Failed to send recommendation" });
  }
});

recommendationsRouter.patch("/:id/read", async (req, res) => {
  const authReq = req as unknown as AuthRequest;
  try {
    const { data: rec } = await supabase
      .from("recommendations")
      .select("id")
      .eq("id", req.params.id)
      .eq("to_user_id", authReq.user.id)
      .single() as { data: { id: string } | null };
    if (!rec) {
      res.status(404).json({ error: "Recommendation not found" });
      return;
    }
    await supabase.from("recommendations").update({ read_at: new Date().toISOString() }).eq("id", rec.id);
    res.json({ ok: true });
  } catch (e) {
      logger.error(e);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});
