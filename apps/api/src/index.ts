import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import type { CorsOptions } from "cors";

// Load .env from apps/api/ before touching anything that might read it.  We
// can’t rely on the usual static import order because ESM imports are
// hoisted; if other modules (config, db, routers, etc.) are imported
// synchronously they may call `getConfig()` while `process.env` is still
// empty.  By performing a manual load up front and using dynamic imports for
// everything else we guarantee the variables exist before they are needed.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

// after dotenv has been applied we can load the rest of the app
const express = (await import("express")).default;
const cors = (await import("cors")).default;
const helmet = (await import("helmet")).default;
const rateLimit = (await import("express-rate-limit")).default;
const { getConfig, logConfig } = await import("./config.js");
const { authRouter } = await import("./routes/auth.js");
const { moviesRouter } = await import("./routes/movies.js");
const { watchedRouter } = await import("./routes/watched.js");
const { playlistsRouter } = await import("./routes/playlists.js");
const { recommendationsRouter } = await import("./routes/recommendations.js");
const { usersRouter } = await import("./routes/users.js");

const config = getConfig();
const { logger } = await import("./logger.js");
const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Log incoming requests for easier debugging (dev + prod)
// Structured request logging: method, url, status, latency, user id when available
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const latency = Date.now() - start;
    const status = res.statusCode;
    const userId = (req as any).user?.id || null;
    logger.info(`${req.method} ${req.originalUrl}`, { status, latency, userId });
  });
  next();
});

app.use(
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

const corsOptions: CorsOptions = {
  origin:
    config.corsOrigins.length > 0
      ? config.corsOrigins
      : true,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "256kb" }));

// central error handler: log unexpected errors
app.use((err: unknown, _req: import("express").Request, res: import("express").Response, _next: import("express").NextFunction) => {
  logger.error(err as Error);
  res.status(500).json({ error: "Internal server error" });
});

app.use("/api/auth", authRouter);
app.use("/api/movies", moviesRouter);
app.use("/api/watched", watchedRouter);
app.use("/api/playlists", playlistsRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/users", usersRouter);

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.listen(config.port, () => {
  logger.info(`DramaTracker API running on port ${config.port} (${config.nodeEnv})`);
  logger.info(`Supabase: ${config.supabaseUrl ? "configured" : "missing"}`);
  logger.info(`Redis cache: ${config.redisUrl ? "enabled" : "disabled (set REDIS_URL to enable)"}`);
});
