'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';

type AuthState = {
  user: any | null;
  profile: Profile | null;
};

const supabase = createClient();
let authState: AuthState | null = null;
let authPromise: Promise<void> | null = null;
const subscribers = new Set<(state: AuthState) => void>();

const notifySubscribers = (state: AuthState) => {
  subscribers.forEach((callback) => callback(state));
};

const initializeAuth = async () => {
  if (authPromise) return authPromise;

  authPromise = (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let profile: Profile | null = null;

      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        profile = data;
      }

      authState = { user, profile };
      notifySubscribers(authState);
    } catch (error) {
      authState = { user: null, profile: null };
      notifySubscribers(authState);
    }
  })();

  return authPromise;
};

export function useAuth() {
  const [user, setUser] = useState(authState?.user ?? null);
  const [profile, setProfile] = useState<Profile | null>(authState?.profile ?? null);
  const [loading, setLoading] = useState(authState === null);

  useEffect(() => {
    let active = true;

    const updateState = (state: AuthState) => {
      if (!active) return;
      setUser(state.user);
      setProfile(state.profile);
      setLoading(false);
    };

    subscribers.add(updateState);

    if (authState) {
      updateState(authState);
    } else {
      initializeAuth().catch(() => {
        if (active) setLoading(false);
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      let nextProfile: Profile | null = null;

      if (nextUser) {
        const { data } = await supabase.from('profiles').select('*').eq('id', nextUser.id).single();
        nextProfile = data;
      }

      authState = { user: nextUser, profile: nextProfile };
      notifySubscribers(authState);
    });

    return () => {
      active = false;
      subscribers.delete(updateState);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // 1. Clear server-side cookies first by hitting our API route
      await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });

      // 2. Clear client-side Supabase session
      const { error: clearError } = await supabase.auth.signOut();
      if (clearError && clearError.message !== 'No session found') {
        console.error('Logout error:', clearError);
      }
    } catch (err) {
      console.error('Unexpected logout error:', err);
    } finally {
      // Force clear local state
      authState = { user: null, profile: null };
      notifySubscribers(authState);
      
      // Clear any cached tokens from localStorage
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        // localStorage might not be available in some environments
      }
      
      // Hard redirect to ensure clean slate, including our escape hatch query param
      window.location.href = '/login?logged_out=1';
    }
  };

  return { user, profile, loading, signOut };
}
