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
          <NavLink to="/search">Search</NavLink>
          <NavLink to="/watched">Watched</NavLink>
          <NavLink to="/playlists">Playlists</NavLink>
          <NavLink to="/recommendations">Recommendations</NavLink>
        </nav>
        <div className="header-user">
          <span className="user-name">{user?.name || user?.email}</span>
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
