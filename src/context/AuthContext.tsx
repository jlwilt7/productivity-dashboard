import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // `loading` stays true until Supabase tells us the auth state has been
  // resolved. This is important on cold load, especially when the URL
  // contains `#access_token=...` from an email confirmation link — we must
  // not render routes (and risk bouncing the user to /login) until the SDK
  // has finished parsing the fragment.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Subscribe FIRST so we never miss the INITIAL_SESSION event. The v2 SDK
    // fires INITIAL_SESSION once during startup *after* it has processed any
    // `#access_token` fragment in the URL. That is the reliable signal that
    // auth bootstrap is complete.
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      // Handle every event the app cares about:
      //   INITIAL_SESSION   — first load; session may or may not exist
      //   SIGNED_IN         — password login, email confirm, magic link
      //   TOKEN_REFRESHED   — access token was rotated
      //   SIGNED_OUT        — user logged out or token was revoked
      //   USER_UPDATED      — profile changed
      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'SIGNED_OUT' ||
        event === 'USER_UPDATED'
      ) {
        setSession(newSession);
        setLoading(false);
      }
    });

    // Belt-and-suspenders: if for any reason the listener above does not
    // fire (e.g. SDK version skew), resolve loading from a direct fetch too.
    // This runs in parallel and whichever finishes first flips `loading`.
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession((prev) => prev ?? data.session);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { error: error?.message ?? null };
      },
      signUp: async (email, password) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Where the Supabase confirmation email should send the user
            // once they click the link. We send them to the app root; the
            // router then forwards authenticated users to /dashboard.
            // NOTE: this URL must be allow-listed under Authentication →
            // URL Configuration → Redirect URLs in the Supabase dashboard.
            emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
          },
        });
        return { error: error?.message ?? null };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
      resetPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
        });
        return { error: error?.message ?? null };
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
