import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { movies as moviesApi } from "../api";
import MovieCard from "../components/MovieCard";
import PlaylistPicker from "../components/PlaylistPicker";

export default function TVDetail() {
  const { id } = useParams();
  const [tv, setTv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function addToPlaylistWithId(tv, playlistId) {
    const token = window.localStorage.getItem("token");
    if (!token) return alert('Login required');
    try {
      await (await import("../api")).playlists(token).addMovie(playlistId, { movieId: tv.id, title: tv.name, posterPath: tv.poster_path });
      alert('Added to playlist');
    } catch (e) { console.error(e); alert('Add failed'); }
    setPickerOpen(false);
  }

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    moviesApi.getTv(id).then((d) => setTv(d)).catch(() => setTv(null)).finally(() => setLoading(false));
    moviesApi.tvVideos(id).then((v) => setVideos(v.results || [])).catch(() => setVideos([]));
  }, [id]);

  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!tv) return <div>TV series not found</div>;

  return (
    <div className="detail-page">
      <div className="detail-hero" style={{ backgroundImage: tv.backdrop_path ? `url(${tv.backdrop_path})` : undefined }}>
        <div className="detail-hero-inner">
          <div className="detail-poster">
            <img src={tv.poster_path} alt={tv.name} />
          </div>
          <div className="detail-meta">
            <h1>{tv.name}</h1>
            <p className="muted">{tv.first_air_date} • {tv.seasons?.length ?? ''} seasons • {tv.genres?.map(g=>g.name).join(', ')}</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn-cta" onClick={() => { const trailer = videos.find(v=>v.site==='YouTube'); if (trailer) window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank'); }}>Play Trailer</button>
              <button className="btn-outline" style={{ marginLeft: 8 }} onClick={() => setPickerOpen(true)}>Add to playlist</button>
              <button className="btn-outline" style={{ marginLeft: 8 }} onClick={async () => { const token = window.localStorage.getItem('token'); if (!token) return alert('Login required'); try { await (await import('../api')).watched(token).add({ movieId: tv.id, title: tv.name, posterPath: tv.poster_path }); alert('Added to watched'); } catch (e) { console.error(e); alert('Add failed'); } }}>Add to watched</button>
            </div>
            <p style={{ marginTop: 12 }}>{tv.overview}</p>
          </div>
        </div>
      </div>

      {videos.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>Trailers</h3>
          <div className="row">
            {videos.filter(v => v.site === 'YouTube').slice(0,3).map(v => (
              <div key={v.key} style={{ minWidth: 280 }}>
                <iframe width="100%" height="160" src={`https://www.youtube.com/embed/${v.key}`} title={v.name} frameBorder="0" allowFullScreen></iframe>
              </div>
            ))}
          </div>
        </div>
      )}
        <PlaylistPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(id) => addToPlaylistWithId(tv, id)} />
    </div>
  );
}
