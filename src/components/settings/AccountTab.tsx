
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const AccountTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/photoslibrary.readonly',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        console.error('Google Sign In Error:', error);
        toast({
          title: "Google Sign In Error",
          description: error.message,
          variant: "destructive"
        });
        setIsLoading(false);
      } else if (data?.url) {
        // Open Google auth in a popup
        const popup = window.open(
          data.url, 
          'google-auth', 
          'width=500,height=600,scrollbars=yes,resizable=yes,left=' + 
          (window.screen.width / 2 - 250) + ',top=' + (window.screen.height / 2 - 300)
        );
        
        // Listen for the popup to complete authentication
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data?.type === 'SUPABASE_AUTH_COMPLETE') {
            console.log('Auth completed via popup');
            setIsLoading(false);
            window.removeEventListener('message', messageListener);
            
            // Small delay to let auth state update
            setTimeout(() => {
              toast({
                title: "Successfully signed in!",
                description: "Welcome to your family calendar.",
              });
            }, 500);
          }
        };
        
        window.addEventListener('message', messageListener);
        
        // Fallback: check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup && popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            setIsLoading(false);
          }
        }, 1000);

        // Cleanup after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          if (popup && !popup.closed) {
            popup.close();
          }
          setIsLoading(false);
        }, 300000);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Account Connection</CardTitle>
        <CardDescription>
          Sign in with Google to access your calendar events and photo albums for background slideshows.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user ? (
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              {user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <User className="h-8 w-8 text-green-600" />
              )}
            </div>
            <div className="text-center">
              <h3 className="font-medium">{user.user_metadata?.full_name || user.email}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4 py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-medium">Connect Your Google Account</h3>
            <p className="text-sm text-gray-600 text-center max-w-md">
              Sign in with Google to access your calendar events and photo albums for background slideshows.
            </p>
            <Button 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <User className="h-4 w-4 mr-2" />
              {isLoading ? 'Opening Google Sign In...' : 'Sign in with Google'}
            </Button>
            <p className="text-xs text-gray-500 text-center max-w-md">
              A popup window will open to complete the Google sign-in process.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountTab;
