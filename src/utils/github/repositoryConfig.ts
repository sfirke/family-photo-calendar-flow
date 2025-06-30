
/**
 * Repository Configuration Module
 * 
 * Manages GitHub repository configuration with secure storage.
 */

import { secureStorage } from '@/utils/security/secureStorage';
import { GitHubRepo } from './gitHubApi';

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
      owner = await secureStorage.retrieve('githubOwner', 'defaultPassword');
      repo = await secureStorage.retrieve('githubRepo', 'defaultPassword');
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
