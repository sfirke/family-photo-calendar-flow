
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';
import { checkForUpdates, applyUpdate } from '@/utils/updateManager';
import { getCurrentVersion, isNewVersion, setStoredVersion, shouldCheckForUpdates, setLastCheckTime } from '@/utils/versionManager';
import { toast } from '@/hooks/use-toast';

const UpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);

  useEffect(() => {
    const checkUpdates = async () => {
      // Check if this is a new version based on our version tracking
      if (isNewVersion()) {
        setUpdateAvailable(true);
        setStoredVersion(getCurrentVersion());
        
        toast.success({
          title: "App Updated!",
          description: `Welcome to version ${getCurrentVersion()}! New features and improvements are available.`,
        });
        return;
      }

      // Check for service worker updates
      if (shouldCheckForUpdates()) {
        setLastCheckTime();
        
        try {
          const hasUpdate = await checkForUpdates();
          if (hasUpdate) {
            setUpdateAvailable(true);
            
            toast.info({
              title: "Update Available",
              description: "A new version of the app is ready to install.",
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
      
      toast.success({
        title: "Update Applied",
        description: "The app has been updated successfully!",
      });
    } catch (error) {
      console.error('Failed to apply update:', error);
      
      toast.error({
        title: "Update Failed",
        description: "Failed to apply the update. Please refresh the page manually.",
      });
    } finally {
      setIsApplyingUpdate(false);
      setUpdateAvailable(false);
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    
    toast.info({
      title: "Update Postponed",
      description: "You can update later. The new version will be applied on your next visit.",
    });
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg md:left-auto md:right-4 md:max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Update Available
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              A new version of the app is ready. Update now for the latest features and improvements.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleApplyUpdate} 
                size="sm" 
                className="flex-1"
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
