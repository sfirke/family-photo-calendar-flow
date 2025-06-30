
/**
 * Upstream Version Manager - Refactored
 * 
 * Main orchestrator for upstream version management.
 * Now uses focused modules for different responsibilities.
 */

import { fetchLatestRelease, GitHubRelease, GitHubRepo } from './github/gitHubApi';
import { getGitHubRepoConfig, isGitHubRepoConfigured, getRepositoryDisplayName } from './github/repositoryConfig';
import { 
  cacheUpstreamVersion, 
  getCachedUpstreamVersion, 
  getLastUpstreamCheckTime, 
  setLastUpstreamCheckTime, 
  shouldCheckUpstream 
} from './github/upstreamCache';

export interface UpstreamVersionInfo {
  version: string;
  name: string;
  releaseNotes: string;
  publishedAt: string;
  htmlUrl: string;
  fetchedAt: string;
}

// Re-export for backward compatibility
export { getGitHubRepoConfig, isGitHubRepoConfigured, getRepositoryDisplayName };
export { getLastUpstreamCheckTime, setLastUpstreamCheckTime, shouldCheckUpstream };

/**
 * Fetch GitHub releases using configured repository
 */
export const fetchGitHubReleases = async (): Promise<GitHubRelease | null> => {
  const repoConfig = await getGitHubRepoConfig();
  
  if (!repoConfig) {
    console.warn('No GitHub repository configured for update checks');
    return null;
  }

  return await fetchLatestRelease(repoConfig);
};

/**
 * Get latest upstream version information
 */
export const getLatestUpstreamVersion = async (): Promise<UpstreamVersionInfo | null> => {
  const release = await fetchGitHubReleases();
  
  if (!release) {
    return null;
  }

  // Clean version string (remove 'v' prefix if present)
  const version = release.tag_name.replace(/^v/, '');

  return {
    version,
    name: release.name || `Version ${version}`,
    releaseNotes: release.body || 'No release notes available',
    publishedAt: release.published_at,
    htmlUrl: release.html_url,
    fetchedAt: new Date().toISOString()
  };
};

/**
 * Compare local version with upstream version
 */
export const compareWithUpstream = (localVersion: string, upstreamVersion: string): number => {
  const parseVersion = (version: string) => {
    return version.split('.').map(num => parseInt(num, 10));
  };

  const local = parseVersion(localVersion);
  const upstream = parseVersion(upstreamVersion);

  for (let i = 0; i < Math.max(local.length, upstream.length); i++) {
    const localPart = local[i] || 0;
    const upstreamPart = upstream[i] || 0;

    if (upstreamPart > localPart) return 1;  // Upstream is newer
    if (upstreamPart < localPart) return -1; // Local is newer
  }

  return 0; // Versions are equal
};

/**
 * Check if upstream update is available
 */
export const isUpstreamUpdateAvailable = async (currentVersion: string): Promise<boolean> => {
  const upstreamInfo = await getLatestUpstreamVersion();
  
  if (!upstreamInfo) {
    return false;
  }

  return compareWithUpstream(currentVersion, upstreamInfo.version) > 0;
};

/**
 * Get upstream release information with caching
 */
export const getUpstreamReleaseInfo = async (): Promise<UpstreamVersionInfo | null> => {
  // First try to get fresh data
  const freshInfo = await getLatestUpstreamVersion();
  
  if (freshInfo) {
    cacheUpstreamVersion(freshInfo);
    setLastUpstreamCheckTime();
    return freshInfo;
  }

  // Fallback to cached data
  return getCachedUpstreamVersion();
};
