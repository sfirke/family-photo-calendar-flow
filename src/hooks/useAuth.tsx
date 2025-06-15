
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
        
        // Store Google tokens if available and user just signed in
        if (event === 'SIGNED_IN' && session?.provider_token && session?.user) {
          console.log('Storing Google tokens for user:', session.user.email);
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(() => {
            if (mounted) {
              updateUserProfile(session);
            }
          }, 100);
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

  const updateUserProfile = async (session: Session) => {
    if (!session.user || !session.provider_token) {
      console.log('No user or provider token available for profile update');
      return;
    }

    try {
      console.log('Updating user profile with Google tokens');
      const { error } = await supabase
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
      
      if (error) {
        console.error('Error updating profile:', error);
      } else {
        console.log('Profile updated successfully');
      }
    } catch (error) {
      console.error('Unexpected error updating profile:', error);
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
