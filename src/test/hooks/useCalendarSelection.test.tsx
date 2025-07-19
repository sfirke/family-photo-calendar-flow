import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import { mockSecurityModule, resetSecurityMocks } from '../utils/securityMocks';

// Apply security mock
mockSecurityModule();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock useICalCalendars
vi.mock('@/hooks/useICalCalendars', () => ({
  useICalCalendars: vi.fn(() => ({
    calendars: [
      {
        id: 'ical-calendar-1',
        name: 'iCal Calendar',
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
        calendarId: 'ical-calendar-1'
      }
    ]),
    isLoading: false,
  })),
}));

// Mock useNotionScrapedCalendars
vi.mock('@/hooks/useNotionScrapedCalendars', () => ({
  useNotionScrapedCalendars: vi.fn(() => ({
    calendars: [
      {
        id: 'notion-calendar-1',
        name: 'Notion Calendar',
        color: '#10B981',
        enabled: true,
        type: 'notion-scraped',
        lastSync: new Date().toISOString()
      }
    ],
    events: [
      {
        id: 2,
        title: 'Notion Event',
        calendarId: 'notion-calendar-1'
      }
    ],
    isLoading: false,
  })),
}));

// Mock useCalendarRefresh
vi.mock('@/hooks/useCalendarRefresh', () => ({
  useCalendarRefresh: vi.fn(() => ({
    useRefreshListener: vi.fn((callback) => {
      // Immediately call callback for testing
      setTimeout(() => callback({ type: 'test', calendarId: 'test' }), 0);
    }),
  })),
}));

describe('useCalendarSelection', () => {
  beforeEach(() => {
    resetSecurityMocks();
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should initialize with empty selected calendars', () => {
    const { result } = renderHook(() => useCalendarSelection());

    expect(result.current.selectedCalendarIds).toEqual([]);
  });

  it('should load selected calendars from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('["calendar-1", "calendar-2"]');
    
    const { result } = renderHook(() => useCalendarSelection());

    expect(result.current.selectedCalendarIds).toEqual(['calendar-1', 'calendar-2']);
  });

  it('should combine calendars from all sources', () => {
    const { result } = renderHook(() => useCalendarSelection());

    expect(result.current.allCalendars).toHaveLength(2);
    expect(result.current.allCalendars[0].name).toBe('iCal Calendar');
    expect(result.current.allCalendars[1].name).toBe('Notion Calendar');
  });

  it('should filter enabled calendars', () => {
    const { result } = renderHook(() => useCalendarSelection());

    expect(result.current.enabledCalendars).toHaveLength(2);
    expect(result.current.enabledCalendars.every(cal => cal.enabled)).toBe(true);
  });

  it('should create calendarsFromEvents with proper event counts', () => {
    const { result } = renderHook(() => useCalendarSelection());

    expect(result.current.calendarsFromEvents).toHaveLength(2);
    
    const iCalCalendar = result.current.calendarsFromEvents.find(cal => cal.id === 'ical-calendar-1');
    expect(iCalCalendar).toBeDefined();
    expect(iCalCalendar!.source).toBe('ical');
    expect(iCalCalendar!.eventCount).toBe(1);
    expect(iCalCalendar!.hasEvents).toBe(true);

    const notionCalendar = result.current.calendarsFromEvents.find(cal => cal.id === 'notion-calendar-1');
    expect(notionCalendar).toBeDefined();
    expect(notionCalendar!.source).toBe('notion-scraped');
    expect(notionCalendar!.eventCount).toBe(1);
    expect(notionCalendar!.hasEvents).toBe(true);
  });

  it('should toggle calendar selection', () => {
    const { result } = renderHook(() => useCalendarSelection());

    act(() => {
      result.current.toggleCalendar('test-calendar', true);
    });

    expect(result.current.selectedCalendarIds).toContain('test-calendar');

    act(() => {
      result.current.toggleCalendar('test-calendar', false);
    });

    expect(result.current.selectedCalendarIds).not.toContain('test-calendar');
  });

  it('should select all calendars', () => {
    const { result } = renderHook(() => useCalendarSelection());

    act(() => {
      result.current.selectAllCalendars();
    });

    expect(result.current.selectedCalendarIds).toHaveLength(2);
    expect(result.current.selectedCalendarIds).toContain('ical-calendar-1');
    expect(result.current.selectedCalendarIds).toContain('notion-calendar-1');
  });

  it('should clear all calendar selections', () => {
    const { result } = renderHook(() => useCalendarSelection());

    // First select some calendars
    act(() => {
      result.current.selectAllCalendars();
    });

    expect(result.current.selectedCalendarIds).toHaveLength(2);

    // Then clear them
    act(() => {
      result.current.clearAllCalendars();
    });

    expect(result.current.selectedCalendarIds).toEqual([]);
  });

  it('should select calendars with events', () => {
    const { result } = renderHook(() => useCalendarSelection());

    act(() => {
      result.current.selectCalendarsWithEvents();
    });

    expect(result.current.selectedCalendarIds).toHaveLength(2);
    expect(result.current.selectedCalendarIds).toContain('ical-calendar-1');
    expect(result.current.selectedCalendarIds).toContain('notion-calendar-1');
  });

  it('should cleanup deleted calendar', () => {
    const { result } = renderHook(() => useCalendarSelection());

    // First select a calendar
    act(() => {
      result.current.toggleCalendar('test-calendar', true);
    });

    expect(result.current.selectedCalendarIds).toContain('test-calendar');

    // Then clean it up
    act(() => {
      result.current.cleanupDeletedCalendar('test-calendar');
    });

    expect(result.current.selectedCalendarIds).not.toContain('test-calendar');
  });
});