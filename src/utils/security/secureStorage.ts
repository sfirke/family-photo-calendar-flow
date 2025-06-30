
import { encryptData, decryptData } from './encryption';

interface SecureStorageItem {
  data: string;
  timestamp: number;
  version: string;
}

class SecureStorage {
  private isSupported(): boolean {
    try {
      return typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  async store(key: string, value: string, password: string): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('LocalStorage is not supported');
    }

    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));  // Fixed: removed duplicate const
      const encryptedData = await encryptData(value, password, salt);
      
      const storageItem: SecureStorageItem = {
        data: encryptedData,
        timestamp: Date.now(),
        version: '1.0'
      };

      localStorage.setItem(key, JSON.stringify(storageItem));
    } catch (error) {
      console.error('Failed to store encrypted data:', error);
      throw new Error('Failed to store data securely');
    }
  }

  async retrieve(key: string, password: string): Promise<string | null> {
    if (!this.isSupported()) {
      return null;
    }

    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const storageItem: SecureStorageItem = JSON.parse(stored);
      return await decryptData(storageItem.data, password);
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error);
      return null;
    }
  }

  remove(key: string): void {
    if (!this.isSupported()) return;
    localStorage.removeItem(key);
  }

  clear(): void {
    if (!this.isSupported()) return;
    
    const keys = Object.keys(localStorage);
    const secureKeys = keys.filter(key => key.startsWith('secure_'));
    
    secureKeys.forEach(key => localStorage.removeItem(key));
  }

  exists(key: string): boolean {
    if (!this.isSupported()) return false;
    return localStorage.getItem(key) !== null;
  }
}

export const secureStorage = new SecureStorage();
