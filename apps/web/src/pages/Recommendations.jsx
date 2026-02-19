import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  recommendations as recsApi,
  users as usersApi,
  movies as moviesApi,
} from "../api";
import { useAuth } from "../context/AuthContext";
import MovieCard from "../components/MovieCard";
import "./Recommendations.css";

export default function Recommendations() {
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [movieQuery, setMovieQuery] = useState("");
  const [movieType, setMovieType] = useState("multi");
  const [movieResults, setMovieResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [message, setMessage] = useState("");
  const { getToken } = useAuth();

  async function load() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const [recv, snt] = await Promise.all([
        recsApi(token).received(),
        recsApi(token).sent(),
      ]);
      setReceived(recv.recommendations || []);
      setSent(snt.recommendations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function searchUsers() {
    if (!userQuery.trim()) return;
    const token = getToken();
    if (!token) return;
    try {
      const data = await usersApi(token).search(userQuery.trim());
      setUserResults(data.users || []);
    } catch (err) {
      setUserResults([]);
    }
  }

  async function searchMovies() {
    if (!movieQuery.trim()) return;
    try {
      let results = [];
      
      if (movieType === "multi" || movieType === "movie") {
        const data = await moviesApi.search(movieQuery.trim(), 1);
        results = [...(data.results || [])];
      }
      
      if (movieType === "multi" || movieType === "tv") {
        const data = await moviesApi.searchTv(movieQuery.trim(), 1);
        results = [...results, ...(data.results || [])];
      }
      
      // Remove duplicates and limit
      const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
      setMovieResults(uniqueResults.slice(0, 10));
    } catch (err) {
      setMovieResults([]);
    }
  }

  async function sendRecommendation(e) {
    e.preventDefault();
    if (!selectedUser || !selectedMovie) return;
    const token = getToken();
    if (!token) return;
    setSending(true);
    try {
      await recsApi(token).send({
        toUserId: selectedUser.id,
        movieId: selectedMovie.id,
        title: selectedMovie.title || selectedMovie.name,
        posterPath: selectedMovie.poster_path,
        message: message.trim() || undefined,
        mediaType: selectedMovie.media_type || (selectedMovie.first_air_date ? 'tv' : 'movie'),
      });
      setSelectedUser(null);
      setSelectedMovie(null);
      setMessage("");
      setUserQuery("");
      setMovieQuery("");
      setMovieType("multi");
      setUserResults([]);
      setMovieResults([]);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  async function markRead(recId) {
    const token = getToken();
    if (!token) return;
    try {
      await recsApi(token).markRead(recId);
      setReceived((prev) =>
        prev.map((r) => (r.id === recId ? { ...r, readAt: new Date() } : r))
      );
    } catch (err) {
      console.error(err);
    }
  }

  if (loading && received.length === 0 && sent.length === 0) {
    return <p className="page-status">Loading…</p>;
  }

  return (
    <div className="recommendations-page">
      <h1 className="page-title">Recommendations</h1>
      <p className="page-subtitle">
        Share your favorite movies with friends and see what they recommend to you
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left: Send */}
        <section className="rec-section">
          <h2>Share with a friend</h2>
          <form onSubmit={sendRecommendation} className="rec-form">
            <div className="rec-form-row">
              <label>
                Friend
                <div className="search-row">
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => {
                      setUserQuery(e.target.value);
                      setSelectedUser(null);
                    }}
                    onFocus={searchUsers}
                    placeholder="Search by email or name"
                    className="search-input"
                  />
                  <button type="button" className="btn-secondary" onClick={searchUsers}>
                    Search
                  </button>
                </div>
                {userResults.length > 0 && !selectedUser && (
                  <ul className="dropdown-results">
                    {userResults.map((u) => (
                      <li
                        key={u.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedUser(u);
                          setUserQuery(u.name || u.email);
                          setUserResults([]);
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          (setSelectedUser(u),
                          setUserQuery(u.name || u.email),
                          setUserResults([]))
                        }
                      >
                        {u.name || u.email}
                      </li>
                    ))}
                  </ul>
                )}
                {selectedUser && (
                  <span className="selected-tag">
                    → {selectedUser.name || selectedUser.email}{" "}
                    <button
                      type="button"
                      className="btn-clear"
                      onClick={() => {
                        setSelectedUser(null);
                        setUserQuery("");
                      }}
                    >
                      ×
                    </button>
                  </span>
                )}
              </label>
            </div>
            <div className="rec-form-row">
              <label>
                Movie or TV Show
                <div className="search-row">
                  <select className="search-input" value={movieType} onChange={(e) => setMovieType(e.target.value)}>
                    <option value="multi">Both Movies & TV</option>
                    <option value="movie">Movies only</option>
                    <option value="tv">TV Shows only</option>
                  </select>
                </div>
              </label>
            </div>
            <div className="rec-form-row">
              <label>
                Title
                <div className="search-row">
                  <input
                    type="text"
                    value={movieQuery}
                    onChange={(e) => {
                      setMovieQuery(e.target.value);
                      setSelectedMovie(null);
                    }}
                    onFocus={searchMovies}
                    placeholder="Search movies or TV shows"
                    className="search-input"
                  />
                  <button type="button" className="btn-secondary" onClick={searchMovies}>
                    Search
                  </button>
                </div>
                {movieResults.length > 0 && !selectedMovie && (
                  <ul className="dropdown-results">
                    {movieResults.slice(0, 5).map((m) => (
                      <li
                        key={m.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedMovie(m);
                          setMovieQuery(m.title || m.name);
                          setMovieResults([]);
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          (setSelectedMovie(m),
                          setMovieQuery(m.title || m.name),
                          setMovieResults([]))
                        }
                      >
                        <div className="dropdown-item-title">{m.title || m.name}</div>
                        <div className="dropdown-item-meta">
                          {m.release_date ? ` (${m.release_date.slice(0, 4)})` : m.first_air_date ? ` (${m.first_air_date.slice(0, 4)})` : ''}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {selectedMovie && (
                  <span className="selected-tag">
                    → {selectedMovie.title || selectedMovie.name}{" "}
                    <button
                      type="button"
                      className="btn-clear"
                      onClick={() => {
                        setSelectedMovie(null);
                        setMovieQuery("");
                      }}
                    >
                      ×
                    </button>
                  </span>
                )}
              </label>
            </div>
            <div className="rec-form-row">
              <label>
                Message <span className="optional">(optional)</span>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Why you recommend it…"
                  className="search-input"
                />
              </label>
            </div>
            <button
              type="submit"
              className="btn-cta"
              disabled={sending || !selectedUser || !selectedMovie}
            >
              {sending ? "Sending…" : "Share"}
            </button>
          </form>
        </section>

        {/* Right: Received */}
        <section className="rec-section">
          <h2>Your recommendations</h2>
          {received.length === 0 ? (
            <p className="page-status">No recommendations yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {received.map((r) => (
                <div
                  key={r.id}
                  className={`rec-card ${r.readAt ? "read" : ""}`}
                  style={{ background: r.readAt ? 'rgba(255,255,255,0.01)' : 'linear-gradient(90deg, rgba(229,9,20,0.08), transparent)', padding: '1rem', borderRadius: '10px' }}
                >
                  <div className="rec-card-poster">
                    {r.posterPath ? (
                      <img src={r.posterPath} alt={r.title} />
                    ) : (
                      <div className="movie-card-placeholder">No poster</div>
                    )}
                  </div>
                  <div className="rec-card-body">
                    <h3>{r.title}</h3>
                    <p className="rec-from">
                      💌 From {r.fromUser?.name || r.fromUser?.email}
                    </p>
                    {r.message && <p className="rec-message">"{r.message}"</p>}
                    <div className="rec-actions">
                      <Link to={`/search?q=${encodeURIComponent(r.title || "")}`}>
                        View similar
                      </Link>
                      {!r.readAt && (
                        <button
                          type="button"
                          className="btn-sm btn-accent"
                          onClick={() => markRead(r.id)}
                        >
                          👁 Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {sent.length > 0 && (
        <section className="rec-section" style={{ marginTop: '2rem' }}>
          <h2>Your shares ({sent.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
            {sent.map((r) => (
              <div key={r.id} style={{ background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{r.title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  → {r.toUser?.name || r.toUser?.email}
                </div>
                {r.message && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{r.message}"</div>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
