
import { getVersionInfo } from './versionManager';

export const checkForUpdates = async (): Promise<boolean> => {
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
    console.error('Error checking for updates:', error);
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
    return {
      version: versionInfo.version,
      buildDate: versionInfo.buildDate,
      gitHash: versionInfo.gitHash,
      hasUpdate: await checkForUpdates()
    };
  } catch (error) {
    console.error('Error getting update info:', error);
    return null;
  }
};
