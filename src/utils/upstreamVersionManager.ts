
// Configuration - Update this with your actual GitHub repository
const GITHUB_REPO = {
  owner: 'cardner', // Replace with actual GitHub username/organization
  repo: 'family-photo-calendar-flow'   // Replace with actual repository name
};

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

export const fetchGitHubReleases = async (): Promise<GitHubRelease | null> => {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${GITHUB_REPO.owner}/${GITHUB_REPO.repo}/releases/latest`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Family-Calendar-App'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('No GitHub releases found for this repository');
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
