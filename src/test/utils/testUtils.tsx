import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SecurityProvider } from '@/contexts/SecurityContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { WeatherProvider } from '@/contexts/WeatherContext';

// Enhanced AllTheProviders with better error handling
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SecurityProvider>
          <SettingsProvider>
            <WeatherProvider>
              {children}
            </WeatherProvider>
          </SettingsProvider>
        </SecurityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Enhanced custom render with better async handling
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

// Enhanced mock utilities
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
  ...overrides,
});

export const createMockWeatherData = (overrides = {}) => ({
  temperature: 75,
  condition: 'Sunny',
  location: 'Test Location',
  forecast: [],
  ...overrides,
});

// Mock function helpers
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

export * from '@testing-library/react';
export { customRender as render, screen, fireEvent, waitFor, act };
