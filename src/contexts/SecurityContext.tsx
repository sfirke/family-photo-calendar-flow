
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SecureStorage } from '@/utils/security/secureStorage';

interface SecurityContextType {
  /** Whether encryption is currently active and data is accessible */
  isSecurityEnabled: boolean;
  /** Whether the security system has been initialized */
  isInitialized: boolean;
  /** Enable security with user password - returns success status */
  enableSecurity: (password: string) => Promise<boolean>;
  /** Disable security and convert all data to plain text */
  disableSecurity: () => void;
  /** Get human-readable security status for UI display */
  getSecurityStatus: () => string;
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
      } else {
        // Initialize in non-encrypted mode for new users
        await SecureStorage.initialize();
      }
      
      setIsInitialized(true);
    };

    initSecurity();
  }, []);

  /**
   * Enable security with user password
   * 
   * @param password - User's security password (min 8 characters)
   * @returns Promise<boolean> - Success status of encryption setup
   */
  const enableSecurity = async (password: string): Promise<boolean> => {
    // Validate password requirements
    if (!password || password.length < 8) {
      return false;
    }

    // Initialize secure storage with password
    const success = await SecureStorage.initialize(password);
    if (success) {
      // Update context state to reflect active encryption
      setIsSecurityEnabled(SecureStorage.isEncryptionEnabled());
      return true;
    }
    
    return false;
  };

  /**
   * Disable security and clear all encrypted data
   * 
   * Converts all encrypted data back to plain text storage
   * and removes encryption keys and salts from localStorage.
   */
  const disableSecurity = () => {
    // Clear all secure storage and reset to plain text
    SecureStorage.clear();
    SecureStorage.initialize(); // Reinitialize in non-encrypted mode
    setIsSecurityEnabled(false);
  };

  /**
   * Get human-readable security status
   * 
   * Provides status text for UI display, accounting for different
   * security states (initializing, enabled, available, disabled).
   * 
   * @returns string - Status description for user interface
   */
  const getSecurityStatus = (): string => {
    if (!isInitialized) {
      return 'Initializing...';
    }
    
    if (isSecurityEnabled) {
      return 'Security Enabled - Data encrypted';
    }
    
    // Check if security was previously set up but is locked
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
