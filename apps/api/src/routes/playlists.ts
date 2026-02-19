import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../db.js";
import type { AuthRequest } from "../types.js";
import { logger } from "../logger.js";

export const playlistsRouter = Router();
playlistsRouter.use(requireAuth as import("express").RequestHandler);

async function getPlaylistWithDetails(playlistId: string) {
  type PlaylistRow = { id: string; name: string; owner_id: string; created_at: string };
  type MemberRow = { id: string; user_id: string };
  type MovieRow = { id: string; playlist_id: string; movie_id: number; title: string | null; poster_path: string | null; added_by_id: string; added_at: string };
  type UserRow = { id: string; email: string; name: string | null };

  const { data: playlist, error: plError } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", playlistId)
    .single();
  if (plError || !playlist) return null;
  const pl = playlist as PlaylistRow;

  const [{ data: owner }, { data: members }, { data: movies }] = await Promise.all([
    supabase.from("users").select("id, email, name").eq("id", pl.owner_id).single(),
    supabase.from("playlist_members").select("id, user_id").eq("playlist_id", playlistId),
    supabase.from("playlist_movies").select("*").eq("playlist_id", playlistId),
  ]);

  const memberUserIds = (members ?? []).map((m: MemberRow) => m.user_id);
  const memberUsers =
    memberUserIds.length > 0
      ? await supabase.from("users").select("id, email, name").in("id", memberUserIds)
      : { data: [] as UserRow[] };

  const membersList = (members ?? []) as MemberRow[];
  const moviesList = (movies ?? []) as MovieRow[];
  const userList = (memberUsers.data ?? []) as UserRow[];

  return {
    id: pl.id,
    name: pl.name,
    ownerId: pl.owner_id,
    createdAt: pl.created_at,
    owner: owner ? { id: (owner as UserRow).id, email: (owner as UserRow).email, name: (owner as UserRow).name } : undefined,
    members: userList.map((u) => ({
      id: membersList.find((m) => m.user_id === u.id)?.id,
      user: { id: u.id, email: u.email, name: u.name },
    })),
    movies: moviesList.map((m) => ({
      id: m.id,
      playlistId: m.playlist_id,
      movieId: m.movie_id,
      title: m.title,
      posterPath: m.poster_path,
      addedById: m.added_by_id,
      addedAt: m.added_at,
    })),
  };
}

playlistsRouter.get("/", async (req, res) => {
  const authReq = req as unknown as AuthRequest;
  try {
    const { data: owned } = await supabase
      .from("playlists")
      .select("id")
      .eq("owner_id", authReq.user.id);
    const { data: memberOf } = await supabase
      .from("playlist_members")
      .select("playlist_id")
      .eq("user_id", authReq.user.id);

    const ids = new Set<string>([
      ...(owned ?? []).map((p) => p.id),
      ...(memberOf ?? []).map((m) => m.playlist_id),
    ]);

    const raw: (Awaited<ReturnType<typeof getPlaylistWithDetails>>)[] = [];
    for (const id of ids) {
      const p = await getPlaylistWithDetails(id);
      if (p) raw.push(p);
    }
    const playlists = raw.filter((p): p is NonNullable<typeof p> => p != null);
    playlists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ playlists });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Failed to load playlists" });
  }
});

playlistsRouter.post("/", async (req, res) => {
  const authReq = req as unknown as AuthRequest;
  try {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) {
      res.status(400).json({ error: "Playlist name required" });
      return;
    }
    const { data: playlist, error: plError } = await supabase
      .from("playlists")
      .insert({ name: name.trim(), owner_id: authReq.user.id })
      .select()
      .single();
    if (plError) throw plError;
    const pl = playlist as { id: string };

    await supabase.from("playlist_members").insert({
      playlist_id: pl.id,
      user_id: authReq.user.id,
    });

    const full = await getPlaylistWithDetails(pl.id);
    res.status(201).json(full ?? playlist);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Failed to create playlist" });
  }
});

