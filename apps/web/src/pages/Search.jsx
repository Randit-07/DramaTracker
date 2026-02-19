import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { movies as moviesApi, watched as watchedApi } from "../api";
import { useAuth } from "../context/AuthContext";
import MovieCard from "../components/MovieCard";
import PlaylistBulkAddButton from "../components/PlaylistBulkAddButton";
import "./Search.css";

export default function Search() {
  const [searchParams] = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(qFromUrl);
  const [type, setType] = useState("movie");
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const { getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (qFromUrl) setQuery(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    if (!qFromUrl?.trim()) return;
    setLoading(true);
    moviesApi.search(qFromUrl.trim(), 1)
      .then((data) => {
        setResults(data.results || []);
        setPage(1);
        setTotalPages(data.total_pages || 0);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [qFromUrl]);

  async function handleSearch(e) {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      let data;
      if (type === "movie") data = await moviesApi.search(query.trim(), 1);
      else if (type === "tv") data = await moviesApi.searchTv(query.trim(), 1);
      else data = await moviesApi.searchPeople(query.trim(), 1);
      setResults(data.results || []);
      setPage(1);
      setTotalPages(data.total_pages || 0);
    } catch (err) {
      setResults([]);
      setTotalPages(0);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!query.trim() || page >= totalPages || loading) return;
    setLoading(true);
    try {
      let data;
      if (type === "movie") data = await moviesApi.search(query.trim(), page + 1);
      else if (type === "tv") data = await moviesApi.searchTv(query.trim(), page + 1);
      else data = await moviesApi.searchPeople(query.trim(), page + 1);
      setResults((prev) => [...prev, ...(data.results || [])]);
      setPage((p) => p + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function addToWatched(movie) {
    const token = getToken();
    if (!token) return;
    setAddingId(movie.id);
    try {
      await watchedApi(token).add({
        movieId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="search-page">
      <h1 className="page-title">Search</h1>
      <form onSubmit={handleSearch} className="search-form">
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ marginRight: 8 }}>
          <option value="movie">Movies</option>
          <option value="tv">TV Series</option>
          <option value="person">People</option>
        </select>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title…"
          className="search-input"
          autoFocus
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          Search
        </button>
      </form>

      {loading && results.length === 0 && (
        <p className="search-status">Searching…</p>
      )}

      {results.length > 0 && (
        <>
          <div className="movie-grid">
            {results.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={() => {
                  if (type === "movie") navigate(`/movie/${movie.id}`);
                  else if (type === "tv") navigate(`/tv/${movie.id}`);
                  else navigate(`/person/${movie.id}`);
                }}
                actions={
                  type === "movie" ? (
                    <button
                      type="button"
                      className="btn-sm btn-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToWatched(movie);
                      }}
                      disabled={addingId === movie.id}
                    >
                      {addingId === movie.id ? "Adding…" : "Add to watched"}
                    </button>
                  ) : null
                }
              />
            ))}
          </div>
            <div style={{ marginTop: 12 }}>
                  {type !== 'person' && (
                    <PlaylistBulkAddButton results={results} />
                  )}
            </div>
          {page < totalPages && (
            <div className="load-more">
              <button
                type="button"
                className="btn-secondary"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {!loading && query.trim() && results.length === 0 && (
        <p className="search-status">No movies found. Try another search.</p>
      )}
    </div>
  );
}
