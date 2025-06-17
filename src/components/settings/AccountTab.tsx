
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, LogOut, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const AccountTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      console.log('Starting Google sign in process with expanded scopes');
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
        
        if (error.message.includes('Signups not allowed')) {
          toast({
            title: "Account Creation Disabled",
            description: "New account creation is currently disabled. Please contact the administrator.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Google Sign In Error",
            description: error.message,
            variant: "destructive"
          });
        }
        setIsLoading(false);
      } else {
        console.log('Google OAuth URL generated, redirecting...');
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

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    try {
      console.log('Refreshing Google access token...');
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
        console.error('Token refresh error:', error);
        toast({
          title: "Token Refresh Error",
          description: error.message,
          variant: "destructive"
        });
        setIsRefreshing(false);
      } else {
        console.log('Token refresh initiated, redirecting...');
        toast({
          title: "Refreshing tokens",
          description: "You will be redirected to Google to refresh your access tokens.",
        });
      }
    } catch (error) {
      console.error('Unexpected error refreshing token:', error);
      toast({
        title: "Error",
        description: "Failed to refresh tokens",
        variant: "destructive"
      });
      setIsRefreshing(false);
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
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100">Google Account Connection</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Sign in with Google to access your calendar events and photo albums for background slideshows.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user ? (
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              {user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <User className="h-8 w-8 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div className="text-center">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">{user.user_metadata?.full_name || user.email}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>
            
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Button
                onClick={handleRefreshToken}
                disabled={isRefreshing}
                variant="outline"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Access Token'}
              </Button>
              
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4 py-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Connect Your Google Account</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
              Sign in with Google to access your calendar events and photo albums for background slideshows.
            </p>
            
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md max-w-md">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">Note</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  You may need to reconnect if you see permission errors. This will ensure proper access to both Calendar and Photos.
                </p>
              </div>
            </div>
            
            <Button 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <User className="h-4 w-4 mr-2" />
              {isLoading ? 'Redirecting to Google...' : 'Sign in with Google'}
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-md">
              You will be redirected to Google to complete the sign-in process.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountTab;
