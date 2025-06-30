
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWeatherData } from '@/services/weatherService';

// Mock the fetch function
global.fetch = vi.fn();

describe('weatherService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch weather data successfully', async () => {
    const mockWeatherResponse = {
      main: { temp: 75.2 },
      weather: [{ main: 'Clear', description: 'clear sky' }],
      name: 'Beverly Hills',
      sys: { country: 'US' }
    };

    const mockForecastResponse = {
      list: [
        {
          dt: Math.floor(Date.now() / 1000),
          main: { temp_max: 78, temp_min: 65 },
          weather: [{ main: 'Sunny', description: 'sunny' }],
          dt_txt: new Date().toISOString().split('T')[0]
        }
      ]
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWeatherResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockForecastResponse)
      });

    const result = await fetchWeatherData('90210', 'test-api-key');

    expect(result).toEqual({
      temperature: 75,
      condition: 'Clear',
      location: 'Beverly Hills, US',
      forecast: expect.any(Array)
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('API Error'));

    await expect(fetchWeatherData('90210', 'invalid-key')).rejects.toThrow();
  });
});
