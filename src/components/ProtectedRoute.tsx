import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  role?: UserRole;
}

const ProtectedRoute = ({ children, role }: Props) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/client'} replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
