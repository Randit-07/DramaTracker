import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { watched as watchedApi } from "../api";
import { useAuth } from "../context/AuthContext";
import MovieCard from "../components/MovieCard";
import "./Watched.css";

export default function Watched() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const { getToken } = useAuth();

  async function load() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await watchedApi(token).list();
      setList(data.watched || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(movieId) {
    const token = getToken();
    if (!token) return;
    setRemovingId(movieId);
    try {
      await watchedApi(token).remove(movieId);
      setList((prev) => prev.filter((e) => e.movieId !== movieId));
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) return <p className="page-status">Loading your watched list…</p>;

  return (
    <div className="watched-page">
      <h1 className="page-title">Watched</h1>
      <p className="page-subtitle">Movies you’ve added to your watched list.</p>

      {list.length === 0 ? (
        <p className="page-status">No movies yet. <Link to="/search">Search</Link> and add some.</p>
      ) : (
        <div className="movie-grid">
          {list.map((entry) => (
            <MovieCard
              key={entry.id}
              movie={{ id: entry.movieId, release_date: null, vote_average: null }}
              title={entry.title}
              posterPath={entry.posterPath}
              actions={
                <button
                  type="button"
                  className="btn-sm btn-danger"
                  onClick={() => remove(entry.movieId)}
                  disabled={removingId === entry.movieId}
                >
                  {removingId === entry.movieId ? "Removing…" : "Remove"}
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
