import { Link } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard">
      <h1 className="page-title">Welcome back</h1>
      <p className="page-subtitle">
        Track what you watch, create watch-together playlists, and share recommendations with friends.
      </p>
      <div className="dashboard-cards">
        <Link to="/search" className="dashboard-card">
          <span className="dashboard-card-icon">🔍</span>
          <h2>Search movies</h2>
          <p>Find movies with TMDB and add them to your lists.</p>
        </Link>
        <Link to="/watched" className="dashboard-card">
          <span className="dashboard-card-icon">✓</span>
          <h2>Watched</h2>
          <p>Your personal list of movies you’ve seen.</p>
        </Link>
        <Link to="/playlists" className="dashboard-card">
          <span className="dashboard-card-icon">🎬</span>
          <h2>Playlists</h2>
          <p>Create “watched together” playlists and invite friends.</p>
        </Link>
        <Link to="/recommendations" className="dashboard-card">
          <span className="dashboard-card-icon">💌</span>
          <h2>Recommendations</h2>
          <p>Send and receive movie recommendations from friends.</p>
        </Link>
      </div>
    </div>
  );
}
