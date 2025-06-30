
/**
 * GitHub Settings Hook
 * 
 * Manages GitHub repository settings with secure storage and validation.
 */

import { useState, useEffect } from 'react';
import { InputValidator } from '@/utils/security/inputValidation';
import { SettingsStorage } from './settingsStorage';

export const useGitHubSettings = () => {
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');

  // Auto-save GitHub owner to appropriate storage
  useEffect(() => {
    SettingsStorage.saveSetting('githubOwner', githubOwner, true);
  }, [githubOwner]);

  // Auto-save GitHub repo to appropriate storage
  useEffect(() => {
    SettingsStorage.saveSetting('githubRepo', githubRepo, true);
  }, [githubRepo]);

  /**
   * Enhanced GitHub owner setter with input validation
   */
  const setValidatedGithubOwner = (owner: string) => {
    if (owner === '') {
      setGithubOwner(owner);
      return;
    }
    
    const validation = InputValidator.validateGithubUsername(owner);
    if (validation.isValid) {
      setGithubOwner(owner);
    } else {
      console.warn('Invalid GitHub owner:', validation.error);
    }
  };

  /**
   * Enhanced GitHub repo setter with input validation
   */
  const setValidatedGithubRepo = (repo: string) => {
    if (repo === '') {
      setGithubRepo(repo);
      return;
    }
    
    const validation = InputValidator.validateGithubRepoName(repo);
    if (validation.isValid) {
      setGithubRepo(repo);
    } else {
      console.warn('Invalid GitHub repo:', validation.error);
    }
  };

  return {
    githubOwner,
    setGithubOwner: setValidatedGithubOwner,
    githubRepo,
    setGithubRepo: setValidatedGithubRepo,
  };
};
