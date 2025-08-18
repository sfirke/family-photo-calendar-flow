
/**
 * Notion Settings Hook
 * 
 * Manages Notion integration settings using tiered storage with secure handling.
 */

import { useState, useEffect } from 'react';
import { settingsStorageService } from '@/services/settingsStorageService';
import { safeLocalStorage } from '@/utils/storage/safeLocalStorage';

const NOTION_TOKEN_KEY = 'notion_token';
const NOTION_DATABASE_ID_KEY = 'notion_database_id';

export const useNotionSettings = () => {
  const [notionToken, setNotionTokenState] = useState<string>('');
  const [notionDatabaseId, setNotionDatabaseIdState] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial settings from tiered storage
  useEffect(() => {
    // If running in a non-browser environment (e.g. SSR or after jsdom teardown), skip async work
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      setIsInitialized(true);
      return;
    }

    let cancelled = false;
    const loadSettings = async () => {
      try {
        const savedToken = await settingsStorageService.getValue(NOTION_TOKEN_KEY) || '';
        const savedDatabaseId = await settingsStorageService.getValue(NOTION_DATABASE_ID_KEY) || '';
        if (!cancelled) {
          setNotionTokenState(savedToken);
          setNotionDatabaseIdState(savedDatabaseId);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to load Notion settings from tiered storage:', error);
          // Fallback to localStorage for compatibility
          try {
            const fallbackToken = safeLocalStorage.getItem(NOTION_TOKEN_KEY) || '';
            const fallbackDatabaseId = safeLocalStorage.getItem(NOTION_DATABASE_ID_KEY) || '';
            if (!cancelled) {
              setNotionTokenState(fallbackToken);
              setNotionDatabaseIdState(fallbackDatabaseId);
            }
          } catch (fallbackError) {
            console.warn('Failed to load Notion settings from fallback:', fallbackError);
          }
        }
      } finally {
        if (!cancelled) setIsInitialized(true);
      }
    };

    loadSettings();
    return () => { cancelled = true; };
  }, []);

  const setNotionToken = async (token: string) => {
    setNotionTokenState(token);
    try {
      await settingsStorageService.setValue(NOTION_TOKEN_KEY, token);
    } catch (error) {
      console.warn('Failed to save notionToken to tiered storage:', error);
      // Fallback to localStorage
  safeLocalStorage.setItem(NOTION_TOKEN_KEY, token);
    }
  };

  const setNotionDatabaseId = async (databaseId: string) => {
    setNotionDatabaseIdState(databaseId);
    try {
      await settingsStorageService.setValue(NOTION_DATABASE_ID_KEY, databaseId);
    } catch (error) {
      console.warn('Failed to save notionDatabaseId to tiered storage:', error);
      // Fallback to localStorage
  safeLocalStorage.setItem(NOTION_DATABASE_ID_KEY, databaseId);
    }
  };

  // Legacy initialization method for backwards compatibility
  const initializeNotionSettings = async () => {
    // This is now handled by the useEffect above, but kept for API compatibility
  // debug removed: initializeNotionSettings invoked
  };

  return {
    notionToken,
    setNotionToken,
    notionDatabaseId,
    setNotionDatabaseId,
    initializeNotionSettings
  };
};
