
// Utility for encrypting sensitive data in localStorage
// This provides basic obfuscation, not military-grade encryption

export class DataEncryption {
  private static key = 'FamilyCalendarApp2024';

  // Simple XOR encryption for localStorage data
  static encrypt(data: string): string {
    try {
      let encrypted = '';
      for (let i = 0; i < data.length; i++) {
        encrypted += String.fromCharCode(
          data.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
        );
      }
      return btoa(encrypted); // Base64 encode
    } catch (error) {
      console.warn('Encryption failed, storing data as-is:', error);
      return data;
    }
  }

  static decrypt(encryptedData: string): string {
    try {
      const data = atob(encryptedData); // Base64 decode
      let decrypted = '';
      for (let i = 0; i < data.length; i++) {
        decrypted += String.fromCharCode(
          data.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
        );
      }
      return decrypted;
    } catch (error) {
      console.warn('Decryption failed, returning data as-is:', error);
      return encryptedData;
    }
  }

  // Secure localStorage wrapper
  static setSecureItem(key: string, value: string): void {
    try {
      const encrypted = this.encrypt(value);
      localStorage.setItem(`encrypted_${key}`, encrypted);
    } catch (error) {
      console.error('Failed to store encrypted data:', error);
      // Fallback to regular storage
      localStorage.setItem(key, value);
    }
  }

  static getSecureItem(key: string): string | null {
    try {
      const encrypted = localStorage.getItem(`encrypted_${key}`);
      if (encrypted) {
        return this.decrypt(encrypted);
      }
      // Fallback to regular storage for backward compatibility
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error);
      return localStorage.getItem(key);
    }
  }

  static removeSecureItem(key: string): void {
    localStorage.removeItem(`encrypted_${key}`);
    localStorage.removeItem(key); // Remove fallback too
  }

  // Data expiration utility
  static setExpiringItem(key: string, value: string, expirationMinutes: number): void {
    const expirationTime = Date.now() + (expirationMinutes * 60 * 1000);
    const dataWithExpiration = JSON.stringify({
      value,
      expires: expirationTime
    });
    this.setSecureItem(key, dataWithExpiration);
  }

  static getExpiringItem(key: string): string | null {
    try {
      const data = this.getSecureItem(key);
      if (!data) return null;

      const parsed = JSON.parse(data);
      if (parsed.expires && Date.now() > parsed.expires) {
        this.removeSecureItem(key);
        return null;
      }
      
      return parsed.value || data;
    } catch (error) {
      // If parsing fails, treat as regular data
      return this.getSecureItem(key);
    }
  }

  // Clean up expired items
  static cleanupExpiredItems(): void {
    const keysToCheck = Object.keys(localStorage).filter(key => 
      key.startsWith('encrypted_') || key.startsWith('family_calendar_')
    );

    keysToCheck.forEach(fullKey => {
      const key = fullKey.replace('encrypted_', '');
      try {
        const data = localStorage.getItem(fullKey);
        if (data) {
          const parsed = JSON.parse(this.decrypt(data));
          if (parsed.expires && Date.now() > parsed.expires) {
            localStorage.removeItem(fullKey);
            console.log(`Cleaned up expired data: ${key}`);
          }
        }
      } catch (error) {
        // Not encrypted/expiring data, skip
      }
    });
  }
}

// Run cleanup on app start
if (typeof window !== 'undefined') {
  DataEncryption.cleanupExpiredItems();
  
  // Set up periodic cleanup (every hour)
  setInterval(() => {
    DataEncryption.cleanupExpiredItems();
  }, 60 * 60 * 1000);
}
