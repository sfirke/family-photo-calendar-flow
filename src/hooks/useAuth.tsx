
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!error && session) {
        setSession(session);
        setUser(session.user);
      }
      setLoading(false);
    };

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Store Google tokens if available and user just signed in
        if (event === 'SIGNED_IN' && session?.provider_token && session?.user) {
          setTimeout(() => {
            updateUserProfile(session);
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const updateUserProfile = async (session: Session) => {
    if (!session.user || !session.provider_token) return;

    try {
      await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name,
          avatar_url: session.user.user_metadata?.avatar_url,
          google_access_token: session.provider_token,
          google_refresh_token: session.provider_refresh_token,
          google_token_expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
        });
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
  };
};
