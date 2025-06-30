
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, X, Download } from 'lucide-react';
import { checkForUpdates } from '@/utils/updateManager';
import { getInstalledVersion, setInstalledVersion } from '@/utils/versionManager';
import { shouldCheckUpstream, setLastUpstreamCheckTime } from '@/utils/upstreamVersionManager';
import { toast } from '@/hooks/use-toast';

const UpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);

  useEffect(() => {
    const checkUpdates = async () => {
      // Only check if it's time to do so
      if (!shouldCheckUpstream()) {
        return;
      }

      try {
        const updateStatus = await checkForUpdates();
        
        if (updateStatus.isAvailable && updateStatus.updateInfo) {
          setUpdateInfo(updateStatus.updateInfo);
          setUpdateAvailable(true);
          
          toast({
            title: "Update Available",
            description: `Version ${updateStatus.latestVersion} is available from GitHub.`,
            variant: "default",
          });
        }
        
        setLastUpstreamCheckTime();
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };

    // Check immediately and then periodically
    checkUpdates();
    
    const interval = setInterval(checkUpdates, 60 * 60 * 1000); // Check every hour
    
    return () => clearInterval(interval);
  }, []);

  const handleOpenSettings = () => {
    setUpdateAvailable(false);
    // This would typically open the settings modal to the update tab
    // For now, we'll just show a toast directing users to settings
    toast({
      title: "Update Available",
      description: "Go to Settings > Updates to install the latest version.",
      variant: "default",
    });
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    
    toast({
      title: "Update Dismissed",
      description: "You can check for updates later in Settings > Updates.",
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
              <Download className="h-4 w-4" />
              Update Available
            </h3>
            {updateInfo && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Version {updateInfo.version}
                <span className="block">
                  Released: {new Date(updateInfo.publishedAt).toLocaleDateString()}
                </span>
              </div>
            )}
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              A new version is available on GitHub. Go to Settings to install the update.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleOpenSettings} 
                size="sm" 
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Download className="h-4 w-4 mr-1" />
                Open Settings
              </Button>
              <Button 
                onClick={handleDismiss} 
                variant="outline" 
                size="sm"
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
