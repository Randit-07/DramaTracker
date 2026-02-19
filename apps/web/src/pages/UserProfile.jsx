import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { users as usersApi } from "../api";

export default function UserProfile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    // require auth token
    const token = window.localStorage.getItem('token');
    if (!token) return setLoading(false);
    usersApi(token).me().then(() => {});
    usersApi(token).search(id).then(() => {});
    (async () => {
      try {
        const data = await (await import('../api')).users(window.localStorage.getItem('token')).me();
      } catch (e) {
        // ignore
      }
      try {
        const data = await (await import('../api')).api(`/users/${id}`, {}, window.localStorage.getItem('token'));
        setUser(data.user || null);
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-page">
      <h1>{user.name || 'User'}</h1>
      <p>User ID: {user.id}</p>
      <p>
        <Link to="/">Back</Link>
      </p>
    </div>
  );
}
