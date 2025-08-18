import React, { createContext, useContext } from 'react';

export interface SecurityContextType {
  isSecurityEnabled: boolean;
  isInitialized: boolean;
  hasLockedData: boolean;
  enableSecurity: (password: string) => Promise<boolean>;
  disableSecurity: () => void;
  getSecurityStatus: () => string;
  isDataAvailable: (key: string) => Promise<boolean>;
}

export const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
