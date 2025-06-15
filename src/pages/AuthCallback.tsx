
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
          // Close the popup window or redirect
          if (window.opener) {
            // We're in a popup - post message to parent and close
            window.opener.postMessage({ type: 'SUPABASE_AUTH_COMPLETE' }, window.location.origin);
            window.close();
          } else {
            // Not in popup, redirect to main app
            window.location.href = '/';
          }
        }, 500);
      } catch (error) {
        console.error('Unexpected auth callback error:', error);
        // Still try to close the popup or redirect
        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            window.location.href = '/';
          }
        }, 500);
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
        <p className="text-sm text-gray-500 mt-2">This window will close automatically</p>
      </div>
    </div>
  );
};

export default AuthCallback;
