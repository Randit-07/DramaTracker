import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { playlists as playlistsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import "./Playlists.css";

export default function Playlists() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const { getToken } = useAuth();

  async function load() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await playlistsApi(token).list();
      setList(data.playlists || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const token = getToken();
    if (!token) return;
    setCreating(true);
    try {
      await playlistsApi(token).create(name.trim());
      setName("");
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="playlists-page">
      <h1 className="page-title">Watch together playlists</h1>
      <p className="page-subtitle">
        Create a playlist and invite a friend to track movies you watch together.
      </p>

      <form onSubmit={handleCreate} className="playlist-create">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Playlist name"
          className="playlist-name-input"
        />
        <button type="submit" className="btn-primary" disabled={creating || !name.trim()}>
          {creating ? "Creating…" : "Create playlist"}
        </button>
      </form>

      {loading ? (
        <p className="page-status">Loading playlists…</p>
      ) : list.length === 0 ? (
        <p className="page-status">No playlists yet. Create one above.</p>
      ) : (
        <ul className="playlist-list">
          {list.map((p) => (
            <li key={p.id} className="playlist-item">
              <Link to={`/playlists/${p.id}`} className="playlist-link">
                <span className="playlist-name">{p.name}</span>
                <span className="playlist-meta">
                  by {p.owner?.name || p.owner?.email} · {p.movies?.length ?? 0} movies ·{" "}
                  {p.members?.length ?? 0} members
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
