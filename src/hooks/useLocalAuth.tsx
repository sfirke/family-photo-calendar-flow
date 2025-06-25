
import { useState, useEffect } from 'react';

interface LocalUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface LocalSession {
  user: LocalUser;
  provider_token?: string;
  expires_at?: number;
}

const LOCAL_USER_KEY = 'family_calendar_user';
const LOCAL_SESSION_KEY = 'family_calendar_session';

// Generate a simple UUID-like string
const generateId = () => 'user_' + Math.random().toString(36).substr(2, 9);

export const useLocalAuth = () => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing session from localStorage
    const loadSession = () => {
      try {
        const storedSession = localStorage.getItem(LOCAL_SESSION_KEY);
        const storedUser = localStorage.getItem(LOCAL_USER_KEY);
        
        if (storedSession && storedUser) {
          const sessionData = JSON.parse(storedSession);
          const userData = JSON.parse(storedUser);
          
          setSession(sessionData);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading local session:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const signInAsGuest = () => {
    const guestUser: LocalUser = {
      id: generateId(),
      email: 'guest@familycalendar.app',
      full_name: 'Guest User',
      user_metadata: {
        full_name: 'Guest User'
      }
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

  const signOut = async () => {
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(LOCAL_SESSION_KEY);
    setUser(null);
    setSession(null);
  };

  // Auto sign-in as guest if no user is present
  useEffect(() => {
    if (!loading && !user) {
      signInAsGuest();
    }
  }, [loading, user]);

  return {
    user,
    session,
    loading,
    signOut,
    signInAsGuest
  };
};
