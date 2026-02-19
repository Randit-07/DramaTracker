import { Link } from "react-router-dom";
import "./Dashboard.css";
import MovieCard from "../components/MovieCard";
import SkeletonCard from "../components/SkeletonCard";
import { movies as moviesApi } from "../api";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [loadingTV, setLoadingTV] = useState(false);

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
          <div className="row-title">Trending Movies</div>
          <div className="row-inner" tabIndex={0} onKeyDown={(e) => {
            const el = e.currentTarget;
            if (e.key === 'ArrowRight') el.scrollBy({ left: 180, behavior: 'smooth' });
            if (e.key === 'ArrowLeft') el.scrollBy({ left: -180, behavior: 'smooth' });
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
          <div className="row-title">Trending TV</div>
          <div className="row-inner" tabIndex={0} onKeyDown={(e) => {
            const el = e.currentTarget;
            if (e.key === 'ArrowRight') el.scrollBy({ left: 180, behavior: 'smooth' });
            if (e.key === 'ArrowLeft') el.scrollBy({ left: -180, behavior: 'smooth' });
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
