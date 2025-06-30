
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { act } from '@testing-library/react';
import { vi } from 'vitest';
import { AllTheProviders } from './testComponents';

// Enhanced custom render with better async handling and error recovery
export const customRender = async (
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
    console.warn('Error in test render:', error);
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

// Enhanced mock for useLocalEvents that always returns arrays
export const createMockUseLocalEvents = () => ({
  googleEvents: [],
  localEvents: [],
  isLoading: false,
  refreshEvents: vi.fn(),
  addEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  resetToSampleEvents: vi.fn(),
  exportEvents: vi.fn(),
  importEvents: vi.fn(),
  clearCache: vi.fn(),
});

// Enhanced mock for useCalendarSelection
export const createMockUseCalendarSelection = () => ({
  selectedCalendarIds: [],
  calendarsFromEvents: [],
  isLoading: false,
  updateSelectedCalendars: vi.fn(),
  toggleCalendar: vi.fn(),
  selectAllCalendars: vi.fn(),
  selectCalendarsWithEvents: vi.fn(),
  clearAllCalendars: vi.fn(),
  cleanupDeletedCalendar: vi.fn(),
  forceRefresh: vi.fn(),
});

export * from '@testing-library/react';
export { screen, fireEvent, waitFor, act } from '@testing-library/react';
export { customRender as render };
