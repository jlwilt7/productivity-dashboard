import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabaseConfigured } from '../lib/supabase';

export default function Register() {
  const { signUp, session, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // If a session appears while on this page (e.g. the user confirms their
  // email in another tab and comes back), forward them to the dashboard.
  if (!loading && session) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    const { error } = await signUp(email.trim(), password);
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }

    setInfo(
      'Account created. If email confirmation is enabled for your Supabase project, check your inbox before signing in.',
    );
    setTimeout(() => navigate('/login', { replace: true }), 2500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-accent">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-mute">Start tracking your goals today</p>
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
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="label" htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input"
              placeholder="Re-enter your password"
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
            {busy ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-center text-sm text-mute">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
