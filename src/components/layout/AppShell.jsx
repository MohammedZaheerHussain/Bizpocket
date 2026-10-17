import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { BottomNav } from './BottomNav';
import { FullPageLoader } from '../ui/Spinner';

export function AppShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoader message="Loading BizPocket..." />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Main content - offset for sidebar on desktop */}
      <div className="md:ml-64">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}

export function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoader message="Loading..." />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
