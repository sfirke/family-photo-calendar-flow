
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
import { getInstalledVersion, getCurrentVersion, compareVersions, setInstalledVersion } from './versionManager';

/**
 * Check for available updates (manual only)
 */
export const checkForUpdates = async (): Promise<UpdateStatus> => {
  const manual = await checkForManualUpdate();
  if (manual.isAvailable) return manual;

  // Fallback: compare local installed vs network version.json (auto-deploys)
  try {
    const installed = getInstalledVersion();
    const current = await getCurrentVersion();
    if (!installed || compareVersions(current, installed.version) > 0) {
      return {
        isAvailable: true,
        currentVersion: installed?.version || '0.0.0',
        latestVersion: current,
        canUpdate: true
      };
    }
  } catch {
    // ignore fallback errors
  }
  return manual;
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
  // Fallback path: trigger SW update and record current version
  const current = await getCurrentVersion();
  await triggerSkipWaiting();
  setInstalledVersion({ version: current, installDate: new Date().toISOString() });
  onProgress?.({ stage: 'complete', message: `Updated to ${current}`, progress: 100 });
  return true;
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

// Try to nudge the service worker to activate the latest
const triggerSkipWaiting = async () => {
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (!reg) return;
    if (reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      return;
    }
    // If no waiting worker, ask for an update
    await reg.update();
  } catch {
    // no-op
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
