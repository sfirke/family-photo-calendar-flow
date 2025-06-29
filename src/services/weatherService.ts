
import { supabase } from '@/integrations/supabase/client';

const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
  forecast: Array<{
    date: string;
    temp: number;
    high?: number;
    low?: number;
    condition: string;
  }>;
}

export const fetchWeatherData = async (zipCode: string): Promise<WeatherData> => {
  if (!zipCode) {
    return getMockWeatherData();
  }

  try {
    console.log(`Fetching weather data for zip code: ${zipCode}`);
    
    // Fetch current weather through secure proxy
    const { data: currentData, error: currentError } = await supabase.functions.invoke('weather-proxy', {
      body: { zipCode, endpoint: 'current' }
    });

    if (currentError) {
      console.error('Current weather fetch error:', currentError);
      return getMockWeatherData();
    }

    if (!currentData || currentData.error) {
      console.error('Current weather API error:', currentData?.error);
      return getMockWeatherData();
    }

    // Fetch forecast through secure proxy
    const { data: forecastData, error: forecastError } = await supabase.functions.invoke('weather-proxy', {
      body: { zipCode, endpoint: 'forecast' }
    });

    if (forecastError) {
      console.error('Forecast fetch error:', forecastError);
      // Continue with current weather only
    }

    // Process forecast data if available
    let extendedForecast: Array<{date: string; temp: number; high?: number; low?: number; condition: string}> = [];
    
    if (forecastData && !forecastData.error && forecastData.list) {
      const dailyForecasts = processDailyForecasts(forecastData.list);
      extendedForecast = extendForecastData(dailyForecasts);
    } else {
      // Generate mock forecast based on current weather
      extendedForecast = generateMockForecast(currentData.main.temp, currentData.weather[0].main);
    }
    
    return {
      temperature: Math.round(currentData.main.temp),
      condition: getWeatherCondition(currentData.weather[0].main),
      location: `${currentData.name}, ${currentData.sys.country}`,
      forecast: extendedForecast
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return getMockWeatherData();
  }
};

const processDailyForecasts = (forecastList: any[]) => {
  // Group forecasts by date
  const dailyData: { [key: string]: any[] } = {};
  
  forecastList.forEach((item: any) => {
    const date = new Date(item.dt * 1000).toISOString().split('T')[0];
    if (!dailyData[date]) {
      dailyData[date] = [];
    }
    dailyData[date].push(item);
  });
  
  // Calculate daily highs, lows, and most common condition using temp_max and temp_min
  return Object.entries(dailyData).map(([date, items]) => {
    // Use temp_max and temp_min from the API response
    const maxTemps = items.map(item => item.main.temp_max);
    const minTemps = items.map(item => item.main.temp_min);
    
    const high = Math.round(Math.max(...maxTemps));
    const low = Math.round(Math.min(...minTemps));
    
    // Get most common weather condition for the day
    const conditions = items.map(item => item.weather[0].main);
    const conditionCounts = conditions.reduce((acc, condition) => {
      acc[condition] = (acc[condition] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonCondition = Object.entries(conditionCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0][0];
    
    return {
      date,
      temp: high, // Use high as the primary temp
      high,
      low,
      condition: getWeatherCondition(mostCommonCondition)
    };
  }).slice(0, 5); // API provides 5 days max
};

const extendForecastData = (apiForecast: Array<{date: string; temp: number; high?: number; low?: number; condition: string}>) => {
  if (apiForecast.length === 0) return [];
  
  const extended = [...apiForecast];
  const lastForecast = apiForecast[apiForecast.length - 1];
  const lastDate = new Date(lastForecast.date);
  
  // Calculate average temperatures from available data - ensure we're working with numbers
  const validHighs = apiForecast.map(f => f.high).filter((high): high is number => typeof high === 'number');
  const validLows = apiForecast.map(f => f.low).filter((low): low is number => typeof low === 'number');
  
  const avgHigh = validHighs.length > 0 ? Math.round(validHighs.reduce((sum, high) => sum + high, 0) / validHighs.length) : 75;
  const avgLow = validLows.length > 0 ? Math.round(validLows.reduce((sum, low) => sum + low, 0) / validLows.length) : 60;
  
  // Get most common condition
  const conditionCounts = apiForecast.reduce((acc, f) => {
    acc[f.condition] = (acc[f.condition] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostCommonCondition = Object.entries(conditionCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0][0];
  
  // Extend forecast for up to 14 days total
  for (let i = 1; i <= 9; i++) { // 5 + 9 = 14 days
    const extendedDate = new Date(lastDate);
    extendedDate.setDate(lastDate.getDate() + i);
    
    // Add some temperature variation (±5 degrees) - ensure all values are numbers
    const highVariation = Math.floor(Math.random() * 11) - 5; // -5 to +5
    const lowVariation = Math.floor(Math.random() * 11) - 5;
    const extendedHigh = Math.max(avgHigh + highVariation, 55); // Minimum 55°F
    const extendedLow = Math.max(avgLow + lowVariation, 45); // Minimum 45°F
    
    extended.push({
      date: extendedDate.toISOString().split('T')[0],
      temp: extendedHigh, // Use high as the primary temp
      high: extendedHigh,
      low: extendedLow,
      condition: mostCommonCondition
    });
  }
  
  return extended;
};

const generateMockForecast = (baseTemp: number, baseCondition: string) => {
  return Array.from({ length: 14 }, (_, i) => {
    const high = baseTemp + Math.floor(Math.random() * 11) - 5; // ±5°F variation
    const low = high - 10 - Math.floor(Math.random() * 6); // 10-15°F lower than high
    return {
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      temp: high,
      high,
      low,
      condition: getWeatherCondition(baseCondition)
    };
  });
};

const getMockWeatherData = (): WeatherData => {
  return {
    temperature: 75,
    condition: 'Sunny',
    location: 'Location not found',
    forecast: Array.from({ length: 14 }, (_, i) => {
      const high = 75 + Math.floor(Math.random() * 11) - 5; // 70-80°F range
      const low = high - 10 - Math.floor(Math.random() * 6); // 10-15°F lower than high
      return {
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        temp: high, // Use high as the primary temp
        high,
        low,
        condition: ['Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)]
      };
    })
  };
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
