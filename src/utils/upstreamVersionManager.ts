
import { SecureStorage } from '@/utils/security/secureStorage';

const GITHUB_API_BASE = 'https://api.github.com';
const UPSTREAM_VERSION_KEY = 'upstream_version_cache';
const LAST_UPSTREAM_CHECK_KEY = 'last_upstream_check';

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
}

interface UpstreamVersionInfo {
  version: string;
  name: string;
  releaseNotes: string;
  publishedAt: string;
  htmlUrl: string;
  fetchedAt: string;
}

interface GitHubRepo {
  owner: string;
  repo: string;
}

/**
 * Get GitHub repository configuration from settings
 * Returns null if no repository is configured
 */
export const getGitHubRepoConfig = async (): Promise<GitHubRepo | null> => {
  try {
    let owner: string | null = null;
    let repo: string | null = null;

    // Try to get from secure storage first
    try {
      owner = await SecureStorage.getItem('githubOwner');
      repo = await SecureStorage.getItem('githubRepo');
    } catch (error) {
      // Fallback to localStorage
      owner = localStorage.getItem('githubOwner');
      repo = localStorage.getItem('githubRepo');
    }

    // Both owner and repo must be configured
    if (!owner || !repo || owner.trim() === '' || repo.trim() === '') {
      return null;
    }

    return {
      owner: owner.trim(),
      repo: repo.trim()
    };
  } catch (error) {
    console.error('Failed to get GitHub repository configuration:', error);
    return null;
  }
};

export const fetchGitHubReleases = async (): Promise<GitHubRelease | null> => {
  const repoConfig = await getGitHubRepoConfig();
  
  if (!repoConfig) {
    console.warn('No GitHub repository configured for update checks');
    return null;
  }

  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${repoConfig.owner}/${repoConfig.repo}/releases/latest`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Family-Calendar-App'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`No GitHub releases found for repository ${repoConfig.owner}/${repoConfig.repo}`);
        return null;
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch GitHub releases:', error);
    return null;
  }
};

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

export const isUpstreamUpdateAvailable = async (currentVersion: string): Promise<boolean> => {
  const upstreamInfo = await getLatestUpstreamVersion();
  
  if (!upstreamInfo) {
    return false;
  }

  return compareWithUpstream(currentVersion, upstreamInfo.version) > 0;
};

export const cacheUpstreamVersion = (versionInfo: UpstreamVersionInfo): void => {
  localStorage.setItem(UPSTREAM_VERSION_KEY, JSON.stringify(versionInfo));
};

export const getCachedUpstreamVersion = (): UpstreamVersionInfo | null => {
  try {
    const cached = localStorage.getItem(UPSTREAM_VERSION_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Failed to parse cached upstream version:', error);
    return null;
  }
};

export const getLastUpstreamCheckTime = (): Date | null => {
  const lastCheck = localStorage.getItem(LAST_UPSTREAM_CHECK_KEY);
  return lastCheck ? new Date(lastCheck) : null;
};

export const setLastUpstreamCheckTime = (): void => {
  localStorage.setItem(LAST_UPSTREAM_CHECK_KEY, new Date().toISOString());
};

export const shouldCheckUpstream = (): boolean => {
  const lastCheck = getLastUpstreamCheckTime();
  if (!lastCheck) return true;
  
  // Check for upstream updates every hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return lastCheck < oneHourAgo;
};

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

/**
 * Check if GitHub repository is configured
 */
export const isGitHubRepoConfigured = async (): Promise<boolean> => {
  const repoConfig = await getGitHubRepoConfig();
  return repoConfig !== null;
};

/**
 * Get formatted repository string for display
 */
export const getRepositoryDisplayName = async (): Promise<string | null> => {
  const repoConfig = await getGitHubRepoConfig();
  return repoConfig ? `${repoConfig.owner}/${repoConfig.repo}` : null;
};
