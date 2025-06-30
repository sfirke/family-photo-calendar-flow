
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SecurityProvider } from '@/contexts/SecurityContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { WeatherProvider } from '@/contexts/WeatherContext';

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

const customRender = async (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  let renderResult: ReturnType<typeof render>;
  
  await act(async () => {
    renderResult = render(ui, { wrapper: AllTheProviders, ...options });
  });
  
  return renderResult!;
};

export * from '@testing-library/react';
export { customRender as render, screen, fireEvent, waitFor, act };
