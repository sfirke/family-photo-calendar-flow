import { ClientSideEncryption } from './encryption';

export class SecureStorage {
  /** Current encryption key (exists only during active session) */
  private static encryptionKey: CryptoKey | null = null;
  /** Whether the storage system has been initialized */
  private static isInitialized = false;

  /**
   * Initialize secure storage system
   * 
   * @param password - Optional user password for encryption
   * @returns Promise<boolean> - Success status of initialization
   */
  static async initialize(password?: string): Promise<boolean> {
    if (!password) {
      // Run in non-encrypted mode - for new users or disabled security
      this.isInitialized = true;
      this.encryptionKey = null;
      return true;
    }

    try {
      let salt = localStorage.getItem('security_salt');
      let saltBytes: Uint8Array;

      if (!salt) {
        // First time setup - generate new random salt
        saltBytes = ClientSideEncryption.generateSalt();
        localStorage.setItem('security_salt', ClientSideEncryption.saltToBase64(saltBytes));
      } else {
        // Existing user - use stored salt
        saltBytes = ClientSideEncryption.saltFromBase64(salt);
      }

      // Derive encryption key from password and salt
      this.encryptionKey = await ClientSideEncryption.deriveKey(password, saltBytes);
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize secure storage:', error);
      return false;
    }
  }

  /**
   * Check if encryption is currently enabled
   * 
   * @returns boolean - True if data will be encrypted
   */
  static isEncryptionEnabled(): boolean {
    return this.isInitialized && this.encryptionKey !== null;
  }

  /**
   * Securely store data with automatic encryption
   * 
   * @param key - Storage key identifier
   * @param value - Data to store (will be encrypted if security enabled)
   */
  static async setItem(key: string, value: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('SecureStorage not initialized');
    }

    const storageKey = `secure_${key}`;

    if (this.encryptionKey) {
      try {
        // Encrypt the data using AES-256-GCM
        const encrypted = await ClientSideEncryption.encrypt(value, this.encryptionKey);
        localStorage.setItem(storageKey, encrypted);
        localStorage.setItem(`${storageKey}_encrypted`, 'true');
      } catch (error) {
        console.error('Encryption failed, storing unencrypted:', error);
        // Fallback to plain text if encryption fails
        localStorage.setItem(storageKey, value);
        localStorage.removeItem(`${storageKey}_encrypted`);
      }
    } else {
      // Store in plain text when encryption is disabled
      localStorage.setItem(storageKey, value);
      localStorage.removeItem(`${storageKey}_encrypted`);
    }
  }

  /**
   * Securely retrieve data with automatic decryption
   * 
   * @param key - Storage key identifier
   * @returns Promise<string | null> - Decrypted data or null if not found
   */
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
        // Decrypt the data using stored encryption key
        return await ClientSideEncryption.decrypt(encrypted, this.encryptionKey);
      } catch (error) {
        console.error('Decryption failed:', error);
        return null;
      }
    }

    // Return plain text data
    return encrypted;
  }

  /**
   * Remove secure item from storage
   * 
   * @param key - Storage key identifier
   */
  static removeItem(key: string): void {
    const storageKey = `secure_${key}`;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}_encrypted`);
  }

  /**
   * Clear all secure data and reset security
   * 
   * Removes all encrypted data, encryption metadata, and salt.
   * Used when disabling security or resetting the application.
   */
  static clear(): void {
    const keysToRemove: string[] = [];
    
    // Find all secure storage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('secure_')) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all secure data and metadata
    keysToRemove.forEach(key => localStorage.removeItem(key));
    localStorage.removeItem('security_salt');
  }
}
