import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  // App.tsx already blocks rendering while `loading` is true, but we keep
  // this guard as a second line of defense so ProtectedRoute is safe to use
  // even if the top-level gate is ever removed.
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg text-mute">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-sm">Loading session…</span>
        </div>
      </div>
    );
  }

  // Not authenticated → send to /login, preserving where they were headed so
  // we can send them back after sign-in.
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
