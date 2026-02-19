import { useState } from 'react';
import PlaylistPicker from './PlaylistPicker';

export default function PlaylistBulkAddButton({ results = [] }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  async function handleSelect(id) {
    const token = window.localStorage.getItem('token');
    if (!token) { alert('Login required'); setOpen(false); return; }
    setAdding(true);
    try {
      for (const m of results.slice(0, 10)) {
        await (await import('../api')).playlists(token).addMovie(id, { movieId: m.id, title: m.title || m.name, posterPath: m.poster_path });
      }
      alert('Added top results to playlist');
    } catch (e) { console.error(e); alert('Add failed'); }
    setAdding(false);
    setOpen(false);
  }

  return (
    <div style={{ display: 'inline-block' }}>
      <button className="btn-sm" onClick={() => setOpen(true)} disabled={adding || results.length === 0}>
        {adding ? 'Adding…' : 'Add results to playlist'}
      </button>
      <PlaylistPicker open={open} onClose={() => setOpen(false)} onSelect={handleSelect} />
    </div>
  );
}
