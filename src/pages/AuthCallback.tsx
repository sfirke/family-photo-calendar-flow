
import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback processing...');
        
        // Handle the auth callback from the URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          // Check if it's a signup disabled error
          if (error.message.includes('Signups not allowed')) {
            console.error('Signups are disabled for this Supabase instance');
          }
        } else if (data.session) {
          console.log('Auth callback success:', data.session.user?.email);
          console.log('Session established, provider:', data.session.provider_token ? 'Google' : 'unknown');
        } else {
          console.log('No session found in callback');
        }
        
        // Wait a bit longer to ensure session is properly set
        setTimeout(() => {
          console.log('Redirecting to main app');
          window.location.href = '/';
        }, 2000);
      } catch (error) {
        console.error('Unexpected auth callback error:', error);
        // Still redirect to main app on error
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we complete your authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
