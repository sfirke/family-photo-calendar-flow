
/**
 * GitHub API Module
 * 
 * Pure GitHub API interactions for fetching repository releases.
 */

const GITHUB_API_BASE = 'https://api.github.com';

export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
}

export interface GitHubRepo {
  owner: string;
  repo: string;
}

/**
 * Fetch latest release from GitHub repository
 */
export const fetchLatestRelease = async (repo: GitHubRepo): Promise<GitHubRelease | null> => {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.repo}/releases/latest`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Family-Calendar-App'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`No GitHub releases found for repository ${repo.owner}/${repo.repo}`);
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

/**
 * Validate GitHub repository by checking if it exists and has releases
 */
export const validateRepository = async (repo: GitHubRepo): Promise<boolean> => {
  const release = await fetchLatestRelease(repo);
  return release !== null;
};
