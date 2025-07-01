
/**
 * Encryption Metadata Management
 * 
 * Handles encryption metadata including salt storage and version management
 */

export interface EncryptionMetadata {
  salt: string;
  version: string;
  algorithm: string;
  iterations: number;
  timestamp: number;
}

export class EncryptionMetadataManager {
  private static readonly VERSION = '1.0';
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly ITERATIONS = 100000;

  static createMetadata(salt: Uint8Array): EncryptionMetadata {
    return {
      salt: this.saltToBase64(salt),
      version: this.VERSION,
      algorithm: this.ALGORITHM,
      iterations: this.ITERATIONS,
      timestamp: Date.now()
    };
  }

  static extractSalt(metadata: EncryptionMetadata): Uint8Array {
    return this.saltFromBase64(metadata.salt);
  }

  static isValidMetadata(metadata: any): metadata is EncryptionMetadata {
    return metadata && 
           typeof metadata.salt === 'string' &&
           typeof metadata.version === 'string' &&
           typeof metadata.algorithm === 'string' &&
           typeof metadata.iterations === 'number' &&
           typeof metadata.timestamp === 'number';
  }

  private static saltToBase64(salt: Uint8Array): string {
    return btoa(String.fromCharCode(...salt));
  }

  private static saltFromBase64(saltBase64: string): Uint8Array {
    return new Uint8Array(atob(saltBase64).split('').map(char => char.charCodeAt(0)));
  }
}