playlistsRouter.get("/:id", async (req, res) => {
  const authReq = req as unknown as AuthRequest;
  try {
    const { data: memberCheck } = await supabase
      .from("playlist_members")
      .select("id")
      .eq("playlist_id", req.params.id)
      .eq("user_id", authReq.user.id)
      .maybeSingle();
    const { data: ownerCheck } = await supabase
      .from("playlists")
      .select("id")
      .eq("id", req.params.id)
      .eq("owner_id", authReq.user.id)
      .maybeSingle();

    if (!memberCheck && !ownerCheck) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }

    const playlist = await getPlaylistWithDetails(req.params.id);
    if (!playlist) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }
    res.json(playlist);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Failed to load playlist" });
  }
});

playlistsRouter.post("/:id/members", async (req, res) => {
  const authReq = req as unknown as AuthRequest;
  try {
    const { userId: friendId } = req.body as { userId?: string };
    if (!friendId) {
      res.status(400).json({ error: "userId required" });
      return;
    }
    const { data: playlist } = await supabase
      .from("playlists")
      .select("id")
      .eq("id", req.params.id)
      .eq("owner_id", authReq.user.id)
      .single();
    if (!playlist) {
      res.status(404).json({ error: "Playlist not found or you are not the owner" });
      return;
    }
    const { error } = await supabase.from("playlist_members").insert({
      playlist_id: playlist.id,
      user_id: friendId,
    });
    if (error) {
      if (error.code === "23505") res.status(409).json({ error: "User already in playlist" });
      else throw error;
      return;
    }
    const updated = await getPlaylistWithDetails(playlist.id);
    res.json(updated);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Failed to add member" });
  }
});

playlistsRouter.post("/:id/movies", async (req, res) => {
  const authReq = req as unknown as AuthRequest;
  try {
    const { movieId, title, posterPath } = req.body as { movieId?: number | string; title?: string; posterPath?: string };
    const id = typeof movieId === "number" ? movieId : parseInt(String(movieId), 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Valid movieId required" });
      return;
    }
    const { data: memberCheck } = await supabase
      .from("playlist_members")
      .select("id")
      .eq("playlist_id", req.params.id)
      .eq("user_id", authReq.user.id)
      .maybeSingle();
    const { data: ownerCheck } = await supabase
      .from("playlists")
      .select("id")
      .eq("id", req.params.id)
      .eq("owner_id", authReq.user.id)
      .maybeSingle();
    if (!memberCheck && !ownerCheck) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }
    const { data: existing } = await supabase
      .from("playlist_movies")
      .select("id")
      .eq("playlist_id", req.params.id)
      .eq("movie_id", id)
      .maybeSingle();
    if (existing) {
      res.status(409).json({ error: "Movie already in playlist" });
      return;
    }
    const { data: movie, error } = await supabase
      .from("playlist_movies")
      .insert({
        playlist_id: req.params.id,
        movie_id: id,
        title: title || null,
        poster_path: posterPath || null,
        added_by_id: authReq.user.id,
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(movie);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Failed to add movie" });
  }
});

playlistsRouter.delete("/:id/movies/:movieId", async (req, res) => {
  const authReq = req as unknown as AuthRequest;
  try {
    const movieId = parseInt(req.params.movieId, 10);
    if (Number.isNaN(movieId)) {
      res.status(400).json({ error: "Invalid movie id" });
      return;
    }
    const { data: memberCheck } = await supabase
      .from("playlist_members")
      .select("id")
      .eq("playlist_id", req.params.id)
      .eq("user_id", authReq.user.id)
      .maybeSingle();
    const { data: ownerCheck } = await supabase
      .from("playlists")
      .select("id")
      .eq("id", req.params.id)
      .eq("owner_id", authReq.user.id)
      .maybeSingle();
    if (!memberCheck && !ownerCheck) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }
    await supabase
      .from("playlist_movies")
      .delete()
      .eq("playlist_id", req.params.id)
      .eq("movie_id", movieId);
    res.status(204).send();
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Failed to remove movie" });
  }
});
