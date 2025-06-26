
import { useState, useEffect } from 'react';

interface LocalUser {
  id: string;
  email: string;
  full_name?: string;
  user_metadata?: {
    full_name?: string;
  };
}

const LOCAL_USER_KEY = 'family_calendar_user';

// Generate a simple UUID-like string
const generateId = () => 'user_' + Math.random().toString(36).substr(2, 9);

export const useLocalAuth = () => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing user from localStorage
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem(LOCAL_USER_KEY);
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading local user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
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

    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(guestUser));
    setUser(guestUser);
  };

  const signOut = async () => {
    localStorage.removeItem(LOCAL_USER_KEY);
    setUser(null);
  };

  // Auto sign-in as guest if no user is present
  useEffect(() => {
    if (!loading && !user) {
      signInAsGuest();
    }
  }, [loading, user]);

  return {
    user,
    loading,
    signOut,
    signInAsGuest
  };
};
