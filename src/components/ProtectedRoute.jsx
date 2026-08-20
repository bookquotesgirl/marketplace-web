import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
// Redirects to /login when logged out. role optional (e.g. 'vendor' | 'admin').
export default function ProtectedRoute({ role, children }) {
  const { user, isAuthed } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return children;
}
