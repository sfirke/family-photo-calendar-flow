
import { useState } from 'react';
import { getStorageValue, saveStorageValue } from './settingsStorage';

const NOTION_TOKEN_KEY = 'notion_token';

export const useNotionSettings = () => {
  const [notionToken, setNotionTokenState] = useState<string>('');

  const setNotionToken = (token: string) => {
    setNotionTokenState(token);
    saveStorageValue(NOTION_TOKEN_KEY, token, true); // true for sensitive data
  };

  // Initialize from storage
  const initializeNotionSettings = async () => {
    const savedToken = await getStorageValue(NOTION_TOKEN_KEY, true);
    if (savedToken) {
      setNotionTokenState(savedToken);
    }
  };

  return {
    notionToken,
    setNotionToken,
    initializeNotionSettings
  };
};
