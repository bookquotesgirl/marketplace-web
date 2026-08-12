import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
// Redirects to /login when logged out. role optional (e.g. 'vendor' | 'admin').
export default function ProtectedRoute({ role, children }) {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return children;
}
