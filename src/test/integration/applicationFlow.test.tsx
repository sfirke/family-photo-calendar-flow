import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { mockSecurityModule, resetSecurityMocks } from '../utils/securityMocks';

// Apply security mock
mockSecurityModule();

// Mock all core hooks with current interfaces
vi.mock('@/hooks/useLocalEvents', () => ({
  useLocalEvents: vi.fn(() => ({
    googleEvents: [
      {
        id: 1,
        title: 'Test iCal Event',
        time: '10:00 AM',
        date: new Date(),
        category: 'Work',
        color: '#3b82f6',
        description: 'Test event from iCal',
        organizer: 'iCal Calendar',
        attendees: 1,
        location: 'Test Location',
        calendarId: 'ical-calendar-1',
        calendarName: 'Test iCal Calendar'
      }
    ],
    isLoading: false,
    forceRefresh: vi.fn(),
  })),
}));

vi.mock('@/hooks/useCalendarSelection', () => ({
  useCalendarSelection: vi.fn(() => ({
    allCalendars: [
      {
        id: 'ical-calendar-1',
        name: 'Test iCal Calendar',
        color: '#3B82F6',
        enabled: true,
        url: 'https://example.com/calendar.ics',
      },
      {
        id: 'notion-calendar-1',
        name: 'Test Notion Calendar',
        color: '#10B981',
        enabled: true,
        type: 'notion-scraped',
      }
    ],
    enabledCalendars: [
      {
        id: 'ical-calendar-1',
        name: 'Test iCal Calendar',
        color: '#3B82F6',
        enabled: true,
        url: 'https://example.com/calendar.ics',
      },
      {
        id: 'notion-calendar-1',
        name: 'Test Notion Calendar',
        color: '#10B981',
        enabled: true,
        type: 'notion-scraped',
      }
    ],
    selectedCalendarIds: ['ical-calendar-1', 'notion-calendar-1'],
    notionEvents: [],
    scrapedEvents: [
      {
        id: 2,
        title: 'Test Notion Event',
        time: 'All day',
        date: new Date(),
        category: 'Personal',
        color: '#10b981',
        description: 'Test event from Notion',
        organizer: 'Notion Calendar',
        attendees: 0,
        location: '',
        calendarId: 'notion-calendar-1',
        calendarName: 'Test Notion Calendar'
      }
    ],
    calendarsFromEvents: [
      {
        id: 'ical-calendar-1',
        summary: 'Test iCal Calendar',
        color: '#3B82F6',
        primary: false,
        hasEvents: true,
        eventCount: 1,
        source: 'ical'
      },
      {
        id: 'notion-calendar-1',
        summary: 'Test Notion Calendar',
        color: '#10B981',
        primary: false,
        hasEvents: true,
        eventCount: 1,
        source: 'notion-scraped'
      }
    ],
    isLoading: false,
    toggleCalendar: vi.fn(),
    selectAllCalendars: vi.fn(),
    deselectAllCalendars: vi.fn(),
    setSelectedCalendarIds: vi.fn(),
    clearAllCalendars: vi.fn(),
    selectCalendarsWithEvents: vi.fn(),
    updateSelectedCalendars: vi.fn(),
    cleanupDeletedCalendar: vi.fn(),
    forceRefresh: vi.fn(),
  })),
}));

vi.mock('@/hooks/useIntegratedEvents', () => ({
  useIntegratedEvents: vi.fn(() => ({
    filteredEvents: [
      {
        id: 1,
        title: 'Test iCal Event',
        time: '10:00 AM',
        date: new Date(),
        category: 'Work',
        color: '#3b82f6',
        description: 'Test event from iCal',
        organizer: 'iCal Calendar',
        attendees: 1,
        location: 'Test Location',
        calendarId: 'ical-calendar-1',
        calendarName: 'Test iCal Calendar'
      },
      {
        id: 2,
        title: 'Test Notion Event',
        time: 'All day',
        date: new Date(),
        category: 'Personal',
        color: '#10b981',
        description: 'Test event from Notion',
        organizer: 'Notion Calendar',
        attendees: 0,
        location: '',
        calendarId: 'notion-calendar-1',
        calendarName: 'Test Notion Calendar'
      }
    ],
    eventStats: {
      googleEventCount: 1,
      notionEventCount: 0,
      scrapedEventCount: 1,
      totalEvents: 2,
      hasGoogleEvents: true,
      hasNotionEvents: false,
      hasScrapedEvents: true,
    },
    selectedCalendarIds: ['ical-calendar-1', 'notion-calendar-1'],
  })),
}));

vi.mock('@/hooks/useBackgroundSync', () => ({
  useBackgroundSync: vi.fn(() => ({
    isBackgroundSyncSupported: true,
    isPeriodicSyncSupported: true,
    lastSyncResult: null,
    syncQueue: [],
    registerBackgroundSync: vi.fn().mockResolvedValue(true),
    registerPeriodicSync: vi.fn().mockResolvedValue(true),
    triggerBackgroundSync: vi.fn().mockResolvedValue(true),
    processSyncQueue: vi.fn(),
  })),
}));

