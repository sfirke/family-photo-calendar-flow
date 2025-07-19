import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useWeather } from '@/contexts/WeatherContext';

interface WeatherProviderBadgeProps {
  className?: string;
}

export const WeatherProviderBadge = ({ className = '' }: WeatherProviderBadgeProps) => {
  const { weatherData, useEnhancedService } = useWeather();

  if (!weatherData || !useEnhancedService) {
    return null;
  }

  const provider = weatherData.provider;
  const forecastRange = weatherData.forecastRange;

  const getProviderDisplayName = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'openweathermap':
        return 'OpenWeather';
      case 'accuweather':
        return 'AccuWeather';
      default:
        return providerName;
    }
  };

  const getBadgeVariant = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'accuweather':
        return 'default';
      case 'openweathermap':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Badge 
      variant={getBadgeVariant(provider)} 
      className={`text-xs ${className}`}
    >
      {getProviderDisplayName(provider)}
      {forecastRange === 'monthly' && ' • 30d'}
      {forecastRange === 'weekly' && ' • 7d'}
    </Badge>
  );
};

export default WeatherProviderBadge;