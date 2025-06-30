
import { WeatherData, WeatherApiResponse, WeatherForecastResponse } from '@/types/weather';

const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

export const fetchWeatherData = async (zipCode: string, apiKey: string): Promise<WeatherData> => {
  if (!apiKey || !zipCode) {
    return getMockWeatherData();
  }

  try {
    // Fetch current weather
    const currentResponse = await fetch(
      `${WEATHER_API_BASE}/weather?zip=${zipCode}&appid=${apiKey}&units=imperial`
    );

    if (!currentResponse.ok) {
      console.error('Weather API error:', currentResponse.status);
      return getMockWeatherData();
    }

    const currentData: WeatherApiResponse = await currentResponse.json();

    // Fetch 5-day forecast
    const forecastResponse = await fetch(
      `${WEATHER_API_BASE}/forecast?zip=${zipCode}&appid=${apiKey}&units=imperial`
    );

    let forecastData: WeatherForecastResponse | null = null;
    if (forecastResponse.ok) {
      forecastData = await forecastResponse.json();
    }

    return {
      location: currentData.name || 'Unknown Location',
      temperature: Math.round(currentData.main.temp),
      condition: currentData.weather[0]?.main || 'Unknown',
      forecast: forecastData ? formatForecastData(forecastData) : []
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return getMockWeatherData();
  }
};

const formatForecastData = (data: WeatherForecastResponse) => {
  // Group by day and take one forecast per day
  const dailyForecasts = new Map();
  
  data.list.forEach((item: WeatherForecastResponse['list'][0]) => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toDateString();
    
    if (!dailyForecasts.has(dateKey)) {
      dailyForecasts.set(dateKey, {
        date: date.toISOString(),
        high: Math.round(item.main.temp_max),
        low: Math.round(item.main.temp_min),
        condition: item.weather[0]?.main || 'Unknown'
      });
    }
  });
  
  return Array.from(dailyForecasts.values()).slice(0, 7);
};

const getMockWeatherData = (): WeatherData => ({
  location: 'Location not found',
  temperature: 72,
  condition: 'Clear',
  forecast: [
    { date: new Date().toISOString(), temp: 75, condition: 'Sunny' },
    { date: new Date(Date.now() + 86400000).toISOString(), temp: 73, condition: 'Cloudy' },
    { date: new Date(Date.now() + 172800000).toISOString(), temp: 71, condition: 'Rainy' }
  ]
});
