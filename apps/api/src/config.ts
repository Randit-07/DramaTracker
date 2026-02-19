/**
 * Backend config: env validation and protection settings.
 * Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, TMDB_ACCESS_TOKEN.
 * Optional: PORT, NODE_ENV, FRONTEND_URL (comma-separated for CORS).
 */

const required = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "JWT_SECRET",
  "TMDB_ACCESS_TOKEN",
] as const;

function validateEnv(): void {
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required env: ${missing.join(", ")}`);
  }
}

export interface ApiConfig {
  port: number;
  nodeEnv: string;
  /** CORS allowed origins (e.g. Vercel frontend URL, localhost for dev) */
  corsOrigins: string[];
  /** JWT secret (required) */
  jwtSecret: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
  tmdbAccessToken: string;
  /** Optional Redis URL (e.g. Render Redis); if set, TMDB responses are cached */
  redisUrl: string | null;
  /** Rate limit: max requests per window per IP */
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

function getCorsOrigins(): string[] {
  const raw = process.env.FRONTEND_URL;
  if (!raw?.trim()) {
    return process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"];
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

let cached: ApiConfig | null = null;

export function getConfig(): ApiConfig {
  if (cached) return cached;
  validateEnv();
  cached = {
    port: parseInt(process.env.PORT ?? "3001", 10) || 3001,
    nodeEnv: process.env.NODE_ENV ?? "development",
    corsOrigins: getCorsOrigins(),
    jwtSecret: process.env.JWT_SECRET!,
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    tmdbAccessToken: process.env.TMDB_ACCESS_TOKEN!,
    redisUrl: process.env.REDIS_URL?.trim() || null,
    rateLimitWindowMs: 60 * 1000,
    rateLimitMax: 100,
  };
  return cached;
}

/**
 * Optional helper to log a summary of the loaded config.  This used to run
 * automatically at module load time, but that caused the file to access
 * `process.env` before `dotenv` was invoked in `index.ts` (ESM imports are
 * hoisted).  When the API starts without real environment variables the
 * validation would throw before `.env` had been parsed, so we make the log
 * explicit now.
 */
export function logConfig(): void {
  const cfg = getConfig();
  console.log("Loaded config:", {
    port: cfg.port,
    nodeEnv: cfg.nodeEnv,
    corsOrigins: cfg.corsOrigins,
    jwtSecret: cfg.jwtSecret,
    supabaseUrl: cfg.supabaseUrl ? "configured" : "missing",
    supabaseServiceKey: cfg.supabaseServiceKey,
    tmdbAccessToken: cfg.tmdbAccessToken,
    redisUrl: cfg.redisUrl ? "configured" : "missing",
  });
}
