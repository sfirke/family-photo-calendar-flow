
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SecurityProvider } from '@/contexts/SecurityContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { WeatherProvider } from '@/contexts/WeatherContext';

// Enhanced AllTheProviders with better error handling
export const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
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
