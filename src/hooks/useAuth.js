import { useAuthStore } from '../store/authStore';

// Thin selector hook over authStore — the app-facing API for auth state.
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  return { user, token, isAuthed: Boolean(token), setAuth, logout };
}
