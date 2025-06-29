
import { useState, useCallback } from 'react';
import { checkForUpdates, applyUpdate, getUpdateInfo, getUpstreamUpdateInfo } from '@/utils/updateManager';
import { getCurrentVersion, getLastCheckTime, setLastCheckTime } from '@/utils/versionManager';
import { getLastUpstreamCheckTime } from '@/utils/upstreamVersionManager';
import { toast } from '@/hooks/use-toast';

export const useUpdateManager = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [upstreamUpdateAvailable, setUpstreamUpdateAvailable] = useState(false);
  const [upstreamUpdateInfo, setUpstreamUpdateInfo] = useState<any>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [lastCheckTime, setLastCheckTimeState] = useState<Date | null>(null);
  const [lastUpstreamCheckTime, setLastUpstreamCheckTimeState] = useState<Date | null>(null);

  const loadCurrentInfo = useCallback(async () => {
    try {
      const version = await getCurrentVersion();
      setCurrentVersion(version);
      
      const lastCheck = getLastCheckTime();
      setLastCheckTimeState(lastCheck);
      
      const lastUpstreamCheck = getLastUpstreamCheckTime();
      setLastUpstreamCheckTimeState(lastUpstreamCheck);
    } catch (error) {
      console.error('Failed to load current info:', error);
    }
  }, []);

  const checkForUpdatesManually = useCallback(async () => {
    setIsChecking(true);
    
    try {
      const hasUpdate = await checkForUpdates();
      
      if (hasUpdate) {
        const info = await getUpdateInfo();
        setUpdateInfo(info);
        setUpdateAvailable(info?.hasServiceWorkerUpdate || false);
        
        // Check for upstream updates
        const upstreamInfo = await getUpstreamUpdateInfo();
        if (upstreamInfo) {
          setUpstreamUpdateInfo(upstreamInfo);
          setUpstreamUpdateAvailable(true);
          
          toast({
            title: "Update Available",
            description: `Version ${upstreamInfo.version} is available on GitHub.`,
            variant: "default",
          });
        } else if (info?.hasServiceWorkerUpdate) {
          toast({
            title: "Update Available",
            description: "A new version is ready to install.",
            variant: "default",
          });
        }
      } else {
        setUpdateAvailable(false);
        setUpdateInfo(null);
        setUpstreamUpdateAvailable(false);
        setUpstreamUpdateInfo(null);
        
        toast({
          title: "No Updates Available",
          description: "You're running the latest version of the app.",
          variant: "success",
        });
      }
      
      setLastCheckTime();
      setLastCheckTimeState(new Date());
      setLastUpstreamCheckTimeState(new Date());
      
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
    setIsUpdating(true);
    
    try {
      await applyUpdate();
      
      toast({
        title: "Update Installed",
        description: "The app has been updated successfully!",
        variant: "success",
      });
      
      setUpdateAvailable(false);
      setUpdateInfo(null);
      
    } catch (error) {
      console.error('Failed to install update:', error);
      
      toast({
        title: "Update Failed",
        description: "Failed to install the update. Please refresh the page manually.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const openUpstreamUpdate = useCallback(() => {
    if (upstreamUpdateInfo?.htmlUrl) {
      window.open(upstreamUpdateInfo.htmlUrl, '_blank');
    }
  }, [upstreamUpdateInfo]);

  return {
    isChecking,
    isUpdating,
    updateAvailable,
    updateInfo,
    upstreamUpdateAvailable,
    upstreamUpdateInfo,
    currentVersion,
    lastCheckTime,
    lastUpstreamCheckTime,
    loadCurrentInfo,
    checkForUpdatesManually,
    installUpdate,
    openUpstreamUpdate
  };
};
