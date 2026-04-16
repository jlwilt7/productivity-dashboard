import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabaseConfigured } from '../lib/supabase';

interface LocationState {
  from?: { pathname?: string };
}

export default function Login() {
  const { signIn, resetPassword, session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in? Send them to wherever they were trying to reach, or
  // to the dashboard by default.
  if (!loading && session) {
    const from = (location.state as LocationState | null)?.from?.pathname ?? '/dashboard';
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) {
      setError(error);
    } else {
      // onAuthStateChange will fire SIGNED_IN and populate `session`, but we
      // navigate explicitly so the user doesn't see a flash of the login form.
      navigate('/dashboard', { replace: true });
    }
  }

  async function onReset() {
    if (!email.trim()) {
      setError('Enter your email, then click "Forgot password?"');
      return;
    }
    setError(null);
    setBusy(true);
    const { error } = await resetPassword(email.trim());
    setBusy(false);
    if (error) setError(error);
    else setInfo('Password reset email sent. Check your inbox.');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-accent">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h7v7H3zM14 3h7v4h-7zM14 10h7v11h-7zM3 14h7v7H3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-mute">
            Sign in to your productivity dashboard
          </p>
        </div>

        {!supabaseConfigured && (
          <div className="mb-4 rounded-lg border border-status-yellow/30 bg-status-yellow/10 px-4 py-3 text-sm text-status-yellow">
            Supabase is not configured. Copy <code>.env.example</code> to{' '}
            <code>.env</code> and add your project URL and anon key.
          </div>
        )}

        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-status-red/30 bg-status-red/10 px-3 py-2 text-sm text-status-red">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-lg border border-status-green/30 bg-status-green/10 px-3 py-2 text-sm text-status-green">
              {info}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={onReset}
              className="text-mute-light hover:text-white"
            >
              Forgot password?
            </button>
            <Link to="/register" className="text-accent hover:text-accent-hover">
              Create account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
