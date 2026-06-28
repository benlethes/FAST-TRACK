import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore persisted session from AsyncStorage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // React to sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Handle magic link deep links — Supabase redirects to fasttrack:// with
    // access_token and refresh_token in the fragment or query string.
    const exchangeTokensFromUrl = async (url: string) => {
      const part = url.split('#')[1] ?? url.split('?')[1] ?? '';
      const params = new URLSearchParams(part);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
    };

    // URL that was used to cold-launch the app (clicked magic link while app was closed)
    Linking.getInitialURL().then(url => {
      if (url) exchangeTokensFromUrl(url);
    });

    // URL received while the app is already running
    const linkSub = Linking.addEventListener('url', ({ url }) => exchangeTokensFromUrl(url));

    return () => {
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  return { session, user, loading };
}
