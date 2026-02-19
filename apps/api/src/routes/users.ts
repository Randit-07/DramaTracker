import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../db.js";
import type { AuthRequest } from "../types.js";
import { logger } from "../logger.js";

export const usersRouter = Router();
usersRouter.use(requireAuth as import("express").RequestHandler);

usersRouter.get("/search", async (req, res) => {
  const authReq = req as unknown as AuthRequest;
  try {
    const q = (req.query.q as string)?.trim();
    if (!q || q.length < 2) {
      res.status(400).json({ error: "Query 'q' required (min 2 characters)" });
      return;
    }
    const pattern = `%${q}%`;
    const { data: byEmail } = await supabase
      .from("users")
      .select("id, email, name")
      .neq("id", authReq.user.id)
      .ilike("email", pattern)
      .limit(20);
    const { data: byName } = await supabase
      .from("users")
      .select("id, email, name")
      .neq("id", authReq.user.id)
      .not("name", "is", null)
      .ilike("name", pattern)
      .limit(20);

    type U = { id: string; email: string; name: string | null };
    const seen = new Set<string>();
    const users: U[] = [];
    for (const u of [...(byEmail ?? []), ...(byName ?? [])] as U[]) {
      if (seen.has(u.id)) continue;
      seen.add(u.id);
      users.push(u);
      if (users.length >= 20) break;
    }
    res.json({ users });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Search failed" });
  }
});

usersRouter.get("/me", (req, res) => {
  const authReq = req as unknown as AuthRequest;
  res.json({ user: authReq.user });
});

// Get user profile by id (requires auth)
usersRouter.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { data: userRow, error } = await supabase.from("users").select("id, name").eq("id", id).single();
    if (error || !userRow) return res.status(404).json({ error: "User not found" });
    res.json({ user: { id: userRow.id, name: userRow.name } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load user" });
  }
});
