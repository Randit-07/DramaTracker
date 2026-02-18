// In production (Vercel), set VITE_API_URL to your Render API origin (e.g. https://your-api.onrender.com)
const API =
  import.meta.env.VITE_API_URL && import.meta.env.MODE === "production"
    ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, "")}/api`
    : "/api";

function getHeaders(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function api(path, options = {}, token) {
  const url = path.startsWith("http") ? path : `${API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(token), ...options.headers },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}

export const auth = {
  register: (email, password, name) =>
    api("/auth/register", { method: "POST", body: JSON.stringify({ email, password, name }) }),
  login: (email, password) =>
    api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
};

export const movies = {
  search: (q, page = 1) => api(`/movies/search?q=${encodeURIComponent(q)}&page=${page}`),
  get: (id) => api(`/movies/${id}`),
};

export function watched(token) {
  return {
    list: () => api("/watched", {}, token),
    add: (body) => api("/watched", { method: "POST", body: JSON.stringify(body) }, token),
    remove: (movieId) => api(`/watched/${movieId}`, { method: "DELETE" }, token),
  };
}

export function playlists(token) {
  return {
    list: () => api("/playlists", {}, token),
    create: (name) => api("/playlists", { method: "POST", body: JSON.stringify({ name }) }, token),
    get: (id) => api(`/playlists/${id}`, {}, token),
    addMember: (id, userId) =>
      api(`/playlists/${id}/members`, { method: "POST", body: JSON.stringify({ userId }) }, token),
    addMovie: (id, body) =>
      api(`/playlists/${id}/movies`, { method: "POST", body: JSON.stringify(body) }, token),
    removeMovie: (id, movieId) =>
      api(`/playlists/${id}/movies/${movieId}`, { method: "DELETE" }, token),
  };
}

export function recommendations(token) {
  return {
    received: () => api("/recommendations/received", {}, token),
    sent: () => api("/recommendations/sent", {}, token),
    send: (body) => api("/recommendations", { method: "POST", body: JSON.stringify(body) }, token),
    markRead: (id) => api(`/recommendations/${id}/read`, { method: "PATCH" }, token),
  };
}

export function users(token) {
  return {
    search: (q) => api(`/users/search?q=${encodeURIComponent(q)}`, {}, token),
    me: () => api("/users/me", {}, token),
  };
}
