import { Router } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../db.js";
import { signToken } from "../middleware/auth.js";
import { logger } from "../logger.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body as { email?: string; password?: string; name?: string };
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }
    const { data: existing } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const { data: userRow, error } = await supabase
      .from("users")
      .insert({ email, password_hash: passwordHash, name: name || null })
      .select("id, email, name")
      .single();
    if (error) {
      logger.error(error);
      res.status(500).json({ error: "Registration failed" });
      return;
    }
    const row = userRow as { id: string; email: string; name: string | null };
    const user = { id: row.id, email: row.email, name: row.name };
    const token = signToken({ userId: user.id });
    res.status(201).json({ user, token });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Registration failed" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }
    const { data: userRow, error } = await supabase
      .from("users")
      .select("id, email, name, password_hash")
      .eq("email", email)
      .single();
    if (error || !userRow) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const row = userRow as { id: string; email: string; name: string | null; password_hash: string };
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = signToken({ userId: row.id });
    res.json({
      user: { id: row.id, email: row.email, name: row.name },
      token,
    });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});
