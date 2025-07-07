
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

  // Load initial settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedGithubOwner = await SettingsStorage.getStorageValue('githubOwner', true) || '';
        const savedGithubRepo = await SettingsStorage.getStorageValue('githubRepo', true) || '';
        
        setGithubOwner(savedGithubOwner);
        setGithubRepo(savedGithubRepo);
      } catch (error) {
        console.warn('Failed to load GitHub settings:', error);
      }
    };
    
    loadSettings();
  }, []);

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
    // Always allow empty string for clearing
    if (owner === '') {
      setGithubOwner(owner);
      return;
    }
    
    // Validate non-empty input
    const validation = InputValidator.validateGithubUsername(owner);
    if (validation.isValid) {
      setGithubOwner(owner);
    } else {
      console.warn('Invalid GitHub owner:', validation.error);
      // Still set the value to allow user to see their input and correct it
      setGithubOwner(owner);
    }
  };

  /**
   * Enhanced GitHub repo setter with input validation
   */
  const setValidatedGithubRepo = (repo: string) => {
    // Always allow empty string for clearing
    if (repo === '') {
      setGithubRepo(repo);
      return;
    }
    
    // Validate non-empty input
    const validation = InputValidator.validateGithubRepoName(repo);
    if (validation.isValid) {
      setGithubRepo(repo);
    } else {
      console.warn('Invalid GitHub repo:', validation.error);
      // Still set the value to allow user to see their input and correct it
      setGithubRepo(repo);
    }
  };

  return {
    githubOwner,
    setGithubOwner: setValidatedGithubOwner,
    githubRepo,
    setGithubRepo: setValidatedGithubRepo,
  };
};
