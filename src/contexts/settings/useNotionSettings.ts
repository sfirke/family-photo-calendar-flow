
import { useState } from 'react';
import { getStorageValue, saveStorageValue } from './settingsStorage';

const NOTION_TOKEN_KEY = 'notion_token';
const NOTION_DATABASE_ID_KEY = 'notion_database_id';

export const useNotionSettings = () => {
  const [notionToken, setNotionTokenState] = useState<string>('');
  const [notionDatabaseId, setNotionDatabaseIdState] = useState<string>('');

  const setNotionToken = (token: string) => {
    setNotionTokenState(token);
    saveStorageValue(NOTION_TOKEN_KEY, token, true); // true for sensitive data
  };

  const setNotionDatabaseId = (databaseId: string) => {
    setNotionDatabaseIdState(databaseId);
    saveStorageValue(NOTION_DATABASE_ID_KEY, databaseId, true); // true for sensitive data
  };

  // Initialize from storage
  const initializeNotionSettings = async () => {
    const savedToken = await getStorageValue(NOTION_TOKEN_KEY, true);
    const savedDatabaseId = await getStorageValue(NOTION_DATABASE_ID_KEY, true);
    
    if (savedToken) {
      setNotionTokenState(savedToken);
    }
    if (savedDatabaseId) {
      setNotionDatabaseIdState(savedDatabaseId);
    }
  };

  return {
    notionToken,
    setNotionToken,
    notionDatabaseId,
    setNotionDatabaseId,
    initializeNotionSettings
  };
};
