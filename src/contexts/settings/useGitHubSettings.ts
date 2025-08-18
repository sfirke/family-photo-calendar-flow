
/**
 * GitHub Settings Hook
 * 
 * Manages GitHub repository settings using tiered storage with validation.
 */

import { useState, useEffect } from 'react';
import { InputValidator } from '@/utils/security/inputValidation';
import { settingsStorageService } from '@/services/settingsStorageService';

export const useGitHubSettings = () => {
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial settings from tiered storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedGithubOwner = await settingsStorageService.getValue('githubOwner') || '';
        const savedGithubRepo = await settingsStorageService.getValue('githubRepo') || '';
        
        setGithubOwner(savedGithubOwner);
        setGithubRepo(savedGithubRepo);
      } catch (error) {
        console.warn('Failed to load GitHub settings from tiered storage:', error);
        // Fallback to localStorage for compatibility
        try {
          if (typeof localStorage !== 'undefined') {
            const fallbackOwner = localStorage.getItem('githubOwner') || '';
            const fallbackRepo = localStorage.getItem('githubRepo') || '';
            setGithubOwner(fallbackOwner);
            setGithubRepo(fallbackRepo);
          }
        } catch (fallbackError) {
          console.warn('Failed to load GitHub settings from fallback:', fallbackError);
        }
      } finally {
        setIsInitialized(true);
      }
    };
    
    loadSettings();
  }, []);

  // Auto-save GitHub owner to tiered storage (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    settingsStorageService.setValue('githubOwner', githubOwner).catch(error => {
      console.warn('Failed to save githubOwner to tiered storage:', error);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('githubOwner', githubOwner);
      }
    });
  }, [githubOwner, isInitialized]);

  // Auto-save GitHub repo to tiered storage (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    settingsStorageService.setValue('githubRepo', githubRepo).catch(error => {
      console.warn('Failed to save githubRepo to tiered storage:', error);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('githubRepo', githubRepo);
      }
    });
  }, [githubRepo, isInitialized]);

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
