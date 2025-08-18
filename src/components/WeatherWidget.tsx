import React, { useState, useEffect } from 'react';
import { getWeatherIcon } from '@/utils/weatherIcons';
import { fetchWeatherData, WeatherData } from '@/services/weatherService';
import { useSettings } from '@/contexts/SettingsContext';
import { useWeather } from '@/contexts/WeatherContext';
const WeatherWidget = () => {
  const {
    getCurrentWeather,
    isLoading,
    refreshWeather
  } = useWeather();
  
  // Refresh weather data to get updated location name
  React.useEffect(() => {
    refreshWeather(true);
  }, [refreshWeather]);
  if (isLoading) {
    return <div className="flex items-center gap-3 text-white">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        <div>
          <div className="text-2xl font-light">--°F</div>
          <div className="text-sm text-white/70">Loading...</div>
        </div>
      </div>;
  }
  const currentWeather = getCurrentWeather();
  return <div className="flex items-center gap-3 text-white">
      {getWeatherIcon(currentWeather.condition, {
      size: "h-8 w-8"
    })}
      <div>
        <div className="text-6xl font-light">{currentWeather.temp}°F</div>
        <div className="text-sm text-white/70">
          {currentWeather.condition} • {currentWeather.location}
        </div>
      </div>
    </div>;
};
export default WeatherWidget;