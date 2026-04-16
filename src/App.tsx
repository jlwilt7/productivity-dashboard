import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

const Dashboard       = lazy(() => import('./pages/Dashboard'));
const Goals           = lazy(() => import('./pages/Goals'));
const WeeklyReview    = lazy(() => import('./pages/WeeklyReview'));
const MonthlyReview   = lazy(() => import('./pages/MonthlyReview'));
const Metrics         = lazy(() => import('./pages/Metrics'));
const StartupTracker  = lazy(() => import('./pages/StartupTracker'));
const Settings        = lazy(() => import('./pages/Settings'));
const Login           = lazy(() => import('./pages/Login'));
const Register        = lazy(() => import('./pages/Register'));

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center py-12 text-sm text-mute">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span>Loading…</span>
      </div>
    </div>
  );
}

// Full-screen fallback used while the auth session is being resolved. Prevents
// the "blank gray theme" flash when the app loads from an email-confirmation
// link — we don't render any route until we know whether the user is signed in.
function AuthBootLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-bg text-mute">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span className="text-sm">Checking session…</span>
      </div>
    </div>
  );
}

export default function App() {
  const { session, loading } = useAuth();

  // Block route rendering entirely until auth has initialized. During this
  // time Supabase may still be parsing `#access_token=...` from the URL and
  // exchanging it for a session.
  if (loading) {
    return <AuthBootLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes. If the user is already signed in, bounce them to
            the dashboard rather than showing the auth forms. */}
        <Route
          path="/login"
          element={session ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={session ? <Navigate to="/dashboard" replace /> : <Register />}
        />

        {/* Authenticated area. ProtectedRoute guards against unauth access;
            App-level `loading` guards against the blank-screen race. */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Root redirects to /dashboard so the "land on /" case after an
              email confirmation still ends up on the dashboard. */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="goals" element={<Goals />} />
          <Route path="weekly" element={<WeeklyReview />} />
          <Route path="monthly" element={<MonthlyReview />} />
          <Route path="metrics" element={<Metrics />} />
          <Route path="startup" element={<StartupTracker />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Unknown paths: send authed users to /dashboard, others to /login. */}
        <Route
          path="*"
          element={<Navigate to={session ? '/dashboard' : '/login'} replace />}
        />
      </Routes>
    </Suspense>
  );
}
