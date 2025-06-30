
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from '@testing-library/react';
import WeatherSettings from '@/components/settings/weather/WeatherSettings';
import { AllTheProviders } from '../utils/testProviders';

// Mock the security context with a simple implementation
const mockUseSecurity = vi.fn(() => ({
  isSecurityEnabled: false,
  hasLockedData: false,
  isInitialized: true,
  enableSecurity: vi.fn(),
  disableSecurity: vi.fn(),
  unlockSecurity: vi.fn(),
  lockSecurity: vi.fn(),
  encryptData: vi.fn(),
  decryptData: vi.fn(),
  getSecurityStatus: vi.fn(() => 'Security Disabled - Data stored in plain text'),
}));

// Mock the SecurityContext module
vi.mock('@/contexts/SecurityContext', () => ({
  SecurityProvider: ({ children }: { children: React.ReactNode }) => children,
  useSecurity: () => mockUseSecurity(),
}));

// Mock SecurityUnlockBanner to render nothing when hasLockedData is false
vi.mock('@/components/security/SecurityUnlockBanner', () => ({
  default: () => null,
}));

describe('WeatherSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to default state before each test
    mockUseSecurity.mockReturnValue({
      isSecurityEnabled: false,
      hasLockedData: false,
      isInitialized: true,
      enableSecurity: vi.fn(),
      disableSecurity: vi.fn(),
      unlockSecurity: vi.fn(),
      lockSecurity: vi.fn(),
      encryptData: vi.fn(),
      decryptData: vi.fn(),
      getSecurityStatus: vi.fn(() => 'Security Disabled - Data stored in plain text'),
    });
  });

  const defaultProps = {
    zipCode: '90210',
    onZipCodeChange: vi.fn(),
    weatherApiKey: 'test-key',
    onWeatherApiKeyChange: vi.fn(),
  };

  const renderWithProviders = async (component: React.ReactElement) => {
    let result: ReturnType<typeof render>;
    await act(async () => {
      result = render(component, { wrapper: AllTheProviders });
    });
    return result!;
  };

  it('should render weather settings form', async () => {
    const result = await renderWithProviders(<WeatherSettings {...defaultProps} />);
    
    console.log('WeatherSettings test - DOM content:', result.container.innerHTML);

    // Check for the actual label text that exists in the component
    expect(screen.getByLabelText(/OpenWeatherMap API Key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Zip Code/i)).toBeInTheDocument();
  });

  it('should call onZipCodeChange when zip code is updated', async () => {
    const onZipCodeChange = vi.fn();
    await renderWithProviders(<WeatherSettings {...defaultProps} onZipCodeChange={onZipCodeChange} />);

    const zipInput = screen.getByLabelText(/Zip Code/i);
    fireEvent.change(zipInput, { target: { value: '12345' } });

    expect(onZipCodeChange).toHaveBeenCalledWith('12345');
  });

  it('should call onWeatherApiKeyChange when API key is updated', async () => {
    const onWeatherApiKeyChange = vi.fn();
    await renderWithProviders(<WeatherSettings {...defaultProps} onWeatherApiKeyChange={onWeatherApiKeyChange} />);

    const apiKeyInput = screen.getByLabelText(/OpenWeatherMap API Key/i);
    fireEvent.change(apiKeyInput, { target: { value: 'new-key' } });

    expect(onWeatherApiKeyChange).toHaveBeenCalledWith('new-key');
  });

  it('should display security notice when security is disabled', async () => {
    await renderWithProviders(<WeatherSettings {...defaultProps} />);

    // Look for the actual text that appears in the security notice
    expect(screen.getByText(/Security Notice/i)).toBeInTheDocument();
    expect(screen.getByText(/unencrypted/i)).toBeInTheDocument();
  });
});
