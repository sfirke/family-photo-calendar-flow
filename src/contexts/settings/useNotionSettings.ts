
import { useState, useCallback } from 'react';
import { SettingsStorage } from './settingsStorage';

export const useNotionSettings = () => {
  const [notionIntegrationToken, setNotionIntegrationTokenState] = useState<string>('');

  const setNotionIntegrationToken = useCallback(async (token: string) => {
    setNotionIntegrationTokenState(token);
    await SettingsStorage.saveSetting('notionIntegrationToken', token, true);
  }, []);

  return {
    notionIntegrationToken,
    setNotionIntegrationToken,
  };
};
