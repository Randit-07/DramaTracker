import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Layout.css";

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <header className="header">
        <NavLink to="/" className="logo">
          DramaTracker
        </NavLink>
        <nav className="nav">
          <NavLink to="/search">Browse</NavLink>
          <NavLink to="/trending">Trending</NavLink>
          <NavLink to="/anime">Anime</NavLink>
          <NavLink to="/watched">Watched</NavLink>
          <NavLink to="/playlists">Playlists</NavLink>
          <NavLink to="/recommendations">Recommendations</NavLink>
        </nav>
        <div className="header-user">
          <NavLink to={user ? `/users/${user.id}` : "/login"} className="avatar" title={user?.name || user?.email}>
            {user?.name ? user.name.split(" ").map(s=>s[0]).slice(0,2).join("") : (user?.email?.[0] ?? "U")}
          </NavLink>
          <button type="button" className="btn-logout" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