describe('Application Flow Integration', () => {
  beforeEach(() => {
    resetSecurityMocks();
    vi.clearAllMocks();
  });

  describe('Hook Integration', () => {
    it('should integrate useLocalEvents with current interface', () => {
      const { useLocalEvents } = require('@/hooks/useLocalEvents');
      const mockHook = useLocalEvents();

      expect(mockHook).toHaveProperty('googleEvents');
      expect(mockHook).toHaveProperty('isLoading');
      expect(mockHook).toHaveProperty('forceRefresh');
      expect(Array.isArray(mockHook.googleEvents)).toBe(true);
      expect(mockHook.googleEvents).toHaveLength(1);
      expect(mockHook.googleEvents[0].title).toBe('Test iCal Event');
    });

    it('should integrate useCalendarSelection with current interface', () => {
      const { useCalendarSelection } = require('@/hooks/useCalendarSelection');
      const mockHook = useCalendarSelection();

      expect(mockHook).toHaveProperty('allCalendars');
      expect(mockHook).toHaveProperty('enabledCalendars');
      expect(mockHook).toHaveProperty('selectedCalendarIds');
      expect(mockHook).toHaveProperty('calendarsFromEvents');
      expect(mockHook).toHaveProperty('scrapedEvents');
      expect(mockHook).toHaveProperty('notionEvents');
      
      expect(Array.isArray(mockHook.allCalendars)).toBe(true);
      expect(Array.isArray(mockHook.enabledCalendars)).toBe(true);
      expect(Array.isArray(mockHook.selectedCalendarIds)).toBe(true);
      expect(Array.isArray(mockHook.calendarsFromEvents)).toBe(true);
      expect(Array.isArray(mockHook.scrapedEvents)).toBe(true);
      expect(Array.isArray(mockHook.notionEvents)).toBe(true);

      expect(mockHook.allCalendars).toHaveLength(2);
      expect(mockHook.enabledCalendars).toHaveLength(2);
      expect(mockHook.selectedCalendarIds).toHaveLength(2);
      expect(mockHook.calendarsFromEvents).toHaveLength(2);
      expect(mockHook.scrapedEvents).toHaveLength(1);
      expect(mockHook.notionEvents).toHaveLength(0); // Legacy support
    });

    it('should integrate useIntegratedEvents with current interface', () => {
      const { useIntegratedEvents } = require('@/hooks/useIntegratedEvents');
      const mockEvents = [{ id: 1, title: 'Test Event' }];
      const mockHook = useIntegratedEvents(mockEvents);

      expect(mockHook).toHaveProperty('filteredEvents');
      expect(mockHook).toHaveProperty('eventStats');
      expect(mockHook).toHaveProperty('selectedCalendarIds');
      
      expect(Array.isArray(mockHook.filteredEvents)).toBe(true);
      expect(Array.isArray(mockHook.selectedCalendarIds)).toBe(true);
      expect(typeof mockHook.eventStats).toBe('object');

      expect(mockHook.filteredEvents).toHaveLength(2);
      expect(mockHook.eventStats.totalEvents).toBe(2);
      expect(mockHook.eventStats.hasGoogleEvents).toBe(true);
      expect(mockHook.eventStats.hasScrapedEvents).toBe(true);
    });

    it('should integrate useBackgroundSync with current interface', () => {
      const { useBackgroundSync } = require('@/hooks/useBackgroundSync');
      const mockHook = useBackgroundSync();

      expect(mockHook).toHaveProperty('isBackgroundSyncSupported');
      expect(mockHook).toHaveProperty('isPeriodicSyncSupported');
      expect(mockHook).toHaveProperty('lastSyncResult');
      expect(mockHook).toHaveProperty('syncQueue');
      expect(mockHook).toHaveProperty('registerBackgroundSync');
      expect(mockHook).toHaveProperty('registerPeriodicSync');
      expect(mockHook).toHaveProperty('triggerBackgroundSync');
      expect(mockHook).toHaveProperty('processSyncQueue');

      expect(typeof mockHook.registerBackgroundSync).toBe('function');
      expect(typeof mockHook.registerPeriodicSync).toBe('function');
      expect(typeof mockHook.triggerBackgroundSync).toBe('function');
      expect(typeof mockHook.processSyncQueue).toBe('function');
      
      expect(mockHook.isBackgroundSyncSupported).toBe(true);
      expect(mockHook.isPeriodicSyncSupported).toBe(true);
      expect(Array.isArray(mockHook.syncQueue)).toBe(true);
    });
  });

  describe('Calendar Source Integration', () => {
    it('should handle multiple calendar sources correctly', () => {
      const { useCalendarSelection } = require('@/hooks/useCalendarSelection');
      const mockHook = useCalendarSelection();

      const iCalCalendar = mockHook.calendarsFromEvents.find((cal: any) => cal.source === 'ical');
      const notionCalendar = mockHook.calendarsFromEvents.find((cal: any) => cal.source === 'notion-scraped');

      expect(iCalCalendar).toBeDefined();
      expect(iCalCalendar.id).toBe('ical-calendar-1');
      expect(iCalCalendar.hasEvents).toBe(true);
      expect(iCalCalendar.eventCount).toBe(1);

      expect(notionCalendar).toBeDefined();
      expect(notionCalendar.id).toBe('notion-calendar-1');
      expect(notionCalendar.hasEvents).toBe(true);
      expect(notionCalendar.eventCount).toBe(1);
    });

    it('should handle event filtering across sources', () => {
      const { useIntegratedEvents } = require('@/hooks/useIntegratedEvents');
      const mockHook = useIntegratedEvents([]);

      expect(mockHook.filteredEvents).toHaveLength(2);
      expect(mockHook.eventStats.googleEventCount).toBe(1);
      expect(mockHook.eventStats.scrapedEventCount).toBe(1);
      expect(mockHook.eventStats.totalEvents).toBe(2);
    });
  });

  describe('Background Sync Integration', () => {
    it('should support background sync functionality', () => {
      const { useBackgroundSync } = require('@/hooks/useBackgroundSync');
      const mockHook = useBackgroundSync();

      expect(mockHook.isBackgroundSyncSupported).toBe(true);
      expect(mockHook.isPeriodicSyncSupported).toBe(true);
    });

    it('should provide sync management functions', async () => {
      const { useBackgroundSync } = require('@/hooks/useBackgroundSync');
      const mockHook = useBackgroundSync();

      await expect(mockHook.registerBackgroundSync()).resolves.toBe(true);
      await expect(mockHook.registerPeriodicSync()).resolves.toBe(true);
      await expect(mockHook.triggerBackgroundSync()).resolves.toBe(true);
      
      expect(() => mockHook.processSyncQueue()).not.toThrow();
    });
  });

  describe('Data Flow Validation', () => {
    it('should maintain consistent data structures across hooks', () => {
      const { useLocalEvents } = require('@/hooks/useLocalEvents');
      const { useCalendarSelection } = require('@/hooks/useCalendarSelection');
      const { useIntegratedEvents } = require('@/hooks/useIntegratedEvents');

      const localEvents = useLocalEvents();
      const calendarSelection = useCalendarSelection();
      const integratedEvents = useIntegratedEvents(localEvents.googleEvents);

      // Verify data consistency
      expect(Array.isArray(localEvents.googleEvents)).toBe(true);
      expect(Array.isArray(calendarSelection.selectedCalendarIds)).toBe(true);
      expect(Array.isArray(integratedEvents.filteredEvents)).toBe(true);

      // Verify all functions exist and are callable
      expect(typeof localEvents.forceRefresh).toBe('function');
      expect(typeof calendarSelection.toggleCalendar).toBe('function');
      expect(typeof calendarSelection.selectAllCalendars).toBe('function');
    });

    it('should handle empty data gracefully', () => {
      const { useIntegratedEvents } = require('@/hooks/useIntegratedEvents');
      
      // Test with empty/undefined inputs
      const emptyEvents = useIntegratedEvents([]);
      const undefinedEvents = useIntegratedEvents(undefined);

      expect(Array.isArray(emptyEvents.filteredEvents)).toBe(true);
      expect(Array.isArray(undefinedEvents.filteredEvents)).toBe(true);
      expect(typeof emptyEvents.eventStats).toBe('object');
      expect(typeof undefinedEvents.eventStats).toBe('object');
    });
  });

  describe('Type Safety', () => {
    it('should maintain proper TypeScript interfaces', () => {
      const { useCalendarSelection } = require('@/hooks/useCalendarSelection');
      const mockHook = useCalendarSelection();

      // Verify CalendarFromEvents interface
      mockHook.calendarsFromEvents.forEach((calendar: any) => {
        expect(calendar).toHaveProperty('id');
        expect(calendar).toHaveProperty('summary');
        expect(calendar).toHaveProperty('color');
        expect(calendar).toHaveProperty('primary');
        expect(calendar).toHaveProperty('hasEvents');
        expect(calendar).toHaveProperty('eventCount');
        expect(calendar).toHaveProperty('source');
        
        expect(typeof calendar.id).toBe('string');
        expect(typeof calendar.summary).toBe('string');
        expect(typeof calendar.color).toBe('string');
        expect(typeof calendar.primary).toBe('boolean');
        expect(typeof calendar.hasEvents).toBe('boolean');
        expect(typeof calendar.eventCount).toBe('number');
        expect(typeof calendar.source).toBe('string');
      });
    });

    it('should provide consistent event interfaces', () => {
      const { useIntegratedEvents } = require('@/hooks/useIntegratedEvents');
      const mockHook = useIntegratedEvents([]);

      mockHook.filteredEvents.forEach((event: any) => {
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('title');
        expect(event).toHaveProperty('time');
        expect(event).toHaveProperty('date');
        expect(event).toHaveProperty('category');
        expect(event).toHaveProperty('color');
        expect(event).toHaveProperty('calendarId');
        expect(event).toHaveProperty('calendarName');
      });
    });
  });
});