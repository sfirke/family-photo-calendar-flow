
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

  useEffect(() => {
    // Listen for auth changes after popup closes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        toast({
          title: "Successfully signed in!",
          description: "Welcome to your family calendar.",
        });
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

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
        // Open Google auth in a new tab
        const popup = window.open(data.url, 'google-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');
        
        // Poll for popup closure
        const checkClosed = setInterval(() => {
          if (popup && popup.closed) {
            clearInterval(checkClosed);
            // Auth state change will be handled by the listener above
          }
        }, 1000);

        // Fallback timeout
        setTimeout(() => {
          clearInterval(checkClosed);
          if (popup && !popup.closed) {
            popup.close();
          }
          setIsLoading(false);
        }, 300000); // 5 minutes timeout
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
              A new tab will open to complete the Google sign-in process. You can close it once signed in.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountTab;
