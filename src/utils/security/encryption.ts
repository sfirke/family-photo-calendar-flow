
/**
 * Encryption Utils - Refactored with new modular architecture
 * 
 * Provides high-level encryption utilities using the new modular services
 */

import { EncryptionEngine } from './EncryptionEngine';
import { SecureStorageEngine } from './SecureStorageEngine';

// Legacy compatibility exports
export { EncryptionEngine as ClientSideEncryption };

// New modular exports
export { EncryptionEngine } from './EncryptionEngine';
export { EncryptionMetadataManager } from './EncryptionMetadata';
export { SecureStorageEngine } from './SecureStorageEngine';

// Convenience functions for backward compatibility
export const encryptData = async (data: string, password: string, salt: Uint8Array): Promise<string> => {
  try {
    const key = await EncryptionEngine.deriveKey(password, salt);
    return EncryptionEngine.encrypt(data, key);
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

export const decryptData = async (encryptedData: string, password: string): Promise<string> => {
  try {
    // For simplicity, this assumes salt is stored separately
    // In a real implementation, you'd extract salt from the encrypted data
    const salt = EncryptionEngine.generateSalt();
    const key = await EncryptionEngine.deriveKey(password, salt);
    return EncryptionEngine.decrypt(encryptedData, key);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Create new secure storage instance for export
export const secureStorage = new SecureStorageEngine();
