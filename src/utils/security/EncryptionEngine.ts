
/**
 * Core Encryption Engine
 * 
 * Low-level encryption operations using Web Crypto API
 */

export class EncryptionEngine {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  private static readonly ITERATIONS = 100000;

  static isCryptoAvailable(): boolean {
    return typeof crypto !== 'undefined' && 
           crypto.subtle !== undefined && 
           typeof crypto.subtle.importKey === 'function';
  }

  static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    if (!this.isCryptoAvailable()) {
      throw new Error('Web Crypto API not available');
    }

    const encoder = new TextEncoder();
    
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(data: string, key: CryptoKey): Promise<string> {
    if (!this.isCryptoAvailable()) {
      throw new Error('Web Crypto API not available');
    }

    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv: iv },
      key,
      encoder.encode(data)
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  static async decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
    if (!this.isCryptoAvailable()) {
      throw new Error('Web Crypto API not available');
    }

    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = combined.slice(0, this.IV_LENGTH);
      const data = combined.slice(this.IV_LENGTH);

      const decrypted = await crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv: iv },
        key,
        data
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
  }

  static generateSalt(): Uint8Array {
    if (!this.isCryptoAvailable()) {
      const salt = new Uint8Array(16);
      for (let i = 0; i < salt.length; i++) {
        salt[i] = Math.floor(Math.random() * 256);
      }
      return salt;
    }
    return crypto.getRandomValues(new Uint8Array(16));
  }
}
