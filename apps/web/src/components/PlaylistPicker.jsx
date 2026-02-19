import { useEffect, useState } from 'react';
import { playlists as playlistsApi } from '../api';
import './PlaylistPicker.css';

export default function PlaylistPicker({ open, onClose, onSelect }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (!open) return;
    const token = window.localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    playlistsApi(token).list().then(d => setLists(d.playlists || [])).catch(()=>setLists([])).finally(()=>setLoading(false));
  }, [open]);

  async function create() {
    const token = window.localStorage.getItem('token');
    if (!token || !name.trim()) return;
    setLoading(true);
    try {
      await playlistsApi(token).create(name.trim());
      setName('');
      const d = await playlistsApi(token).list();
      setLists(d.playlists || []);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }

  if (!open) return null;

  return (
    <div className="picker-backdrop" onClick={onClose}>
      <div className="picker" role="dialog" onClick={(e)=>e.stopPropagation()}>
        <h3>Select playlist</h3>
        <div className="picker-list">
          {loading ? <div className="picker-loading">Loading…</div> : (
            lists.length === 0 ? <div className="picker-empty">No playlists yet</div> : (
              lists.map(p => (
                <button key={p.id} className="picker-item" onClick={() => onSelect(p.id)}>
                  <div className="picker-name">{p.name}</div>
                  <div className="picker-meta">{p.movies?.length ?? 0} movies</div>
                </button>
              ))
            )
          )}
        </div>
        <div className="picker-create">
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="New playlist name" />
          <button onClick={create} disabled={!name.trim()}>Create</button>
        </div>
        <div style={{marginTop:8}}>
          <button className="btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
