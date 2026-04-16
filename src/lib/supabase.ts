import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Do not throw at import-time to avoid breaking the build; log a helpful
  // error instead. The app surfaces a friendly banner when credentials are
  // missing.
  // eslint-disable-next-line no-console
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill in your project credentials.',
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'http://localhost:54321',
  supabaseAnonKey ?? 'public-anon-key',
  {
    auth: {
      // Persist the session in localStorage so a page reload keeps the user
      // signed in.
      persistSession: true,
      // Auto-refresh access tokens before they expire.
      autoRefreshToken: true,
      // CRITICAL for email confirmation / magic links: with PKCE the SDK sees
      // `?code=...` on the landing URL, exchanges it for a session, fires
      // `SIGNED_IN` on `onAuthStateChange`, and strips the param so it doesn't
      // confuse the router.
      detectSessionInUrl: true,
      // PKCE is the modern Supabase default and the format used by newly
      // generated confirmation emails. Using 'implicit' here against a PKCE
      // project causes the SDK to ignore `?code=...` in the URL, which looks
      // like "Dashboard flashes, then redirects to /login".
      flowType: 'pkce',
    },
  },
);

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
