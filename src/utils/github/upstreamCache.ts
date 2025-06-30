
/**
 * Upstream Cache Module
 * 
 * Handles caching of upstream version information.
 */

import { UpstreamVersionInfo } from '../upstreamVersionManager';

const UPSTREAM_VERSION_KEY = 'upstream_version_cache';
const LAST_UPSTREAM_CHECK_KEY = 'last_upstream_check';

/**
 * Cache upstream version information
 */
export const cacheUpstreamVersion = (versionInfo: UpstreamVersionInfo): void => {
  localStorage.setItem(UPSTREAM_VERSION_KEY, JSON.stringify(versionInfo));
};

/**
 * Get cached upstream version information
 */
export const getCachedUpstreamVersion = (): UpstreamVersionInfo | null => {
  try {
    const cached = localStorage.getItem(UPSTREAM_VERSION_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Failed to parse cached upstream version:', error);
    return null;
  }
};

/**
 * Get last upstream check time
 */
export const getLastUpstreamCheckTime = (): Date | null => {
  const lastCheck = localStorage.getItem(LAST_UPSTREAM_CHECK_KEY);
  return lastCheck ? new Date(lastCheck) : null;
};

/**
 * Set last upstream check time
 */
export const setLastUpstreamCheckTime = (): void => {
  localStorage.setItem(LAST_UPSTREAM_CHECK_KEY, new Date().toISOString());
};

/**
 * Check if upstream should be checked (every hour)
 */
export const shouldCheckUpstream = (): boolean => {
  const lastCheck = getLastUpstreamCheckTime();
  if (!lastCheck) return true;
  
  // Check for upstream updates every hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return lastCheck < oneHourAgo;
};
