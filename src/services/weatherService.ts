
const OPENWEATHER_API_KEY = 'your_api_key_here'; // This should be replaced with actual API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
  forecast: Array<{
    date: string;
    temp: number;
    condition: string;
  }>;
}

export const fetchWeatherData = async (zipCode: string): Promise<WeatherData> => {
  try {
    // Current weather
    const currentResponse = await fetch(
      `${BASE_URL}/weather?zip=${zipCode}&appid=${OPENWEATHER_API_KEY}&units=imperial`
    );
    
    if (!currentResponse.ok) {
      throw new Error('Weather API request failed');
    }
    
    const currentData = await currentResponse.json();
    
    // 5-day forecast
    const forecastResponse = await fetch(
      `${BASE_URL}/forecast?zip=${zipCode}&appid=${OPENWEATHER_API_KEY}&units=imperial`
    );
    
    const forecastData = await forecastResponse.json();
    
    // Process forecast data (get daily forecasts)
    const dailyForecasts = forecastData.list
      .filter((_: any, index: number) => index % 8 === 0) // Every 8th item (24 hours)
      .slice(0, 7) // Next 7 days
      .map((item: any) => ({
        date: new Date(item.dt * 1000).toISOString().split('T')[0],
        temp: Math.round(item.main.temp),
        condition: getWeatherCondition(item.weather[0].main)
      }));
    
    return {
      temperature: Math.round(currentData.main.temp),
      condition: getWeatherCondition(currentData.weather[0].main),
      location: `${currentData.name}, ${currentData.sys.country}`,
      forecast: dailyForecasts
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    // Return mock data as fallback
    return {
      temperature: 75,
      condition: 'Sunny',
      location: 'Location not found',
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        temp: 75,
        condition: 'Sunny'
      }))
    };
  }
};

const getWeatherCondition = (main: string): string => {
  switch (main.toLowerCase()) {
    case 'clear':
      return 'Sunny';
    case 'clouds':
      return 'Cloudy';
    case 'rain':
    case 'drizzle':
      return 'Rainy';
    case 'snow':
      return 'Snowy';
    case 'thunderstorm':
      return 'Rainy';
    default:
      return 'Sunny';
  }
};
