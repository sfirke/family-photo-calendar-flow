
const APP_VERSION = '1.0.0'; // This should be updated with each release
const VERSION_KEY = 'app_version';
const LAST_CHECK_KEY = 'last_update_check';

export const getCurrentVersion = () => APP_VERSION;

export const getStoredVersion = () => {
  return localStorage.getItem(VERSION_KEY);
};

export const setStoredVersion = (version: string) => {
  localStorage.setItem(VERSION_KEY, version);
};

export const isNewVersion = () => {
  const storedVersion = getStoredVersion();
  return !storedVersion || storedVersion !== APP_VERSION;
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
