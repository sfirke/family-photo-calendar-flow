
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { AllTheProviders } from './testProviders';

// Enhanced custom render with better async handling and error recovery
const customRender = async (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  let renderResult: ReturnType<typeof render>;
  
  try {
    await act(async () => {
      renderResult = render(ui, { wrapper: AllTheProviders, ...options });
    });
    
    return renderResult!;
  } catch (error) {
    console.warn('Error in test render (attempting fallback):', error);
    // Return a fallback render result with proper error handling
    try {
      return render(ui, { wrapper: AllTheProviders, ...options });
    } catch (fallbackError) {
      console.error('Fallback render also failed:', fallbackError);
      // Create minimal render result for graceful degradation
      return render(ui, options);
    }
  }
};

// Enhanced mock utilities with better defaults
export const createMockEvent = (overrides = {}) => ({
  id: 1,
  title: 'Test Event',
  time: '10:00 AM',
  date: new Date(),
  category: 'Work',
  color: '#3b82f6',
  description: 'Test event description',
  organizer: 'Test User',
  attendees: 1,
  location: 'Test Location',
  calendarId: 'test-calendar',
  calendarName: 'Test Calendar',
  ...overrides,
});

export const createMockWeatherData = (overrides = {}) => ({
  temperature: 75,
  condition: 'Sunny',
  location: 'Test Location',
  forecast: [],
  ...overrides,
});

// Mock function helpers with better cleanup
export const mockConsoleWarn = () => {
  const originalWarn = console.warn;
  console.warn = vi.fn();
  return () => {
    console.warn = originalWarn;
  };
};

export const mockConsoleError = () => {
  const originalError = console.error;
  console.error = vi.fn();
  return () => {
    console.error = originalError;
  };
};

// Enhanced mock for useLocalEvents that matches current interface
export const createMockUseLocalEvents = () => ({
  googleEvents: [], // Now returns iCal events as googleEvents
  isLoading: false,
  forceRefresh: vi.fn(),
});

// Enhanced mock for useCalendarSelection that matches current interface
export const createMockUseCalendarSelection = () => ({
  allCalendars: [],
  enabledCalendars: [],
  selectedCalendarIds: [],
  notionEvents: [], // Legacy support - empty array
  scrapedEvents: [],
  calendarsFromEvents: [],
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
});

// Enhanced mock for useIntegratedEvents that matches current interface
export const createMockUseIntegratedEvents = () => ({
  filteredEvents: [],
  eventStats: {
    googleEventCount: 0,
    notionEventCount: 0,
    scrapedEventCount: 0,
    totalEvents: 0,
    hasGoogleEvents: false,
    hasNotionEvents: false,
    hasScrapedEvents: false
  },
  selectedCalendarIds: [],
});

// Re-export explicit members instead of wildcard to satisfy react-refresh rule
export { render as rtlRender, cleanup, within } from '@testing-library/react';
export { customRender as render, screen, fireEvent, waitFor, act };
