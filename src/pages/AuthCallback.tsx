
import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
        }
        
        // Close the popup window
        if (window.opener) {
          window.close();
        } else {
          // If not in popup, redirect to main app
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Unexpected auth callback error:', error);
        // Still try to close the popup
        if (window.opener) {
          window.close();
        } else {
          window.location.href = '/';
        }
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
