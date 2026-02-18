import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { playlists as playlistsApi, movies as moviesApi, users as usersApi } from "../api";
import { useAuth } from "../context/AuthContext";
import MovieCard from "../components/MovieCard";
import "./PlaylistDetail.css";

export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendQuery, setFriendQuery] = useState("");
  const [friendResults, setFriendResults] = useState([]);
  const [addingFriend, setAddingFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [addingMovieId, setAddingMovieId] = useState(null);
  const { getToken, user: me } = useAuth();

  async function load() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await playlistsApi(token).get(id);
      setPlaylist(data);
    } catch (err) {
      if (err.message?.includes("404")) navigate("/playlists");
      else console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function searchFriends() {
    if (!friendQuery.trim()) return;
    const token = getToken();
    if (!token) return;
    try {
      const data = await usersApi(token).search(friendQuery.trim());
      const memberIds = new Set(playlist?.members?.map((m) => m.user?.id) || []);
      setFriendResults((data.users || []).filter((u) => !memberIds.has(u.id)));
    } catch (err) {
      setFriendResults([]);
    }
  }

  async function addMember(userId) {
    const token = getToken();
    if (!token) return;
    setAddingFriend(true);
    try {
      const updated = await playlistsApi(token).addMember(id, userId);
      setPlaylist(updated);
      setFriendQuery("");
      setFriendResults([]);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingFriend(false);
    }
  }

  async function searchMovies() {
    if (!searchQuery.trim()) return;
    try {
      const data = await moviesApi.search(searchQuery.trim(), 1);
      const existingIds = new Set(playlist?.movies?.map((m) => m.movieId) || []);
      setSearchResults((data.results || []).filter((m) => !existingIds.has(m.id)));
    } catch (err) {
      setSearchResults([]);
    }
  }

  async function addMovie(movie) {
    const token = getToken();
    if (!token) return;
    setAddingMovieId(movie.id);
    try {
      await playlistsApi(token).addMovie(id, {
        movieId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
      });
      setSearchQuery("");
      setSearchResults([]);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingMovieId(null);
    }
  }

  async function removeMovie(movieId) {
    const token = getToken();
    if (!token) return;
    try {
      await playlistsApi(token).removeMovie(id, movieId);
      load();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading && !playlist) return <p className="page-status">Loading…</p>;
  if (!playlist) return null;

  const isOwner = playlist.ownerId === me?.id;

  return (
    <div className="playlist-detail">
      <div className="playlist-detail-header">
        <h1 className="page-title">{playlist.name}</h1>
        <p className="page-subtitle">
          Owner: {playlist.owner?.name || playlist.owner?.email}
        </p>
      </div>

      {isOwner && (
        <section className="playlist-section">
          <h2>Invite friend</h2>
          <div className="invite-row">
            <input
              type="text"
              value={friendQuery}
              onChange={(e) => setFriendQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchFriends())}
              placeholder="Search by email or name"
              className="search-input"
            />
            <button type="button" className="btn-secondary" onClick={searchFriends}>
              Search
            </button>
          </div>
          {friendResults.length > 0 && (
            <ul className="friend-results">
              {friendResults.map((u) => (
                <li key={u.id}>
                  <span>{u.name || u.email}</span>
                  <button
                    type="button"
                    className="btn-sm btn-accent"
                    onClick={() => addMember(u.id)}
                    disabled={addingFriend}
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="playlist-section">
        <h2>Members</h2>
        <ul className="members-list">
          {playlist.members?.map((m) => (
            <li key={m.id}>{m.user?.name || m.user?.email}</li>
          ))}
        </ul>
      </section>

      <section className="playlist-section">
        <h2>Add movie to playlist</h2>
        <div className="invite-row">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchMovies())}
            placeholder="Search movies"
            className="search-input"
          />
          <button type="button" className="btn-secondary" onClick={searchMovies}>
            Search
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="movie-grid add-movies-grid">
            {searchResults.slice(0, 6).map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                actions={
                  <button
                    type="button"
                    className="btn-sm btn-accent"
                    onClick={() => addMovie(movie)}
                    disabled={addingMovieId === movie.id}
                  >
                    {addingMovieId === movie.id ? "Adding…" : "Add"}
                  </button>
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="playlist-section">
        <h2>Movies in playlist</h2>
        {!playlist.movies?.length ? (
          <p className="page-status">No movies yet. Search and add above.</p>
        ) : (
          <div className="movie-grid">
            {playlist.movies.map((m) => (
              <MovieCard
                key={m.id}
                movie={{ id: m.movieId }}
                title={m.title}
                posterPath={m.posterPath}
                actions={
                  <button
                    type="button"
                    className="btn-sm btn-danger"
                    onClick={() => removeMovie(m.movieId)}
                  >
                    Remove
                  </button>
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
