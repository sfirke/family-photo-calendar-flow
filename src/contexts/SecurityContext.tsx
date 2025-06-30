/**
 * SecurityContext - Client-Side Encryption Management
 * 
 * Provides centralized security management for the Family Calendar application.
 * Implements AES-256 encryption for sensitive user data including:
 * - API keys (weather, calendar feeds)
 * - Personal information (zip codes, album URLs)
 * 
 * Security Features:
 * - Password-based key derivation using PBKDF2
 * - Salt-based encryption to prevent rainbow table attacks
 * - Session-based unlocking (password not stored)
 * - Graceful fallback to unencrypted storage
 * 
 * Architecture:
 * - Uses Web Crypto API for cryptographic operations
 * - Stores encrypted data in localStorage
 * - Maintains encryption state across app sessions
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { secureStorage } from '@/utils/security/secureStorage';

interface SecurityContextType {
  /** Whether encryption is currently active and data is accessible */
  isSecurityEnabled: boolean;
  /** Whether the security system has been initialized */
  isInitialized: boolean;
  /** Whether encrypted data exists but is currently locked */
  hasLockedData: boolean;
  /** Enable security with user password - returns success status */
  enableSecurity: (password: string) => Promise<boolean>;
  /** Disable security and convert all data to plain text */
  disableSecurity: () => void;
  /** Get human-readable security status for UI display */
  getSecurityStatus: () => string;
  /** Check if specific data is available (encrypted or plain) */
  isDataAvailable: (key: string) => Promise<boolean>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

/**
 * Security Provider Component
 * 
 * Manages the global security state and provides encryption services
 * to the entire application. Automatically initializes on app startup.
 */
export const SecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasLockedData, setHasLockedData] = useState(false);

  /**
   * Check if encrypted data exists but is locked
   */
  const checkForLockedData = useCallback(async () => {
    const hasSecuritySalt = localStorage.getItem('security_salt') !== null;
    console.log('checkForLockedData - hasSecuritySalt:', hasSecuritySalt, 'isSecurityEnabled:', isSecurityEnabled);
    
    if (!hasSecuritySalt) {
      setHasLockedData(false);
      return;
    }

    // Check for encrypted data markers
    const encryptedKeys = ['secure_zipCode_encrypted', 'secure_weatherApiKey_encrypted', 'secure_publicAlbumUrl_encrypted'];
    const hasEncryptedData = encryptedKeys.some(key => localStorage.getItem(key) === 'true');
    
    // Data is locked if there's encrypted data but security is not enabled
    const isLocked = hasEncryptedData && !isSecurityEnabled;
    console.log('checkForLockedData - hasEncryptedData:', hasEncryptedData, 'isLocked:', isLocked);
    
    setHasLockedData(isLocked);
  }, [isSecurityEnabled]);

  /**
   * Initialize security system on application startup
   * 
   * Determines if security was previously enabled and sets up
   * the appropriate initial state. Does not require password
   * until user attempts to access encrypted data.
   */
  useEffect(() => {
    const initSecurity = async () => {
      const hasSecuritySalt = localStorage.getItem('security_salt') !== null;
      
      if (hasSecuritySalt) {
        // Security was previously enabled, but we need password to initialize
        // Set to false until user provides password
        setIsSecurityEnabled(false);
        await checkForLockedData();
      } else {
        // Initialize in non-encrypted mode for new users
        setHasLockedData(false);
      }
      
      setIsInitialized(true);
    };

    initSecurity();
  }, [checkForLockedData]);

  // Update locked data status when security state changes
  useEffect(() => {
    checkForLockedData();
  }, [isSecurityEnabled, checkForLockedData]);

  const enableSecurity = async (password: string): Promise<boolean> => {
    if (!password || password.length < 8) {
      return false;
    }

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
    if (!isInitialized) {
      return 'Initializing...';
    }
    
    if (isSecurityEnabled) {
      return 'Security Enabled - Data encrypted';
    }
    
    if (hasLockedData) {
      return 'Security Locked - Enter password to unlock encrypted data';
    }
    
    const hasSecuritySalt = localStorage.getItem('security_salt') !== null;
    if (hasSecuritySalt) {
      return 'Security Available - Enter password to unlock';
    }
    
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
    <SecurityContext.Provider
      value={{
        isSecurityEnabled,
        isInitialized,
        hasLockedData,
        enableSecurity,
        disableSecurity,
        getSecurityStatus,
        isDataAvailable,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

/**
 * Hook to access security context
 * 
 * Must be used within a SecurityProvider component.
 * Provides access to all security management functions.
 * 
 * @throws Error if used outside SecurityProvider
 */
export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
