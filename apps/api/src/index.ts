import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load .env from apps/api/ so Supabase and other env vars are found (works when run from repo root or apps/api)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { getConfig } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { moviesRouter } from "./routes/movies.js";
import { watchedRouter } from "./routes/watched.js";
import { playlistsRouter } from "./routes/playlists.js";
import { recommendationsRouter } from "./routes/recommendations.js";
import { usersRouter } from "./routes/users.js";

const config = getConfig();
const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

const corsOptions: cors.CorsOptions = {
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

app.use("/api/auth", authRouter);
app.use("/api/movies", moviesRouter);
app.use("/api/watched", watchedRouter);
app.use("/api/playlists", playlistsRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/users", usersRouter);

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.listen(config.port, () => {
  console.log(`DramaTracker API running on port ${config.port} (${config.nodeEnv})`);
  console.log(`Supabase: ${config.supabaseUrl ? "configured" : "missing"}`);
  console.log(`Redis cache: ${config.redisUrl ? "enabled" : "disabled (set REDIS_URL to enable)"}`);
});
