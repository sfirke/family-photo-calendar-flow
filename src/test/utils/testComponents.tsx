
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SecurityProvider } from '@/contexts/SecurityContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { WeatherProvider } from '@/contexts/WeatherContext';

// Error boundary component for tests
class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Test error boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-fallback">Test error occurred</div>;
    }

    return this.props.children;
  }
}

// Enhanced AllTheProviders with better error handling and test-specific defaults
export const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
      mutations: { retry: false },
    },
  });

  return (
    <TestErrorBoundary>
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
    </TestErrorBoundary>
  );
};
