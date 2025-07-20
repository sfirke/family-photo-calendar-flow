import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLocalEvents } from '@/hooks/useLocalEvents';
import { mockSecurityModule, resetSecurityMocks } from '../utils/securityMocks';

// Apply security mock
mockSecurityModule();

// Mock useICalCalendars with the current interface
vi.mock('@/hooks/useICalCalendars', () => ({
  useICalCalendars: vi.fn(() => ({
    calendars: [
      {
        id: 'test-calendar',
        name: 'Test Calendar',
        color: '#3B82F6',
        enabled: true,
        url: 'https://example.com/calendar.ics',
        lastSync: new Date().toISOString()
      }
    ],
    getICalEvents: vi.fn(() => [
      {
        id: 1,
        title: 'Test Event',
        time: '10:00 AM',
        date: new Date(),
        category: 'Work',
        color: '#3b82f6',
        description: 'Test event',
        organizer: 'Test User',
        attendees: 1,
        location: 'Test Location',
        calendarId: 'test-calendar',
        calendarName: 'Test Calendar'
      }
    ]),
    forceRefresh: vi.fn(),
    isLoading: false,
    syncStatus: {},
    addCalendar: vi.fn(),
    updateCalendar: vi.fn(),
    removeCalendar: vi.fn(),
    syncCalendar: vi.fn(),
    syncAllCalendars: vi.fn(),
    isBackgroundSyncSupported: false,
    triggerBackgroundSync: vi.fn(),
  })),
}));

describe('useLocalEvents', () => {
  beforeEach(() => {
    resetSecurityMocks();
    vi.clearAllMocks();
  });

});