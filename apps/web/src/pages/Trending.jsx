import { useEffect, useState } from "react";
import { movies as moviesApi } from "../api";
import MovieCard from "../components/MovieCard";

export default function Trending() {
  const [media, setMedia] = useState("movie");
  const [genre, setGenre] = useState("");
  const [genreList, setGenreList] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // fetch genres for selected media
    moviesApi
      .genres(media)
      .then((g) => setGenreList(g.genres || []))
      .catch(() => setGenreList([]));
    moviesApi
      .trending(media, genre, 1)
      .then((d) => setItems(d.results || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [media, genre]);

  return (
    <div className="trending-page">
      <h1>Trending</h1>
      <div style={{ marginBottom: 12 }}>
        <select value={media} onChange={(e) => { setMedia(e.target.value); setGenre(""); }} style={{ marginRight: 8 }}>
          <option value="movie">Movies</option>
          <option value="tv">TV</option>
        </select>
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">All genres</option>
          {genreList.map((g) => (
            <option key={g.id} value={String(g.id)}>{g.name}</option>
          ))}
        </select>
      </div>
      {loading ? <div>Loading…</div> : (
        <div className="movie-grid">
          {items.map((it) => (
            <MovieCard key={it.id} movie={it} posterPath={it.poster_path} title={it.title} />
          ))}
        </div>
      )}
    </div>
  );
}
