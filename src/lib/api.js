import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Base URL comes from env, never hardcoded.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API_URL });

// The API's origin (API_URL without the trailing /api), used to resolve the relative
// `/uploads/...` paths the backend returns for images (they aren't served from the
// frontend's own origin).
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function resolveAssetUrl(path) {
  if (!path) return path;
  // Already usable as-is: absolute URLs, inline data URIs, and object URLs.
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

// Attach the auth token (kept in memory in the auth store).
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
