
import { getVersionInfo } from './versionManager';
import { 
  getLatestUpstreamVersion, 
  isUpstreamUpdateAvailable, 
  shouldCheckUpstream,
  getUpstreamReleaseInfo,
  setLastUpstreamCheckTime,
  cacheUpstreamVersion
} from './upstreamVersionManager';

export const checkForUpdates = async (): Promise<boolean> => {
  const hasServiceWorkerUpdate = await checkServiceWorkerUpdate();
  const hasUpstreamUpdate = await checkUpstreamUpdate();
  
  return hasServiceWorkerUpdate || hasUpstreamUpdate;
};

const checkServiceWorkerUpdate = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return false;
    }

    // Check if there's a waiting service worker
    if (registration.waiting) {
      return true;
    }

    // Check for updates
    await registration.update();
    
    return new Promise((resolve) => {
      const handleUpdateFound = () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              resolve(true);
            }
          });
        }
      };

      registration.addEventListener('updatefound', handleUpdateFound);
      
      // Resolve false after 5 seconds if no update found
      setTimeout(() => resolve(false), 5000);
    });
  } catch (error) {
    console.error('Error checking for service worker updates:', error);
    return false;
  }
};

const checkUpstreamUpdate = async (): Promise<boolean> => {
  try {
    // Only check upstream if it's time to do so (hourly)
    if (!shouldCheckUpstream()) {
      return false;
    }

    const versionInfo = await getVersionInfo();
    const hasUpdate = await isUpstreamUpdateAvailable(versionInfo.version);
    
    if (hasUpdate) {
      // Cache the upstream version info
      const upstreamInfo = await getLatestUpstreamVersion();
      if (upstreamInfo) {
        cacheUpstreamVersion(upstreamInfo);
      }
    }
    
    setLastUpstreamCheckTime();
    return hasUpdate;
  } catch (error) {
    console.error('Error checking for upstream updates:', error);
    return false;
  }
};

export const applyUpdate = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.waiting) {
      // Tell the waiting service worker to skip waiting and become active
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to use the new service worker
      window.location.reload();
    }
  } catch (error) {
    console.error('Error applying update:', error);
  }
};

export const getUpdateInfo = async () => {
  try {
    const versionInfo = await getVersionInfo();
    const hasServiceWorkerUpdate = await checkServiceWorkerUpdate();
    const hasUpstreamUpdate = await checkUpstreamUpdate();
    
    return {
      version: versionInfo.version,
      buildDate: versionInfo.buildDate,
      gitHash: versionInfo.gitHash,
      hasServiceWorkerUpdate,
      hasUpstreamUpdate,
      hasUpdate: hasServiceWorkerUpdate || hasUpstreamUpdate
    };
  } catch (error) {
    console.error('Error getting update info:', error);
    return null;
  }
};

export const getUpstreamUpdateInfo = async () => {
  try {
    return await getUpstreamReleaseInfo();
  } catch (error) {
    console.error('Error getting upstream update info:', error);
    return null;
  }
};
