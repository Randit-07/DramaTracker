import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../db.js";
import { getConfig } from "../config.js";
import type { User } from "../types.js";
import type { AuthRequest } from "../types.js";

export function signToken(payload: { userId: string }): string {
  return jwt.sign(payload, getConfig().jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, getConfig().jwtSecret) as { userId?: string };
    return decoded?.userId ? { userId: decoded.userId } : null;
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const decoded = verifyToken(token);
  if (!decoded?.userId) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  const { data: userRow, error } = await supabase
    .from("users")
    .select("id, email, name")
    .eq("id", decoded.userId)
    .single();

  if (error || !userRow) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const row = userRow as { id: string; email: string; name: string | null };
  const user: User = {
    id: row.id,
    email: row.email,
    name: row.name,
  };
  req.user = user;
  next();
}
