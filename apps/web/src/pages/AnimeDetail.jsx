import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { anime as animeApi } from "../api";
import "./AnimeDetail.css";

export default function AnimeDetail() {
  const { id } = useParams();
  const [animeInfo, setAnimeInfo] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnimeDetails();
  }, [id]);

  async function loadAnimeDetails() {
    try {
      setLoading(true);
      setError(null);
      const [info, eps] = await Promise.all([
        animeApi.getInfo(id),
        animeApi.getEpisodes(id),
      ]);
      setAnimeInfo(info);
      setEpisodes(eps.episodes || []);
      if (eps.episodes && eps.episodes.length > 0) {
        setSelectedEpisode(eps.episodes[0]);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load anime details");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="page-status">Loading...</div>;
  }

  if (error) {
    return <div className="page-status error">{error}</div>;
  }

  if (!animeInfo) {
    return <div className="page-status">Anime not found</div>;
  }

  return (
    <div className="anime-detail">
      <div className="anime-header">
        {animeInfo.image && <img src={animeInfo.image} alt={animeInfo.title} />}
        <div className="anime-meta">
          <h1>{animeInfo.title}</h1>
          <div className="anime-stats">
            {animeInfo.status && <span className="stat">Status: {animeInfo.status}</span>}
            {animeInfo.type && <span className="stat">Type: {animeInfo.type}</span>}
            {animeInfo.totalEpisodes && (
              <span className="stat">Episodes: {animeInfo.totalEpisodes}</span>
            )}
            {animeInfo.releaseDate && <span className="stat">Released: {animeInfo.releaseDate}</span>}
          </div>
          {animeInfo.genres && animeInfo.genres.length > 0 && (
            <div className="genres">
              {animeInfo.genres.map((genre) => (
                <span key={genre} className="genre-tag">
                  {genre}
                </span>
              ))}
            </div>
          )}
          {animeInfo.description && (
            <p className="description">{animeInfo.description}</p>
          )}
        </div>
      </div>

      {episodes.length > 0 && (
        <div className="episodes-section">
          <h2>Episodes</h2>
          <div className="episodes-list">
            {episodes.map((episode) => (
              <button
                key={episode.id}
                className={`episode-item ${selectedEpisode?.id === episode.id ? "active" : ""}`}
                onClick={() => setSelectedEpisode(episode)}
              >
                <span className="episode-number">Ep {episode.number}</span>
                <span className="episode-title">{episode.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedEpisode && (
        <div className="player-section">
          <h2>Now Playing</h2>
          <div className="episode-info">
            <h3>Episode {selectedEpisode.number}: {selectedEpisode.title}</h3>
            <p className="episode-notice">
              Anime episodes are powered by Aniwatch. You can watch directly through the provider's platform.
            </p>
            <a
              href={selectedEpisode.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta"
            >
              Watch on Aniwatch →
            </a>
          </div>
        </div>
      )}

      {episodes.length === 0 && (
        <div className="empty-state">
          <p>No episodes available for this anime yet.</p>
        </div>
      )}
    </div>
  );
}
