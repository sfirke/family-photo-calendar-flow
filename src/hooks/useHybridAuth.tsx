
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface LocalUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  isGoogleConnected?: boolean;
  googleTokens?: {
    access_token: string;
    refresh_token?: string;
    expires_at: number;
  };
}

interface LocalSession {
  user: LocalUser;
  provider_token?: string;
  expires_at?: number;
}

const LOCAL_USER_KEY = 'family_calendar_user';
const LOCAL_SESSION_KEY = 'family_calendar_session';
const GOOGLE_TOKENS_KEY = 'family_calendar_google_tokens';

const generateId = () => 'user_' + Math.random().toString(36).substr(2, 9);

export const useHybridAuth = () => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  useEffect(() => {
    loadLocalSession();
    setupGoogleAuthListener();
  }, []);

  const loadLocalSession = () => {
    try {
      const storedSession = localStorage.getItem(LOCAL_SESSION_KEY);
      const storedUser = localStorage.getItem(LOCAL_USER_KEY);
      const storedTokens = localStorage.getItem(GOOGLE_TOKENS_KEY);
      
      if (storedSession && storedUser) {
        const sessionData = JSON.parse(storedSession);
        const userData = JSON.parse(storedUser);
        
        // Check if Google tokens exist and are valid
        if (storedTokens) {
          const tokens = JSON.parse(storedTokens);
          if (tokens.expires_at && tokens.expires_at > Date.now()) {
            userData.isGoogleConnected = true;
            userData.googleTokens = tokens;
          } else {
            // Tokens expired, remove them
            localStorage.removeItem(GOOGLE_TOKENS_KEY);
            userData.isGoogleConnected = false;
          }
        }
        
        setSession(sessionData);
        setUser(userData);
      } else {
        // Auto sign-in as guest if no session
        signInAsGuest();
      }
    } catch (error) {
      console.error('Error loading local session:', error);
      signInAsGuest();
    } finally {
      setLoading(false);
    }
  };

  const setupGoogleAuthListener = () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, supabaseSession) => {
        if (event === 'SIGNED_IN' && supabaseSession?.provider_token) {
          await handleGoogleSignIn(supabaseSession);
        }
      }
    );

    return () => subscription.unsubscribe();
  };

  const handleGoogleSignIn = async (supabaseSession: Session) => {
    try {
      const googleTokens = {
        access_token: supabaseSession.provider_token!,
        refresh_token: supabaseSession.provider_refresh_token,
        expires_at: (supabaseSession.expires_at || 0) * 1000 // Convert to milliseconds
      };

      // Store Google tokens in localStorage
      localStorage.setItem(GOOGLE_TOKENS_KEY, JSON.stringify(googleTokens));

      // Also store tokens in database for edge function access
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id || supabaseSession.user.id,
          email: supabaseSession.user.email,
          full_name: supabaseSession.user.user_metadata?.full_name,
          avatar_url: supabaseSession.user.user_metadata?.avatar_url,
          google_access_token: googleTokens.access_token,
          google_refresh_token: googleTokens.refresh_token,
          google_token_expires_at: new Date(googleTokens.expires_at).toISOString()
        });

      if (profileError) {
        console.error('Error storing profile:', profileError);
      }

      // Update current user with Google connection
      if (user) {
        const updatedUser = {
          ...user,
          isGoogleConnected: true,
          googleTokens,
          full_name: supabaseSession.user.user_metadata?.full_name || user.full_name,
          avatar_url: supabaseSession.user.user_metadata?.avatar_url || user.avatar_url,
          email: supabaseSession.user.email || user.email,
          id: user.id // Keep the original local user ID
        };

        const updatedSession = {
          ...session!,
          user: updatedUser
        };

        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updatedSession));

        setUser(updatedUser);
        setSession(updatedSession);
      }

      setIsConnectingGoogle(false);
    } catch (error) {
      console.error('Error handling Google sign in:', error);
      setIsConnectingGoogle(false);
    }
  };

  const signInAsGuest = () => {
    const guestUser: LocalUser = {
      id: generateId(),
      email: 'guest@familycalendar.app',
      full_name: 'Guest User',
      user_metadata: {
        full_name: 'Guest User'
      },
      isGoogleConnected: false
    };

    const guestSession: LocalSession = {
      user: guestUser,
      expires_at: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
    };

    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(guestUser));
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(guestSession));

    setUser(guestUser);
    setSession(guestSession);
  };

  const connectGoogleCalendar = async () => {
    setIsConnectingGoogle(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        console.error('Google Calendar connection error:', error);
        setIsConnectingGoogle(false);
      }
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      setIsConnectingGoogle(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Remove Google tokens
      localStorage.removeItem(GOOGLE_TOKENS_KEY);
      
      // Update user state
      if (user) {
        const updatedUser = {
          ...user,
          isGoogleConnected: false,
          googleTokens: undefined
        };

        const updatedSession = {
          ...session!,
          user: updatedUser
        };

        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updatedSession));

        setUser(updatedUser);
        setSession(updatedSession);
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem(LOCAL_USER_KEY);
      localStorage.removeItem(LOCAL_SESSION_KEY);
      localStorage.removeItem(GOOGLE_TOKENS_KEY);
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshGoogleTokens = async () => {
    if (!user?.googleTokens?.refresh_token) {
      return false;
    }

    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      if (data.session?.provider_token) {
        const googleTokens = {
          access_token: data.session.provider_token,
          refresh_token: data.session.provider_refresh_token || user.googleTokens.refresh_token,
          expires_at: (data.session.expires_at || 0) * 1000
        };

        // Update stored tokens
        localStorage.setItem(GOOGLE_TOKENS_KEY, JSON.stringify(googleTokens));

        // Update user state
        const updatedUser = { ...user, googleTokens };
        const updatedSession = { ...session!, user: updatedUser };

        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updatedSession));

        setUser(updatedUser);
        setSession(updatedSession);

        return true;
      }
    } catch (error) {
      console.error('Error refreshing Google tokens:', error);
    }

    return false;
  };

  return {
    user,
    session,
    loading,
    isConnectingGoogle,
    signOut,
    signInAsGuest,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    refreshGoogleTokens
  };
};
