
import { ClientSideEncryption } from './encryption';

export class SecureStorage {
  private static encryptionKey: CryptoKey | null = null;
  private static isInitialized = false;

  // Initialize secure storage with user password
  static async initialize(password?: string): Promise<boolean> {
    if (!password) {
      // Run in non-encrypted mode
      this.isInitialized = true;
      this.encryptionKey = null;
      return true;
    }

    try {
      let salt = localStorage.getItem('security_salt');
      let saltBytes: Uint8Array;

      if (!salt) {
        // First time setup - generate new salt
        saltBytes = ClientSideEncryption.generateSalt();
        localStorage.setItem('security_salt', ClientSideEncryption.saltToBase64(saltBytes));
      } else {
        saltBytes = ClientSideEncryption.saltFromBase64(salt);
      }

      this.encryptionKey = await ClientSideEncryption.deriveKey(password, saltBytes);
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize secure storage:', error);
      return false;
    }
  }

  // Check if encryption is enabled
  static isEncryptionEnabled(): boolean {
    return this.isInitialized && this.encryptionKey !== null;
  }

  // Securely store data
  static async setItem(key: string, value: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('SecureStorage not initialized');
    }

    const storageKey = `secure_${key}`;

    if (this.encryptionKey) {
      try {
        const encrypted = await ClientSideEncryption.encrypt(value, this.encryptionKey);
        localStorage.setItem(storageKey, encrypted);
        localStorage.setItem(`${storageKey}_encrypted`, 'true');
      } catch (error) {
        console.error('Encryption failed, storing unencrypted:', error);
        localStorage.setItem(storageKey, value);
        localStorage.removeItem(`${storageKey}_encrypted`);
      }
    } else {
      localStorage.setItem(storageKey, value);
      localStorage.removeItem(`${storageKey}_encrypted`);
    }
  }

  // Securely retrieve data
  static async getItem(key: string): Promise<string | null> {
    if (!this.isInitialized) {
      throw new Error('SecureStorage not initialized');
    }

    const storageKey = `secure_${key}`;
    const encrypted = localStorage.getItem(storageKey);
    
    if (!encrypted) {
      return null;
    }

    const isEncrypted = localStorage.getItem(`${storageKey}_encrypted`) === 'true';

    if (isEncrypted && this.encryptionKey) {
      try {
        return await ClientSideEncryption.decrypt(encrypted, this.encryptionKey);
      } catch (error) {
        console.error('Decryption failed:', error);
        return null;
      }
    }

    return encrypted;
  }

  // Remove secure item
  static removeItem(key: string): void {
    const storageKey = `secure_${key}`;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}_encrypted`);
  }

  // Clear all secure data
  static clear(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('secure_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    localStorage.removeItem('security_salt');
  }
}
