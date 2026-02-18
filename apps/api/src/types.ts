import type { Request } from "express";

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthRequest extends Request {
  user: User;
}
