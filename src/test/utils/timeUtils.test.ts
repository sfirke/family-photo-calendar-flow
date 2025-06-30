
import { describe, it, expect } from 'vitest';
import { extractStartTime, timeToMinutes, compareTimeStrings } from '@/utils/timeUtils';

describe('timeUtils', () => {
  describe('extractStartTime', () => {
    it('should extract start time from time ranges', () => {
      expect(extractStartTime('9:00 AM - 5:00 PM')).toBe('9:00 AM');
      expect(extractStartTime('1:30 PM – 3:45 PM')).toBe('1:30 PM');
      expect(extractStartTime('10:00 AM to 2:00 PM')).toBe('10:00 AM');
      expect(extractStartTime('8:15 AM until 12:30 PM')).toBe('8:15 AM');
    });

    it('should return the time if no range separator found', () => {
      expect(extractStartTime('2:00 PM')).toBe('2:00 PM');
      expect(extractStartTime('9:30 AM')).toBe('9:30 AM');
      expect(extractStartTime('11 PM')).toBe('11 PM');
    });

    it('should handle all day events', () => {
      expect(extractStartTime('All day')).toBe('');
      expect(extractStartTime('all day event')).toBe('');
      expect(extractStartTime('ALL DAY')).toBe('');
    });

    it('should handle empty or invalid input', () => {
      expect(extractStartTime('')).toBe('');
      expect(extractStartTime('   ')).toBe('');
    });
  });

  describe('timeToMinutes', () => {
    it('should convert 12-hour format AM times correctly', () => {
      expect(timeToMinutes('12:00 AM')).toBe(0); // Midnight
      expect(timeToMinutes('1:00 AM')).toBe(60);
      expect(timeToMinutes('9:30 AM')).toBe(570);
      expect(timeToMinutes('11:45 AM')).toBe(705);
    });

    it('should convert 12-hour format PM times correctly', () => {
      expect(timeToMinutes('12:00 PM')).toBe(720); // Noon
      expect(timeToMinutes('1:00 PM')).toBe(780);
      expect(timeToMinutes('5:30 PM')).toBe(1050);
      expect(timeToMinutes('11:45 PM')).toBe(1425);
    });

    it('should handle hour-only format', () => {
      expect(timeToMinutes('9 AM')).toBe(540);
      expect(timeToMinutes('2 PM')).toBe(840);
      expect(timeToMinutes('12 AM')).toBe(0);
      expect(timeToMinutes('12 PM')).toBe(720);
    });

    it('should handle 24-hour format', () => {
      expect(timeToMinutes('09:30')).toBe(570);
      expect(timeToMinutes('14:45')).toBe(885);
      expect(timeToMinutes('23:59')).toBe(1439);
      expect(timeToMinutes('00:00')).toBe(0);
    });

    it('should handle time ranges by extracting start time', () => {
      expect(timeToMinutes('9:00 AM - 5:00 PM')).toBe(540);
      expect(timeToMinutes('1:30 PM – 3:45 PM')).toBe(810);
    });

    it('should return fallback value for invalid times', () => {
      expect(timeToMinutes('invalid time')).toBe(9999);
      expect(timeToMinutes('')).toBe(0);
      expect(timeToMinutes('All day')).toBe(0);
    });
  });

  describe('compareTimeStrings', () => {
    it('should sort morning times chronologically', () => {
      expect(compareTimeStrings('9:00 AM', '10:00 AM')).toBeLessThan(0);
      expect(compareTimeStrings('8:30 AM', '8:45 AM')).toBeLessThan(0);
      expect(compareTimeStrings('11:00 AM', '9:00 AM')).toBeGreaterThan(0);
    });

    it('should sort afternoon times chronologically', () => {
      expect(compareTimeStrings('1:00 PM', '2:00 PM')).toBeLessThan(0);
      expect(compareTimeStrings('3:30 PM', '1:15 PM')).toBeGreaterThan(0);
    });

    it('should properly sort across AM/PM boundary', () => {
      expect(compareTimeStrings('11:30 AM', '12:30 PM')).toBeLessThan(0);
      expect(compareTimeStrings('9:00 AM', '1:00 PM')).toBeLessThan(0);
      expect(compareTimeStrings('2:00 PM', '10:00 AM')).toBeGreaterThan(0);
    });

    it('should handle midnight and noon correctly', () => {
      expect(compareTimeStrings('12:00 AM', '1:00 AM')).toBeLessThan(0);
      expect(compareTimeStrings('11:59 PM', '12:00 AM')).toBeGreaterThan(0);
      expect(compareTimeStrings('11:59 AM', '12:00 PM')).toBeLessThan(0);
    });

    it('should return 0 for identical times', () => {
      expect(compareTimeStrings('2:30 PM', '2:30 PM')).toBe(0);
      expect(compareTimeStrings('9:00 AM', '9:00 AM')).toBe(0);
    });

    it('should handle time ranges correctly', () => {
      expect(compareTimeStrings('9:00 AM - 11:00 AM', '10:00 AM - 12:00 PM')).toBeLessThan(0);
      expect(compareTimeStrings('2:00 PM - 4:00 PM', '1:00 PM - 3:00 PM')).toBeGreaterThan(0);
    });
  });
});
