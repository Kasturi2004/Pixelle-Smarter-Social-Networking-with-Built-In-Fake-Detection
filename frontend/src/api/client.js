import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://fake-profile-backend-d6xd.onrender.com/api";
export const API_ORIGIN = API_URL.replace(/\/api$/, "");

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pixelle_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getImageUrl(path) {
  if (!path) {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23fce3d2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%231f2933' font-family='Arial' font-size='28'%3ENo Image%3C/text%3E%3C/svg%3E";
  }

  if (path.startsWith("http")) {
    return path;
  }

  return `${API_ORIGIN}${path}`;
}

export default api;
