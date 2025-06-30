
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { WeatherProvider } from '@/contexts/WeatherContext';

// Test-specific SecurityProvider that doesn't use real encryption
const TestSecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const mockSecurityContext = {
    isSecurityEnabled: false,
    isInitialized: true,
    hasLockedData: false,
    enableSecurity: async () => true,
    disableSecurity: () => {},
    getSecurityStatus: () => 'Security Disabled - Data stored in plain text',
    isDataAvailable: async () => true,
  };

  return (
    <div data-testid="test-security-provider">
      {React.cloneElement(children as React.ReactElement, { securityContext: mockSecurityContext })}
    </div>
  );
};

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TestSecurityProvider>
          <SettingsProvider>
            <WeatherProvider>
              {children}
            </WeatherProvider>
          </SettingsProvider>
        </TestSecurityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Enhanced TestErrorBoundary that logs errors instead of hiding them
export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('TestErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TestErrorBoundary - Full error details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-boundary">
          <h2>Test Error Boundary</h2>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error?.message}</pre>
            <pre>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
