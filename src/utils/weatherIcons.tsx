import React from 'react';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  Snowflake, 
  Zap, 
  CloudSnow,
  CloudDrizzle,
  CloudLightning,
  Cloudy,
  Eye,
  Wind,
  CloudHail
} from 'lucide-react';

interface WeatherIconProps {
  size?: string;
  color?: string;
  className?: string;
}

export const getWeatherIcon = (condition: string, { size = "h-4 w-4", color, className = "" }: WeatherIconProps = {}) => {
  const iconProps = {
    className: `${size} ${className}`,
    style: color ? { color } : undefined
  };

  switch (condition.toLowerCase()) {
    // Clear/Sunny conditions
    case 'clear':
    case 'sunny':
    case 'hot':
      return <Sun {...iconProps} className={`${iconProps.className} text-yellow-400`} />;

    // Partly cloudy conditions  
    case 'partly cloudy':
    case 'mostly sunny':
    case 'partly sunny':
      return <Cloudy {...iconProps} className={`${iconProps.className} text-yellow-300`} />;

    // Cloudy conditions
    case 'cloudy':
    case 'mostly cloudy':
    case 'overcast':
      return <Cloud {...iconProps} className={`${iconProps.className} text-gray-400`} />;

    // Rain conditions
    case 'rain':
    case 'rainy':
    case 'showers':
    case 'light rain':
    case 'moderate rain':
    case 'heavy rain':
      return <CloudRain {...iconProps} className={`${iconProps.className} text-blue-500`} />;

    // Drizzle conditions
    case 'drizzle':
    case 'light drizzle':
    case 'mist':
      return <CloudDrizzle {...iconProps} className={`${iconProps.className} text-blue-300`} />;

    // Snow conditions
    case 'snow':
    case 'snowy':
    case 'light snow':
    case 'moderate snow':
    case 'heavy snow':
    case 'blizzard':
      return <Snowflake {...iconProps} className={`${iconProps.className} text-blue-200`} />;

    // Mixed precipitation
    case 'sleet':
    case 'freezing rain':
    case 'ice':
      return <CloudSnow {...iconProps} className={`${iconProps.className} text-cyan-300`} />;

    // Thunderstorm conditions
    case 'thunderstorm':
    case 'thunderstorms':
    case 'severe thunderstorm':
    case 'storm':
      return <CloudLightning {...iconProps} className={`${iconProps.className} text-purple-400`} />;

    // Hail
    case 'hail':
      return <CloudHail {...iconProps} className={`${iconProps.className} text-gray-300`} />;

    // Fog conditions
    case 'fog':
    case 'foggy':
    case 'haze':
    case 'hazy':
      return <Eye {...iconProps} className={`${iconProps.className} text-gray-500`} />;

    // Windy conditions
    case 'windy':
    case 'breezy':
      return <Wind {...iconProps} className={`${iconProps.className} text-gray-400`} />;

    // Default fallback
    default:
      return <Sun {...iconProps} className={`${iconProps.className} text-yellow-400`} />;
  }
};

// Enhanced mapping for AccuWeather specific conditions
export const mapAccuWeatherCondition = (accuWeatherCondition: string): string => {
  const condition = accuWeatherCondition.toLowerCase();
  
  // Clear/Sunny
  if (condition.includes('sunny') || condition.includes('clear') || condition.includes('hot')) return 'Clear';
  
  // Partly cloudy variations
  if (condition.includes('partly cloudy') || condition.includes('mostly sunny') || condition.includes('partly sunny')) return 'Partly Cloudy';
  
  // Cloudy variations
  if (condition.includes('mostly cloudy') || condition.includes('overcast')) return 'Mostly Cloudy';
  if (condition.includes('cloud')) return 'Cloudy';
  
  // Rain variations
  if (condition.includes('heavy rain')) return 'Heavy Rain';
  if (condition.includes('light rain')) return 'Light Rain';
  if (condition.includes('rain') || condition.includes('shower')) return 'Rain';
  
  // Drizzle
  if (condition.includes('drizzle') || condition.includes('mist')) return 'Drizzle';
  
  // Snow variations
  if (condition.includes('heavy snow') || condition.includes('blizzard')) return 'Heavy Snow';
  if (condition.includes('light snow')) return 'Light Snow';
  if (condition.includes('snow')) return 'Snow';
  
  // Mixed precipitation
  if (condition.includes('sleet') || condition.includes('freezing rain') || condition.includes('ice')) return 'Sleet';
  
  // Thunderstorms
  if (condition.includes('severe thunderstorm')) return 'Severe Thunderstorm';
  if (condition.includes('storm') || condition.includes('thunder')) return 'Thunderstorm';
  
  // Hail
  if (condition.includes('hail')) return 'Hail';
  
  // Fog
  if (condition.includes('fog') || condition.includes('haze')) return 'Fog';
  
  // Wind
  if (condition.includes('windy') || condition.includes('breezy')) return 'Windy';
  
  return 'Clear'; // Default fallback
};

// National Weather Service condition mapping
export const mapNWSCondition = (condition: string): string => {
  const normalizedCondition = condition.toLowerCase();
  
  // National Weather Service condition mapping
  if (normalizedCondition.includes('sunny') || normalizedCondition.includes('clear')) return 'Clear';
  if (normalizedCondition.includes('fair')) return 'Clear';
  if (normalizedCondition.includes('partly cloudy') || normalizedCondition.includes('partly sunny')) return 'Partly Cloudy';
  if (normalizedCondition.includes('mostly cloudy') || normalizedCondition.includes('mostly sunny')) return 'Partly Cloudy';
  if (normalizedCondition.includes('cloudy') || normalizedCondition.includes('overcast')) return 'Cloudy';
  if (normalizedCondition.includes('rain') || normalizedCondition.includes('showers')) return 'Rain';
  if (normalizedCondition.includes('light rain') || normalizedCondition.includes('chance rain')) return 'Drizzle';
  if (normalizedCondition.includes('thunderstorm') || normalizedCondition.includes('thunder')) return 'Thunderstorm';
  if (normalizedCondition.includes('snow') || normalizedCondition.includes('flurries')) return 'Snow';
  if (normalizedCondition.includes('fog') || normalizedCondition.includes('mist') || normalizedCondition.includes('haze')) return 'Fog';
  if (normalizedCondition.includes('windy') || normalizedCondition.includes('breezy')) return 'Wind';
  if (normalizedCondition.includes('drizzle')) return 'Drizzle';
  if (normalizedCondition.includes('sleet') || normalizedCondition.includes('ice')) return 'Snow';
  
  // Default fallback
  return 'Clear';
};