
/**
 * Update Manager Hook - Manual Updates Only
 * 
 * React hook for managing manual application updates from GitHub releases.
 */

import { useState, useCallback } from 'react';
import { 
  checkForUpdates, 
  applyUpdate, 
  getUpdateInfo 
} from '@/utils/updateManager';
import { 
  UpdateProgress 
} from '@/utils/manualUpdateManager';
import { 
  getInstalledVersion 
} from '@/utils/versionManager';
import { 
  getLastUpstreamCheckTime,
  setLastUpstreamCheckTime 
} from '@/utils/upstreamVersionManager';
import { toast } from '@/hooks/use-toast';

export const useUpdateManager = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [lastCheckTime, setLastCheckTimeState] = useState<Date | null>(null);
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null);

  const loadCurrentInfo = useCallback(async () => {
    try {
      const installed = getInstalledVersion();
      setCurrentVersion(installed?.version || '1.4.2');
      
      const lastCheck = getLastUpstreamCheckTime();
      setLastCheckTimeState(lastCheck);
    } catch (error) {
      console.error('Failed to load current info:', error);
    }
  }, []);

  const checkForUpdatesManually = useCallback(async () => {
    setIsChecking(true);
    
    try {
      const updateStatus = await checkForUpdates();
      
      if (updateStatus.isAvailable && updateStatus.updateInfo) {
        setUpdateInfo(updateStatus.updateInfo);
        setUpdateAvailable(true);
        
        toast({
          title: "Update Available",
          description: `Version ${updateStatus.latestVersion} is available for manual installation.`,
          variant: "default",
        });
      } else {
        setUpdateAvailable(false);
        setUpdateInfo(null);
        
        toast({
          title: "No Updates Available",
          description: "You're running the latest version of the app.",
          variant: "success",
        });
      }
      
      setLastUpstreamCheckTime();
      setLastCheckTimeState(new Date());
      
    } catch (error) {
      console.error('Failed to check for updates:', error);
      
      toast({
        title: "Update Check Failed",
        description: "Unable to check for updates. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  }, []);

  const installUpdate = useCallback(async () => {
    if (!updateInfo) {
      toast({
        title: "No Update Available",
        description: "Please check for updates first.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    setUpdateProgress({ stage: 'checking', message: 'Starting update...' });
    
    try {
      const success = await applyUpdate((progress) => {
        setUpdateProgress(progress);
      });
      
      if (success) {
        toast({
          title: "Update Installed Successfully",
          description: `The app has been updated to version ${updateInfo.version}!`,
          variant: "success",
        });
        
        setUpdateAvailable(false);
        setUpdateInfo(null);
        
        // Reload current info to reflect new version
        await loadCurrentInfo();
        
        // Suggest page refresh to load new version
        setTimeout(() => {
          if (confirm('Update complete! Refresh the page to use the new version?')) {
            window.location.reload();
          }
        }, 1000);
      }
      
    } catch (error) {
      console.error('Failed to install update:', error);
      
      toast({
        title: "Update Failed",
        description: "Failed to install the update. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setUpdateProgress(null);
    }
  }, [updateInfo, loadCurrentInfo]);

  const openReleaseNotes = useCallback(() => {
    if (updateInfo?.htmlUrl) {
      window.open(updateInfo.htmlUrl, '_blank');
    }
  }, [updateInfo]);

  return {
    isChecking,
    isUpdating,
    updateAvailable,
    updateInfo,
    currentVersion,
    lastCheckTime,
    updateProgress,
    loadCurrentInfo,
    checkForUpdatesManually,
    installUpdate,
    openReleaseNotes
  };
};
