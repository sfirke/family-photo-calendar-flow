
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, X, Info } from 'lucide-react';
import { checkForUpdates, applyUpdate, getUpdateInfo } from '@/utils/updateManager';
import { getCurrentVersion, isNewVersion, setStoredVersion, shouldCheckForUpdates, setLastCheckTime } from '@/utils/versionManager';
import { toast } from '@/hooks/use-toast';

const UpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);

  useEffect(() => {
    const checkUpdates = async () => {
      // Check if this is a new version based on our version tracking
      const hasNewVersion = await isNewVersion();
      if (hasNewVersion) {
        setUpdateAvailable(true);
        const currentVersion = await getCurrentVersion();
        setStoredVersion(currentVersion);
        
        const info = await getUpdateInfo();
        setUpdateInfo(info);
        
        toast({
          title: "App Updated!",
          description: `Welcome to version ${currentVersion}! New features and improvements are available.`,
          variant: "success",
        });
        return;
      }

      // Check for service worker updates
      if (shouldCheckForUpdates()) {
        setLastCheckTime();
        
        try {
          const hasUpdate = await checkForUpdates();
          if (hasUpdate) {
            const info = await getUpdateInfo();
            setUpdateInfo(info);
            setUpdateAvailable(true);
            
            toast({
              title: "Update Available",
              description: "A new version of the app is ready to install.",
              variant: "default",
            });
          }
        } catch (error) {
          console.error('Failed to check for updates:', error);
        }
      }
    };

    // Check immediately and then periodically
    checkUpdates();
    
    const interval = setInterval(checkUpdates, 30 * 60 * 1000); // Check every 30 minutes
    
    return () => clearInterval(interval);
  }, []);

  const handleApplyUpdate = async () => {
    setIsApplyingUpdate(true);
    
    try {
      await applyUpdate();
      
      toast({
        title: "Update Applied",
        description: "The app has been updated successfully!",
        variant: "success",
      });
    } catch (error) {
      console.error('Failed to apply update:', error);
      
      toast({
        title: "Update Failed",
        description: "Failed to apply the update. Please refresh the page manually.",
        variant: "destructive",
      });
    } finally {
      setIsApplyingUpdate(false);
      setUpdateAvailable(false);
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    
    toast({
      title: "Update Postponed",
      description: "You can update later. The new version will be applied on your next visit.",
      variant: "default",
    });
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg md:left-auto md:right-4 md:max-w-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <RefreshCw className="h-4 w-4" />
              Update Available
            </h3>
            {updateInfo && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Version {updateInfo.version}
                {updateInfo.buildDate && (
                  <span className="block">
                    Built: {new Date(updateInfo.buildDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              A new version of the app is ready. Update now for the latest features and improvements.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleApplyUpdate} 
                size="sm" 
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                disabled={isApplyingUpdate}
              >
                {isApplyingUpdate ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Update Now
                  </>
                )}
              </Button>
              <Button 
                onClick={handleDismiss} 
                variant="outline" 
                size="sm"
                disabled={isApplyingUpdate}
                className="border-gray-300 dark:border-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpdateNotification;
