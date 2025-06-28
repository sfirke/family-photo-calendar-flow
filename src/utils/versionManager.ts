// Read version from version.json instead of package.json for consistency
export const getCurrentVersion = async () => {
  try {
    const response = await fetch('/version.json');
    if (response.ok) {
      const versionInfo = await response.json();
      return versionInfo.version || '1.0.0';
    }
  } catch (error) {
    console.warn('Could not fetch version from version.json:', error);
  }
  
  // Fallback version
  return '1.0.0';
};

export const getVersionInfo = async () => {
  try {
    const response = await fetch('/version.json');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Could not fetch version info:', error);
  }

  // Fallback to basic version info
  return {
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    gitHash: 'unknown',
    buildNumber: 1,
    environment: 'development'
  };
};

const VERSION_KEY = 'app_version';
const LAST_CHECK_KEY = 'last_update_check';

export const getStoredVersion = () => {
  return localStorage.getItem(VERSION_KEY);
};

export const setStoredVersion = (version: string) => {
  localStorage.setItem(VERSION_KEY, version);
};

export const isNewVersion = () => {
  const storedVersion = getStoredVersion();
  const currentVersion = await getCurrentVersion();
  return !storedVersion || storedVersion !== currentVersion;
};

export const getLastCheckTime = () => {
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
  return lastCheck ? new Date(lastCheck) : null;
};

export const setLastCheckTime = () => {
  localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
};

export const shouldCheckForUpdates = () => {
  const lastCheck = getLastCheckTime();
  if (!lastCheck) return true;
  
  // Check for updates every 30 minutes
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  return lastCheck < thirtyMinutesAgo;
};

// Semantic version comparison
export const compareVersions = (version1: string, version2: string): number => {
  const v1parts = version1.split('.').map(Number);
  const v2parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part > v2part) return 1;
    if (v1part < v2part) return -1;
  }
  
  return 0;
};

export const getVersionType = (oldVersion: string, newVersion: string): 'major' | 'minor' | 'patch' => {
  const oldParts = oldVersion.split('.').map(Number);
  const newParts = newVersion.split('.').map(Number);
  
  if (newParts[0] > oldParts[0]) return 'major';
  if (newParts[1] > oldParts[1]) return 'minor';
  return 'patch';
};
