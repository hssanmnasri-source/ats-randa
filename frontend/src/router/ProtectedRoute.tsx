import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { Role } from '../types/auth';

interface Props {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirige vers l'espace approprié selon le rôle
    const roleRedirect: Record<Role, string> = {
      ADMIN: '/admin',
      RH: '/rh',
      AGENT: '/agent',
      CANDIDATE: '/candidate',
      VISITOR: '/',
    };
    return <Navigate to={roleRedirect[user.role]} replace />;
  }

  return <>{children}</>;
}
