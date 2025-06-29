
import React, { createContext, useContext, useState, useEffect } from 'react';
import { SecureStorage } from '@/utils/security/secureStorage';

interface SecurityContextType {
  isSecurityEnabled: boolean;
  isInitialized: boolean;
  enableSecurity: (password: string) => Promise<boolean>;
  disableSecurity: () => void;
  getSecurityStatus: () => string;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize security on app load
    const initSecurity = async () => {
      const hasSecuritySalt = localStorage.getItem('security_salt') !== null;
      
      if (hasSecuritySalt) {
        // Security was previously enabled, but we need password to initialize
        setIsSecurityEnabled(false);
      } else {
        // Initialize in non-encrypted mode
        await SecureStorage.initialize();
      }
      
      setIsInitialized(true);
    };

    initSecurity();
  }, []);

  const enableSecurity = async (password: string): Promise<boolean> => {
    if (!password || password.length < 8) {
      return false;
    }

    const success = await SecureStorage.initialize(password);
    if (success) {
      setIsSecurityEnabled(SecureStorage.isEncryptionEnabled());
      return true;
    }
    
    return false;
  };

  const disableSecurity = () => {
    SecureStorage.clear();
    SecureStorage.initialize(); // Reinitialize in non-encrypted mode
    setIsSecurityEnabled(false);
  };

  const getSecurityStatus = (): string => {
    if (!isInitialized) {
      return 'Initializing...';
    }
    
    if (isSecurityEnabled) {
      return 'Security Enabled - Data encrypted';
    }
    
    const hasSecuritySalt = localStorage.getItem('security_salt') !== null;
    if (hasSecuritySalt) {
      return 'Security Available - Enter password to unlock';
    }
    
    return 'Security Disabled - Data stored in plain text';
  };

  return (
    <SecurityContext.Provider
      value={{
        isSecurityEnabled,
        isInitialized,
        enableSecurity,
        disableSecurity,
        getSecurityStatus,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
