import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Key, Eye } from 'lucide-react';
import { enhancedWeatherService } from '@/services/enhancedWeatherService';
import { useWeather } from '@/contexts/WeatherContext';
import { useWeatherSettings } from '@/contexts/settings/useWeatherSettings';
import { WeatherTestResult } from '@/types/weather';

interface WeatherConnectionTestProps {
  zipCode: string;
  weatherApiKey: string;
  onTestResult: (result: WeatherTestResult | null) => void;
  onShowPreviewToggle: () => void;
  showPreview: boolean;
  testResult: WeatherTestResult | null;
}

const WeatherConnectionTest = ({
  zipCode,
  weatherApiKey,
  onTestResult,
  onShowPreviewToggle,
  showPreview,
  testResult
}: WeatherConnectionTestProps) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { refreshWeather } = useWeather();
  const { weatherProvider, useEnhancedService } = useWeatherSettings();

  const handleTestConnection = async () => {
    if (!weatherApiKey.trim()) {
      onTestResult({
        success: false,
        message: 'Please enter an API key before testing.'
      });
      return;
    }

    // For AccuWeather, zip code is optional when using IP-based location
    const isAccuWeather = weatherProvider === 'accuweather';
    if (!isAccuWeather && !zipCode.trim()) {
      onTestResult({
        success: false,
        message: 'Please enter a zip code before testing.'
      });
      return;
    }

    setIsTestingConnection(true);
    onTestResult(null);

    try {
      let weatherData;
      
      if (useEnhancedService) {
        // Use enhanced weather service
        const testResult = await enhancedWeatherService.testProvider({
          apiKey: weatherApiKey,
          zipCode: zipCode,
          provider: weatherProvider,
          forecastDays: 15
        });
        
        if (!testResult.success) {
          onTestResult({
            success: false,
            message: testResult.message
          });
          return;
        }
        
        weatherData = testResult.data!;
      } else {
        // Fall back to original weather service for OpenWeatherMap
        const { fetchWeatherData } = await import('@/services/weatherService');
        weatherData = await fetchWeatherData(zipCode, weatherApiKey);
      }
      
      // Check if we got mock data (indicates API failure)
      if (weatherData.location === 'Location not found') {
        onTestResult({
          success: false,
          message: 'API key or location is invalid. Please check your credentials.'
        });
      } else {
        onTestResult({
          success: true,
          message: `Successfully connected! Location: ${weatherData.location} (${weatherData.provider})`,
          data: weatherData
        });
        
        // Refresh weather data in the main app after successful test
        refreshWeather();
      }
    } catch (error) {
      console.error('Weather connection test error:', error);
      onTestResult({
        success: false,
        message: `Failed to connect to weather service: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={handleTestConnection}
          disabled={isTestingConnection}
          variant="outline"
          className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          {isTestingConnection ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Key className="h-4 w-4 mr-2" />
          )}
          {isTestingConnection ? 'Testing...' : 'Test Connection'}
        </Button>
        
        {testResult?.success && testResult.data && (
          <Button
            onClick={onShowPreviewToggle}
            variant="outline"
            className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        )}
      </div>

      {testResult && (
        <Alert className={testResult.success ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'}>
          {testResult.success ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          <AlertDescription className={testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
            {testResult.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default WeatherConnectionTest;
