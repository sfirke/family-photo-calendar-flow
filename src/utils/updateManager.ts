
/**
 * Update Manager - Manual Updates Only
 * 
 * Simplified update manager focused on manual GitHub release updates.
 * Removed service worker update checking to focus on upstream releases only.
 */

import { 
  checkForManualUpdate, 
  applyManualUpdate, 
  UpdateStatus, 
  UpdateProgress 
} from './manualUpdateManager';
import { getLatestUpstreamVersion } from './upstreamVersionManager';
import { getInstalledVersion } from './versionManager';

/**
 * Check for available updates (manual only)
 */
export const checkForUpdates = async (): Promise<UpdateStatus> => {
  return await checkForManualUpdate();
};

/**
 * Apply available update manually
 */
export const applyUpdate = async (
  onProgress?: (progress: UpdateProgress) => void
): Promise<boolean> => {
  try {
    const updateInfo = await getLatestUpstreamVersion();
    
    if (!updateInfo) {
      onProgress?.({
        stage: 'error',
        message: 'No update information available'
      });
      return false;
    }

    return await applyManualUpdate(updateInfo, onProgress);
  } catch (error) {
    console.error('Failed to apply update:', error);
    onProgress?.({
      stage: 'error',
      message: `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    return false;
  }
};

/**
 * Get current update information
 */
export const getUpdateInfo = async () => {
  try {
    const updateStatus = await checkForUpdates();
    const installed = getInstalledVersion();
    
    return {
      currentVersion: updateStatus.currentVersion,
      installedDate: installed?.installDate,
      isUpdateAvailable: updateStatus.isAvailable,
      latestVersion: updateStatus.latestVersion,
      updateInfo: updateStatus.updateInfo,
      canUpdate: updateStatus.canUpdate
    };
  } catch (error) {
    console.error('Error getting update info:', error);
    return null;
  }
};
