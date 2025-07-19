import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIntegratedEvents } from '@/hooks/useIntegratedEvents';
import { mockSecurityModule, resetSecurityMocks } from '../utils/securityMocks';
import { Event } from '@/types/calendar';

// Apply security mock
mockSecurityModule();

// Mock useEventFiltering
const mockFilteredEvents: Event[] = [
  {
    id: 1,
    title: 'Filtered Event',
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
];

vi.mock('@/hooks/useEventFiltering', () => ({
  useEventFiltering: vi.fn(() => ({
    filteredEvents: mockFilteredEvents,
    hasGoogleEvents: true,
    hasNotionEvents: false,
    hasScrapedEvents: true,
  })),
}));

// Mock useCalendarSelection
vi.mock('@/hooks/useCalendarSelection', () => ({
  useCalendarSelection: vi.fn(() => ({
    selectedCalendarIds: ['test-calendar'],
    notionEvents: [],
    scrapedEvents: [
      {
        id: 2,
        title: 'Scraped Event',
        calendarId: 'scraped-calendar'
      }
    ],
    enabledCalendars: [
      {
        id: 'test-calendar',
        name: 'Test Calendar',
        enabled: true
      }
    ],
  })),
}));

// Mock useICalCalendars
vi.mock('@/hooks/useICalCalendars', () => ({
  useICalCalendars: vi.fn(() => ({
    calendars: [],
    getICalEvents: vi.fn(() => []),
    isLoading: false,
  })),
}));

describe('useIntegratedEvents', () => {
  beforeEach(() => {
    resetSecurityMocks();
    vi.clearAllMocks();
  });

  it('should return filtered events', () => {
    const googleEvents: Event[] = [
      {
        id: 1,
        title: 'Google Event',
        time: '10:00 AM',
        date: new Date(),
        category: 'Work',
        color: '#3b82f6',
        description: 'Test event',
        organizer: 'Test User',
        attendees: 1,
        location: 'Test Location',
        calendarId: 'google-calendar',
        calendarName: 'Google Calendar'
      }
    ];

    const { result } = renderHook(() => useIntegratedEvents(googleEvents));

    expect(result.current.filteredEvents).toEqual(mockFilteredEvents);
  });

  it('should handle empty googleEvents array', () => {
    const { result } = renderHook(() => useIntegratedEvents([]));

    expect(result.current.filteredEvents).toEqual(mockFilteredEvents);
    expect(Array.isArray(result.current.filteredEvents)).toBe(true);
  });

  it('should handle undefined googleEvents', () => {
    const { result } = renderHook(() => useIntegratedEvents(undefined));

    expect(result.current.filteredEvents).toEqual(mockFilteredEvents);
    expect(Array.isArray(result.current.filteredEvents)).toBe(true);
  });

  it('should provide event statistics', () => {
    const googleEvents: Event[] = [
      {
        id: 1,
        title: 'Google Event',
        time: '10:00 AM',
        date: new Date(),
        category: 'Work',
        color: '#3b82f6',
        description: 'Test event',
        organizer: 'Test User',
        attendees: 1,
        location: 'Test Location',
        calendarId: 'google-calendar',
        calendarName: 'Google Calendar'
      }
    ];

    const { result } = renderHook(() => useIntegratedEvents(googleEvents));

    expect(result.current.eventStats).toMatchObject({
      googleEventCount: 1,
      notionEventCount: 0,
      scrapedEventCount: 1,
      totalEvents: 1,
      hasGoogleEvents: true,
      hasNotionEvents: false,
      hasScrapedEvents: true,
    });
  });

  it('should return selected calendar IDs', () => {
    const { result } = renderHook(() => useIntegratedEvents([]));

    expect(result.current.selectedCalendarIds).toEqual(['test-calendar']);
  });

  it('should handle refreshKey parameter', () => {
    const { result } = renderHook(() => useIntegratedEvents([], 5));

    expect(result.current.filteredEvents).toEqual(mockFilteredEvents);
  });

  it('should ensure all returned arrays are safe', () => {
    const { result } = renderHook(() => useIntegratedEvents());

    expect(Array.isArray(result.current.filteredEvents)).toBe(true);
    expect(Array.isArray(result.current.selectedCalendarIds)).toBe(true);
    expect(typeof result.current.eventStats).toBe('object');
  });
});