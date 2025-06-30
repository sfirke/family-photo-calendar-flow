
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from '@testing-library/react';
import WeatherSettings from '@/components/settings/weather/WeatherSettings';
import { AllTheProviders } from '../utils/testProviders';
import { mockSecurityContext } from '../utils/securityMocks';

// Use the standardized SecurityContext mock
mockSecurityContext();

// Mock SecurityUnlockBanner to render nothing when hasLockedData is false
vi.mock('@/components/security/SecurityUnlockBanner', () => ({
  default: () => null,
}));

// Mock all the individual hooks with complete exports
vi.mock('@/contexts/settings/useDisplaySettings', () => ({
  useDisplaySettings: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
    defaultView: 'month',
    setDefaultView: vi.fn(),
  })),
}));

vi.mock('@/contexts/settings/useWeatherSettings', () => ({
  useWeatherSettings: vi.fn(() => ({
    zipCode: '90210',
    setZipCode: vi.fn(),
    weatherApiKey: '',
    setWeatherApiKey: vi.fn(),
  })),
}));

vi.mock('@/contexts/settings/usePhotoSettings', () => ({
  usePhotoSettings: vi.fn(() => ({
    publicAlbumUrl: '',
    setPublicAlbumUrl: vi.fn(),
    backgroundDuration: 30,
    setBackgroundDuration: vi.fn(),
    selectedAlbum: '',
    setSelectedAlbum: vi.fn(),
  })),
}));

vi.mock('@/contexts/settings/useGitHubSettings', () => ({
  useGitHubSettings: vi.fn(() => ({
    githubOwner: '',
    setGithubOwner: vi.fn(),
    githubRepo: '',
    setGithubRepo: vi.fn(),
  })),
}));

vi.mock('@/contexts/settings/useSettingsInitialization', () => ({
  useSettingsInitialization: vi.fn(),
}));

// Mock ThemeContext
vi.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
  })),
}));

// Mock WeatherContext
vi.mock('@/contexts/WeatherContext', () => ({
  WeatherProvider: ({ children }: { children: React.ReactNode }) => children,
  useWeather: vi.fn(() => ({
    weatherData: null,
    isLoading: false,
    error: null,
    refreshWeather: vi.fn(),
  })),
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
