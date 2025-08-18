import React, { useState, useEffect, useCallback } from 'react';
import { secureStorage } from '@/utils/security/secureStorage';
import { SecurityContext } from './SecurityContext';

/**
 * SecurityProvider - handles client-side encryption lifecycle
 */
export const SecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasLockedData, setHasLockedData] = useState(false);

  const checkForLockedData = useCallback(async () => {
    const hasSecuritySalt = localStorage.getItem('security_salt') !== null;
    if (!hasSecuritySalt) {
      setHasLockedData(false);
      return;
    }
    const encryptedKeys = ['secure_zipCode_encrypted', 'secure_weatherApiKey_encrypted', 'secure_publicAlbumUrl_encrypted'];
    const hasEncryptedData = encryptedKeys.some(key => localStorage.getItem(key) === 'true');
    const isLocked = hasEncryptedData && !isSecurityEnabled;
    setHasLockedData(isLocked);
  }, [isSecurityEnabled]);

  useEffect(() => {
    const initSecurity = async () => {
      const hasSecuritySalt = localStorage.getItem('security_salt') !== null;
      if (hasSecuritySalt) {
        setIsSecurityEnabled(false);
        await checkForLockedData();
      } else {
        setHasLockedData(false);
      }
      setIsInitialized(true);
    };
    initSecurity();
  }, [checkForLockedData]);

  useEffect(() => {
    checkForLockedData();
  }, [isSecurityEnabled, checkForLockedData]);

  const enableSecurity = async (password: string): Promise<boolean> => {
    if (!password || password.length < 8) return false;
    try {
      await secureStorage.store('test', 'test', password);
      setIsSecurityEnabled(true);
      setHasLockedData(false);
      return true;
    } catch (error) {
      console.error('Failed to enable security:', error);
      return false;
    }
  };

  const disableSecurity = () => {
    secureStorage.clear();
    setIsSecurityEnabled(false);
    setHasLockedData(false);
  };

  const getSecurityStatus = (): string => {
    if (!isInitialized) return 'Initializing...';
    if (isSecurityEnabled) return 'Security Enabled - Data encrypted';
    if (hasLockedData) return 'Security Locked - Enter password to unlock encrypted data';
    const hasSecuritySalt = localStorage.getItem('security_salt') !== null;
    if (hasSecuritySalt) return 'Security Available - Enter password to unlock';
    return 'Security Disabled - Data stored in plain text';
  };

  const isDataAvailable = async (key: string): Promise<boolean> => {
    try {
      const secureData = await secureStorage.retrieve(key, 'test');
      const plainData = localStorage.getItem(key);
      return secureData !== null || plainData !== null;
    } catch {
      return localStorage.getItem(key) !== null;
    }
  };

  return (
    <SecurityContext.Provider value={{
      isSecurityEnabled,
      isInitialized,
      hasLockedData,
      enableSecurity,
      disableSecurity,
      getSecurityStatus,
      isDataAvailable
    }}>
      {children}
    </SecurityContext.Provider>
  );
};
