import { Link } from "react-router-dom";
import "./Landing.css";

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-header">
        <h1 className="landing-title">DramaTracker</h1>
        <p className="landing-tagline">Your Ultimate Movie & TV Show Companion</p>
        <div className="landing-nav">
          <Link to="/login" className="btn-primary">Sign In</Link>
          <Link to="/register" className="btn-outline">Create Account</Link>
        </div>
      </div>

      <div className="landing-hero">
        <div className="hero-content">
          <h2>Discover Your Next Favorite Show</h2>
          <p>Browse trending movies and TV shows, create playlists, track what you've watched, and get personalized recommendations from friends.</p>
        </div>
      </div>

      <section className="landing-features">
        <div className="feature-card">
          <h3>🎬 Explore</h3>
          <p>Discover trending movies and TV shows. Search through thousands of titles with detailed information and trailers.</p>
        </div>
        <div className="feature-card">
          <h3>📋 Organize</h3>
          <p>Create custom playlists, track what you've watched, and keep notes on your favorite content.</p>
        </div>
        <div className="feature-card">
          <h3>👥 Share</h3>
          <p>Recommend movies and TV shows to your friends with personalized messages and track their recommendations.</p>
        </div>
        <div className="feature-card">
          <h3>🎯 Personalize</h3>
          <p>Get recommendations tailored to your taste by following genres and exploring curated collections.</p>
        </div>
      </section>

      <section className="landing-cta">
        <h2>Ready to get started?</h2>
        <p>Join thousands of movie and TV enthusiasts tracking their favorite shows.</p>
        <Link to="/register" className="btn-cta btn-large">Create Your Free Account</Link>
      </section>

      <footer className="landing-footer">
        <p>&copy; 2026 DramaTracker. All rights reserved.</p>
      </footer>
    </div>
  );
}
