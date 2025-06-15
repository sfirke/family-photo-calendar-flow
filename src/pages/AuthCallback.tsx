
import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback processing...');
        
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
        } else {
          console.log('Auth callback success:', data.session?.user?.email);
        }
        
        // Small delay to ensure session is properly set
        setTimeout(() => {
          // Redirect to main app
          window.location.href = '/';
        }, 1000);
      } catch (error) {
        console.error('Unexpected auth callback error:', error);
        // Still redirect to main app on error
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
        <p className="text-sm text-gray-500 mt-2">Redirecting you back to the app...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
