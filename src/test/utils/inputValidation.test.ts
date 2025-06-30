
import { describe, it, expect } from 'vitest';
import { InputValidator } from '@/utils/security/inputValidation';

describe('InputValidator', () => {
  describe('validateZipCode', () => {
    it('should validate correct zip codes', () => {
      expect(InputValidator.validateZipCode('90210').isValid).toBe(true);
      expect(InputValidator.validateZipCode('12345-6789').isValid).toBe(true);
    });

    it('should reject invalid zip codes', () => {
      // Test with strict validation (allowPartial = false, which is default)
      expect(InputValidator.validateZipCode('123').isValid).toBe(false);
      expect(InputValidator.validateZipCode('abcde').isValid).toBe(false);
      expect(InputValidator.validateZipCode('').isValid).toBe(false);
    });

    it('should allow partial input during typing', () => {
      // Test with allowPartial = true for progressive typing
      expect(InputValidator.validateZipCode('9', true).isValid).toBe(true);
      expect(InputValidator.validateZipCode('902', true).isValid).toBe(true);
    });
  });

  describe('validateApiKey', () => {
    it('should validate reasonable API keys', () => {
      expect(InputValidator.validateApiKey('abcd1234').isValid).toBe(true);
      expect(InputValidator.validateApiKey('test-api-key-123').isValid).toBe(true);
    });

    it('should reject dangerous content', () => {
      expect(InputValidator.validateApiKey('<script>alert()</script>').isValid).toBe(false);
      expect(InputValidator.validateApiKey('').isValid).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      expect(InputValidator.validateUrl('https://example.com').isValid).toBe(true);
      expect(InputValidator.validateUrl('http://test.com/path').isValid).toBe(true);
    });

    it('should reject dangerous URLs', () => {
      expect(InputValidator.validateUrl('javascript:alert()').isValid).toBe(false);
      expect(InputValidator.validateUrl('ftp://example.com').isValid).toBe(false);
      expect(InputValidator.validateUrl('').isValid).toBe(false);
    });
  });
});
