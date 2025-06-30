
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../utils/testUtils';
import WeatherSettings from '@/components/settings/weather/WeatherSettings';

// Mock the security context with all exports
vi.mock('@/contexts/SecurityContext', () => ({
  SecurityProvider: ({ children }: { children: React.ReactNode }) => children,
  useSecurity: vi.fn(() => ({
    isSecurityEnabled: false,
    hasLockedData: false,
    isInitialized: true,
    enableSecurity: vi.fn(),
    disableSecurity: vi.fn(),
    unlockSecurity: vi.fn(),
    lockSecurity: vi.fn(),
    encryptData: vi.fn(),
    decryptData: vi.fn(),
    getSecurityStatus: vi.fn(() => 'Disabled'),
  })),
}));

// Mock the SecurityUnlockBanner component to conditionally render
vi.mock('@/components/security/SecurityUnlockBanner', () => ({
  default: ({ onUnlock }: { onUnlock?: () => void }) => {
    const { useSecurity } = vi.hoisted(() => ({
      useSecurity: vi.fn(() => ({
        hasLockedData: false,
      })),
    }));
    
    const { hasLockedData } = useSecurity();
    
    if (!hasLockedData) {
      return null;
    }
    
    return (
      <div data-testid="security-unlock-banner">
        {onUnlock && <button onClick={onUnlock}>Unlock</button>}
      </div>
    );
  },
}));

describe('WeatherSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    zipCode: '90210',
    onZipCodeChange: vi.fn(),
    weatherApiKey: 'test-key',
    onWeatherApiKeyChange: vi.fn(),
  };

  it('should render weather settings form', () => {
    render(<WeatherSettings {...defaultProps} />);

    expect(screen.getByLabelText(/openweathermap api key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
  });

  it('should call onZipCodeChange when zip code is updated', () => {
    const onZipCodeChange = vi.fn();
    render(<WeatherSettings {...defaultProps} onZipCodeChange={onZipCodeChange} />);

    const zipInput = screen.getByLabelText(/zip code/i);
    fireEvent.change(zipInput, { target: { value: '12345' } });

    expect(onZipCodeChange).toHaveBeenCalledWith('12345');
  });

  it('should call onWeatherApiKeyChange when API key is updated', () => {
    const onWeatherApiKeyChange = vi.fn();
    render(<WeatherSettings {...defaultProps} onWeatherApiKeyChange={onWeatherApiKeyChange} />);

    const apiKeyInput = screen.getByLabelText(/openweathermap api key/i);
    fireEvent.change(apiKeyInput, { target: { value: 'new-key' } });

    expect(onWeatherApiKeyChange).toHaveBeenCalledWith('new-key');
  });

  it('should display security notice when security is disabled', () => {
    render(<WeatherSettings {...defaultProps} />);

    expect(screen.getByText(/security notice/i)).toBeInTheDocument();
    expect(screen.getByText(/unencrypted/i)).toBeInTheDocument();
  });
});
