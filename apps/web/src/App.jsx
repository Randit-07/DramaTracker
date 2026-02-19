import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import Watched from "./pages/Watched";
import Playlists from "./pages/Playlists";
import PlaylistDetail from "./pages/PlaylistDetail";
import Recommendations from "./pages/Recommendations";
import MovieDetail from "./pages/MovieDetail";
import TVDetail from "./pages/TVDetail";
import PersonDetail from "./pages/PersonDetail";
import Trending from "./pages/Trending";
import UserProfile from "./pages/UserProfile";
import Anime from "./pages/Anime";
import AnimeDetail from "./pages/AnimeDetail";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading-screen">Loading…</div>;
  
  // If not logged in, show public pages (landing, login, register)
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // If logged in, show protected routes
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="search" element={<Search />} />
        <Route path="trending" element={<Trending />} />
        <Route path="anime" element={<Anime />} />
        <Route path="anime/:id" element={<AnimeDetail />} />
        <Route path="movie/:id" element={<MovieDetail />} />
        <Route path="tv/:id" element={<TVDetail />} />
        <Route path="person/:id" element={<PersonDetail />} />
        <Route path="users/:id" element={<UserProfile />} />
        <Route path="watched" element={<Watched />} />
        <Route path="playlists" element={<Playlists />} />
        <Route path="playlists/:id" element={<PlaylistDetail />} />
        <Route path="recommendations" element={<Recommendations />} />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
