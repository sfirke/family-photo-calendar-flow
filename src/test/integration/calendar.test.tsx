import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '../utils/testUtils';
import { BrowserRouter } from 'react-router-dom';
import Index from '@/pages/Index';
import { mockSecurityModule, resetSecurityMocks } from '../utils/securityMocks';

// Apply direct module mock at the top level
mockSecurityModule();

// Mock version manager to prevent fetch errors
vi.mock('@/utils/versionManager', () => ({
  getVersionInfo: vi.fn().mockResolvedValue({
    version: '1.4.2',
    buildDate: '2024-01-01',
    gitHash: 'abc123',
    buildNumber: 1,
    environment: 'test'
  }),
  getInstalledVersion: vi.fn().mockReturnValue({
    version: '1.4.2',
    installDate: new Date().toISOString()
  }),
  getCurrentVersion: vi.fn().mockResolvedValue('1.4.2'),
  getStoredVersion: vi.fn().mockReturnValue('1.4.2'),
  setStoredVersion: vi.fn(),
  compareVersions: vi.fn().mockReturnValue(0),
  isUpdateAvailable: vi.fn().mockReturnValue(false),
  getVersionType: vi.fn().mockReturnValue('patch'),
}));

// Mock settings modal hook to prevent async operations
vi.mock('@/hooks/useSettingsModal', () => ({
  useSettingsModal: vi.fn(() => ({
    versionInfo: {
      version: '1.4.2',
      buildDate: '2024-01-01',
      gitHash: 'abc123'
    },
    handleThemeChange: vi.fn(),
  })),
}));

// Enhanced mock for calendar storage with all exports and methods
vi.mock('@/services/calendarStorage', () => ({
  calendarStorageService: {
    init: vi.fn().mockResolvedValue(undefined),
    addCalendar: vi.fn().mockResolvedValue(undefined),
    updateCalendar: vi.fn().mockResolvedValue(undefined),
    deleteCalendar: vi.fn().mockResolvedValue(undefined),
    getAllCalendars: vi.fn().mockResolvedValue([
      {
        id: 'test-calendar',
        name: 'Test Calendar',
        url: 'https://example.com/calendar.ics',
        color: '#3B82F6',
        enabled: true,
        lastSync: new Date().toISOString(),
        eventCount: 5,
      }
    ]),
    getCalendar: vi.fn().mockResolvedValue({
      id: 'test-calendar',
      name: 'Test Calendar',
      url: 'https://example.com/calendar.ics',
      color: '#3B82F6',
      enabled: true,
    }),
  },
  CalendarFeed: vi.fn(),
}));

// Enhanced mock for local events with proper array return
vi.mock('@/hooks/useLocalEvents', () => ({
  useLocalEvents: vi.fn(() => ({
    googleEvents: [
      {
        id: 1,
        title: 'Test Event',
        date: new Date(),
        time: '10:00 AM',
        location: 'Test Location',
        description: 'Test Description',
        attendees: 1,
        category: 'Work',
        color: '#3b82f6',
        organizer: 'Test User',
        calendarId: 'test-calendar',
        calendarName: 'Test Calendar'
      }
    ],
    localEvents: [
      {
        id: 1,
        title: 'Test Event',
        date: new Date(),
        time: '10:00 AM',
        location: 'Test Location',
        description: 'Test Description',
        attendees: 1,
        category: 'Work',
        color: '#3b82f6',
        organizer: 'Test User',
        calendarId: 'test-calendar',
        calendarName: 'Test Calendar'
      }
    ],
    isLoading: false,
    error: null,
    addEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
    refreshEvents: vi.fn(),
    resetToSampleEvents: vi.fn(),
    exportEvents: vi.fn(),
    importEvents: vi.fn(),
    clearCache: vi.fn(),
  })),
}));

// Enhanced mock for iCal calendars
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
    getICalEvents: vi.fn(() => []),
    isLoading: false,
    addCalendar: vi.fn(),
    updateCalendar: vi.fn(),
    deleteCalendar: vi.fn(),
    refreshCalendar: vi.fn(),
    refreshAllCalendars: vi.fn(),
  })),
}));

// Enhanced mock for calendar selection
vi.mock('@/hooks/useCalendarSelection', () => ({
  useCalendarSelection: vi.fn(() => ({
    selectedCalendarIds: ['test-calendar'],
    calendarsFromEvents: [
      {
        id: 'test-calendar',
        summary: 'Test Calendar',
        primary: false,
        eventCount: 1,
        hasEvents: true,
        color: '#3B82F6',
        enabled: true,
      }
    ],
    isLoading: false,
    updateSelectedCalendars: vi.fn(),
    toggleCalendar: vi.fn(),
    selectAllCalendars: vi.fn(),
    selectCalendarsWithEvents: vi.fn(),
    clearAllCalendars: vi.fn(),
    cleanupDeletedCalendar: vi.fn(),
    forceRefresh: vi.fn(),
  })),
}));

// Enhanced weather context mock with synchronous data
vi.mock('@/contexts/WeatherContext', () => ({
  WeatherProvider: ({ children }: { children: React.ReactNode }) => children,
  useWeather: vi.fn(() => ({
    weatherData: {
      temperature: 75,
      condition: 'Sunny',
      location: 'Beverly Hills, US',
      forecast: []
    },
    isLoading: false,
    error: null,
    getWeatherForDate: vi.fn().mockReturnValue({ temp: 75, condition: 'Sunny' }),
    getCurrentWeather: vi.fn().mockReturnValue({ temp: 75, condition: 'Sunny', location: 'Beverly Hills, US' }),
    refreshWeather: vi.fn(),
  })),
}));

describe('Calendar Integration', () => {
  beforeEach(() => {
    resetSecurityMocks();
  });

  const renderCalendar = async () => {
    let result;
    await act(async () => {
      result = await render(
        <BrowserRouter>
          <Index />
        </BrowserRouter>
      );
    });
    return result;
  };

  it('should render the calendar application', async () => {
    await renderCalendar();

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Check for calendar selector button which should exist
    expect(screen.getByText(/calendars/i)).toBeInTheDocument();
  });

  it('should display weather information', async () => {
    await renderCalendar();

    await act(async () => {
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    // Wait for weather data to be rendered with longer timeout
    await waitFor(() => {
      // Look for weather-related elements more specifically
      const weatherElement = screen.getByText(/sunny/i);
      expect(weatherElement).toBeInTheDocument();
    }, { timeout: 10000 });

    // Check for temperature display using a more specific approach
    await waitFor(() => {
      const temperatureRegex = /75/;
      const elements = screen.getAllByText(temperatureRegex);
      expect(elements.length).toBeGreaterThan(0);
    }, { timeout: 10000 });
  }, 15000); // Increase test timeout to 15 seconds
});
