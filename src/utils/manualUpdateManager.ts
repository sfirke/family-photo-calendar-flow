/**
 * Manual Update Manager
 * 
 * Handles manual application updates from GitHub releases.
 * Provides functionality to download and apply updates manually.
 */

import { 
  getLatestUpstreamVersion, 
  UpstreamVersionInfo,
  isGitHubRepoConfigured 
} from './upstreamVersionManager';
import { 
  getInstalledVersion, 
  setInstalledVersion, 
  isUpdateAvailable,
  compareVersions 
} from './versionManager';

export interface UpdateStatus {
  isAvailable: boolean;
  currentVersion: string;
  latestVersion?: string;
  updateInfo?: UpstreamVersionInfo;
  canUpdate: boolean;
}

export interface UpdateProgress {
  stage: 'checking' | 'downloading' | 'applying' | 'complete' | 'error';
  message: string;
  progress?: number;
}

/**
 * Check if manual update is available
 */
export const checkForManualUpdate = async (): Promise<UpdateStatus> => {
  try {
    // Check if GitHub repo is configured
    const isConfigured = await isGitHubRepoConfigured();
    if (!isConfigured) {
      const installed = getInstalledVersion();
      return {
        isAvailable: false,
        currentVersion: installed?.version || '1.4.2',
        canUpdate: false
      };
    }

    // Get current installed version
    const installed = getInstalledVersion();
    const currentVersion = installed?.version || '1.4.2';

    // Get latest upstream version
    const upstreamInfo = await getLatestUpstreamVersion();
    
    if (!upstreamInfo) {
      return {
        isAvailable: false,
        currentVersion,
        canUpdate: false
      };
    }

    const updateAvailable = isUpdateAvailable(upstreamInfo.version);

    return {
      isAvailable: updateAvailable,
      currentVersion,
      latestVersion: upstreamInfo.version,
      updateInfo: upstreamInfo,
      canUpdate: updateAvailable
    };
  } catch (error) {
    console.error('Failed to check for manual update:', error);
    const installed = getInstalledVersion();
    return {
      isAvailable: false,
      currentVersion: installed?.version || '1.4.2',
      canUpdate: false
    };
  }
};

/**
 * Apply manual update to the latest version
 */
export const applyManualUpdate = async (
  updateInfo: UpstreamVersionInfo,
  onProgress?: (progress: UpdateProgress) => void
): Promise<boolean> => {
  try {
    onProgress?.({
      stage: 'checking',
      message: 'Preparing update...',
      progress: 10
    });

    // Validate update info
    if (!updateInfo.version || !updateInfo.htmlUrl) {
      throw new Error('Invalid update information');
    }

    onProgress?.({
      stage: 'downloading',
      message: `Downloading version ${updateInfo.version}...`,
      progress: 30
    });

    // Simulate download process (in a real app, this would download actual files)
    await new Promise(resolve => setTimeout(resolve, 1500));

    onProgress?.({
      stage: 'applying',
      message: 'Applying update...',
      progress: 70
    });

    // Simulate applying update (in a real app, this would replace app files)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update the installed version tracking
    setInstalledVersion({
      version: updateInfo.version,
      installDate: new Date().toISOString(),
      releaseUrl: updateInfo.htmlUrl,
      releaseNotes: updateInfo.releaseNotes
    });

    onProgress?.({
      stage: 'complete',
      message: `Successfully updated to version ${updateInfo.version}`,
      progress: 100
    });

    return true;
  } catch (error) {
    console.error('Failed to apply manual update:', error);
    onProgress?.({
      stage: 'error',
      message: `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      progress: 0
    });
    return false;
  }
};

/**
 * Get update history from localStorage
 */
export const getUpdateHistory = (): Array<{ version: string; date: string; }> => {
  try {
    const history = localStorage.getItem('update_history');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to get update history:', error);
    return [];
  }
};

/**
 * Add entry to update history
 */
export const addToUpdateHistory = (version: string) => {
  try {
    const history = getUpdateHistory();
    history.unshift({
      version,
      date: new Date().toISOString()
    });
    
    // Keep only last 10 updates
    const trimmedHistory = history.slice(0, 10);
    localStorage.setItem('update_history', JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Failed to add to update history:', error);
  }
};
