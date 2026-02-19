import { Link } from "react-router-dom";
import "./Dashboard.css";
import MovieCard from "../components/MovieCard";
import SkeletonCard from "../components/SkeletonCard";
import { movies as moviesApi } from "../api";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [loadingTV, setLoadingTV] = useState(false);
  const moviesScrollRef = useRef(null);
  const tvScrollRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    setLoadingMovies(true);
    setLoadingTV(true);
    moviesApi.trending('movie', '', 1).then(d => { if (mounted) setTrendingMovies(d.results || []); }).catch(()=>{ if (mounted) setTrendingMovies([]); }).finally(()=>{ if (mounted) setLoadingMovies(false); });
    moviesApi.trending('tv', '', 1).then(d => { if (mounted) setTrendingTV(d.results || []); }).catch(()=>{ if (mounted) setTrendingTV([]); }).finally(()=>{ if (mounted) setLoadingTV(false); });
    return () => { mounted = false; };
  }, []);

  async function goToDetails(id) {
    try {
      await (await import('../api')).movies.get(id);
      navigate(`/movie/${id}`);
      return;
    } catch (e) {}
    try {
      await (await import('../api')).movies.getTv(id);
      navigate(`/tv/${id}`);
      return;
    } catch (e) { navigate(`/movie/${id}`); }
  }

  const scroll = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 200;
      const newScrollLeft = direction === 'left' 
        ? ref.current.scrollLeft - scrollAmount 
        : ref.current.scrollLeft + scrollAmount;
      ref.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  return (
    <div className="dashboard">
      <section className="hero">
        <div className="hero-left">
          <h2>Find your next favorite show</h2>
          <p>Browse trending movies and TV shows, add them to your lists, and dive into trailers.</p>
          <div>
            <Link to="/search" className="btn-cta">Browse</Link>
            <Link to="/trending" className="btn-outline">Trending</Link>
          </div>
        </div>
        <div className="hero-right">
          {/* placeholder artwork */}
          <div style={{width:320, height:180, borderRadius:8, background:'linear-gradient(90deg,#222,#111)'}} />
        </div>
      </section>

      <section className="rows">
        <div>
          <div className="row-header">
            <div className="row-title">Trending Movies</div>
            <div className="row-controls">
              <button 
                className="btn-nav" 
                onClick={() => scroll(moviesScrollRef, 'left')}
                aria-label="Scroll left"
              >
                ← Previous
              </button>
              <button 
                className="btn-nav" 
                onClick={() => scroll(moviesScrollRef, 'right')}
                aria-label="Scroll right"
              >
                Next →
              </button>
            </div>
          </div>
          <div className="row-inner" ref={moviesScrollRef} tabIndex={0} onKeyDown={(e) => {
            if (e.key === 'ArrowRight') scroll(moviesScrollRef, 'right');
            if (e.key === 'ArrowLeft') scroll(moviesScrollRef, 'left');
          }}>
            {loadingMovies ? (
              Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ minWidth: 160 }}><SkeletonCard /></div>)
            ) : (
              trendingMovies.slice(0, 12).map(m => (
                <div key={m.id} style={{ minWidth: 160 }}>
                  <MovieCard movie={m} posterPath={m.poster_path} title={m.title} onClick={() => goToDetails(m.id)} />
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="row-header">
            <div className="row-title">Trending TV</div>
            <div className="row-controls">
              <button 
                className="btn-nav" 
                onClick={() => scroll(tvScrollRef, 'left')}
                aria-label="Scroll left"
              >
                ← Previous
              </button>
              <button 
                className="btn-nav" 
                onClick={() => scroll(tvScrollRef, 'right')}
                aria-label="Scroll right"
              >
                Next →
              </button>
            </div>
          </div>
          <div className="row-inner" ref={tvScrollRef} tabIndex={0} onKeyDown={(e) => {
            if (e.key === 'ArrowRight') scroll(tvScrollRef, 'right');
            if (e.key === 'ArrowLeft') scroll(tvScrollRef, 'left');
          }}>
            {loadingTV ? (
              Array.from({length:8}).map((_,i)=> <div key={i} style={{ minWidth: 160 }}><SkeletonCard /></div>)
            ) : (
              trendingTV.slice(0,12).map(m => (
                <div key={m.id} style={{ minWidth: 160 }}>
                  <MovieCard movie={m} posterPath={m.poster_path} title={m.title} onClick={() => goToDetails(m.id)} />
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
