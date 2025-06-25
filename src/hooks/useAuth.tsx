
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else if (session && mounted) {
          console.log('Initial session found:', session.user?.email);
          setSession(session);
          setUser(session.user);
          
          // Store Google tokens if this is a fresh login with provider tokens
          if (session.provider_token) {
            await storeGoogleTokens(session);
          }
        }
      } catch (error) {
        console.error('Unexpected error getting session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email || 'no user');
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Store Google tokens if user just signed in with Google
        if (event === 'SIGNED_IN' && session?.provider_token && session?.user) {
          console.log('Storing Google tokens for user:', session.user.email);
          await storeGoogleTokens(session);
        }
        
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        }
      }
    );

    // Get initial session after setting up listener
    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const storeGoogleTokens = async (session: Session) => {
    if (!session.user || !session.provider_token) {
      console.log('No user or provider token available for profile update');
      return;
    }

    try {
      console.log('Storing Google tokens via edge function...');
      const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
        body: { 
          userId: session.user.id,
          action: 'store-profile',
          profileData: {
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url,
            google_access_token: session.provider_token,
            google_refresh_token: session.provider_refresh_token,
            google_token_expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
          }
        }
      });

      if (error) {
        console.error('Error storing profile via edge function:', error);
      } else {
        console.log('Profile stored successfully via edge function:', data);
      }
    } catch (error) {
      console.error('Unexpected error storing profile:', error);
    }
  };

  const signOut = async () => {
    console.log('Signing out user');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
  };
};
