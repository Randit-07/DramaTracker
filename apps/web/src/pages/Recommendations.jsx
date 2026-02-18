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
      const data = await moviesApi.search(movieQuery.trim(), 1);
      setMovieResults(data.results || []);
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
        title: selectedMovie.title,
        posterPath: selectedMovie.poster_path,
        message: message.trim() || undefined,
      });
      setSelectedUser(null);
      setSelectedMovie(null);
      setMessage("");
      setUserQuery("");
      setMovieQuery("");
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
        Send movie recommendations to friends and see what they’ve sent you.
      </p>

      <section className="rec-section">
        <h2>Send a recommendation</h2>
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
              Movie
              <div className="search-row">
                <input
                  type="text"
                  value={movieQuery}
                  onChange={(e) => {
                    setMovieQuery(e.target.value);
                    setSelectedMovie(null);
                  }}
                  onFocus={searchMovies}
                  placeholder="Search movies"
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
                        setMovieQuery(m.title);
                        setMovieResults([]);
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (setSelectedMovie(m),
                        setMovieQuery(m.title),
                        setMovieResults([]))
                      }
                    >
                      {m.title}
                      {m.release_date && ` (${m.release_date.slice(0, 4)})`}
                    </li>
                  ))}
                </ul>
              )}
              {selectedMovie && (
                <span className="selected-tag">
                  → {selectedMovie.title}{" "}
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
            className="btn-primary"
            disabled={sending || !selectedUser || !selectedMovie}
          >
            {sending ? "Sending…" : "Send recommendation"}
          </button>
        </form>
      </section>

      <section className="rec-section">
        <h2>Received</h2>
        {received.length === 0 ? (
          <p className="page-status">No recommendations yet.</p>
        ) : (
          <div className="rec-list">
            {received.map((r) => (
              <div
                key={r.id}
                className={`rec-card ${r.readAt ? "read" : ""}`}
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
                    From {r.fromUser?.name || r.fromUser?.email}
                  </p>
                  {r.message && <p className="rec-message">{r.message}</p>}
                  <div className="rec-actions">
                    <Link to={`/search?q=${encodeURIComponent(r.title || "")}`}>
                      Find similar
                    </Link>
                    {!r.readAt && (
                      <button
                        type="button"
                        className="btn-sm btn-accent"
                        onClick={() => markRead(r.id)}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rec-section">
        <h2>Sent</h2>
        {sent.length === 0 ? (
          <p className="page-status">You haven’t sent any yet.</p>
        ) : (
          <ul className="sent-list">
            {sent.map((r) => (
              <li key={r.id}>
                <strong>{r.title}</strong> → {r.toUser?.name || r.toUser?.email}
                {r.message && `: "${r.message}"`}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
