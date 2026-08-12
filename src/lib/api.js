import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Base URL comes from env, never hardcoded.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

// Attach the auth token (kept in memory in the auth store).
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
