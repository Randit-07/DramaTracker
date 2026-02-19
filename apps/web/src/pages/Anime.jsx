import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { anime as animeApi } from "../api";
import "./Anime.css";

export default function Anime() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showTrending, setShowTrending] = useState(!query);
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      loadTrending();
      setShowTrending(true);
    } else {
      setShowTrending(false);
      setPage(1);
      search();
    }
  }, [query]);

  useEffect(() => {
    if (query && page > 1) {
      searchMore();
    }
  }, [page]);

  async function loadTrending() {
    try {
      setTrendingLoading(true);
      const data = await animeApi.trending(1);
      setTrending(data.results || []);
    } catch (err) {
      console.error(err);
      setTrending([]);
    } finally {
      setTrendingLoading(false);
    }
  }

  async function search() {
    if (!query.trim()) return;
    try {
      setLoading(true);
      const data = await animeApi.search(query.trim(), 1);
      setResults(data.results || []);
      setHasMore(data.hasNextPage || false);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function searchMore() {
    if (!query.trim()) return;
    try {
      setLoading(true);
      const data = await animeApi.search(query.trim(), page);
      setResults((prev) => [...prev, ...(data.results || [])]);
      setHasMore(data.hasNextPage || false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
    }
  }

  return (
    <div className="anime-page">
      <h1 className="page-title">Anime</h1>
      <p className="page-subtitle">Discover and watch anime episodes</p>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search anime..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>

      {showTrending ? (
        <section className="trending-section">
          <h2>Recent Episodes</h2>
          {trendingLoading ? (
            <p className="page-status">Loading...</p>
          ) : trending.length === 0 ? (
            <p className="page-status">No trending anime found</p>
          ) : (
            <div className="anime-grid">
              {trending.map((anime) => (
                <div key={anime.id} className="anime-card">
                  {anime.image && <img src={anime.image} alt={anime.title} />}
                  <div className="anime-card-info">
                    <h3>{anime.title}</h3>
                    {anime.episodeNum && <p>Episode {anime.episodeNum}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="results-section">
          <h2>
            Search Results {results.length > 0 && `(${results.length} found)`}
          </h2>
          {loading && results.length === 0 ? (
            <p className="page-status">Searching...</p>
          ) : results.length === 0 ? (
            <p className="page-status">No results found for "{query}"</p>
          ) : (
            <>
              <div className="anime-grid">
                {results.map((anime) => (
                  <div key={anime.id} className="anime-card">
                    {anime.poster && <img src={anime.poster} alt={anime.title} />}
                    <div className="anime-card-info">
                      <h3>{anime.title}</h3>
                      {anime.jTitle && <p className="anime-jp-title">{anime.jTitle}</p>}
                      {anime.updatedOn && <p className="anime-updated">Updated: {anime.updatedOn}</p>}
                    </div>
                  </div>
                ))}
              </div>
              {hasMore && (
                <div className="pagination">
                  <button
                    className="btn-secondary"
                    onClick={() => setPage(page + 1)}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
