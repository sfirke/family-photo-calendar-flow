
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

// Mock the SecurityUnlockBanner component with proper conditional rendering
vi.mock('@/components/security/SecurityUnlockBanner', () => ({
  default: ({ onUnlock }: { onUnlock?: () => void }) => {
    // Import the security context mock here instead of using vi.hoisted
    const { useSecurity } = require('@/contexts/SecurityContext');
    const { hasLockedData } = useSecurity();
    
    console.log('SecurityUnlockBanner mock - hasLockedData:', hasLockedData);
    
    if (!hasLockedData) {
      return null;
    }
    
    return (
      <div data-testid="security-unlock-banner">
        <h3>Encrypted Data Locked</h3>
        <p>Your encrypted data is locked</p>
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

  it('should render weather settings form', async () => {
    const result = await render(<WeatherSettings {...defaultProps} />);
    
    console.log('WeatherSettings test - DOM content:', result.container.innerHTML);

    expect(screen.getByLabelText(/openweathermap api key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
  });

  it('should call onZipCodeChange when zip code is updated', async () => {
    const onZipCodeChange = vi.fn();
    await render(<WeatherSettings {...defaultProps} onZipCodeChange={onZipCodeChange} />);

    const zipInput = screen.getByLabelText(/zip code/i);
    fireEvent.change(zipInput, { target: { value: '12345' } });

    expect(onZipCodeChange).toHaveBeenCalledWith('12345');
  });

  it('should call onWeatherApiKeyChange when API key is updated', async () => {
    const onWeatherApiKeyChange = vi.fn();
    await render(<WeatherSettings {...defaultProps} onWeatherApiKeyChange={onWeatherApiKeyChange} />);

    const apiKeyInput = screen.getByLabelText(/openweathermap api key/i);
    fireEvent.change(apiKeyInput, { target: { value: 'new-key' } });

    expect(onWeatherApiKeyChange).toHaveBeenCalledWith('new-key');
  });

  it('should display security notice when security is disabled', async () => {
    await render(<WeatherSettings {...defaultProps} />);

    expect(screen.getByText(/security notice/i)).toBeInTheDocument();
    expect(screen.getByText(/unencrypted/i)).toBeInTheDocument();
  });
});
