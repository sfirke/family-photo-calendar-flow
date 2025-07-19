import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudSun } from 'lucide-react';
import { useSecurity } from '@/contexts/SecurityContext';
import { useWeatherSettings } from '@/contexts/settings/useWeatherSettings';
import WeatherSettings from './weather/WeatherSettings';
import WeatherConnectionTest from './weather/WeatherConnectionTest';
import WeatherPreview from './weather/WeatherPreview';
import WeatherInfo from './weather/WeatherInfo';
import { WeatherTestResult } from '@/types/weather';

const WeatherTab = () => {
  const [testResult, setTestResult] = useState<WeatherTestResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [useManualLocation, setUseManualLocation] = useState(false);
  const { isSecurityEnabled, hasLockedData } = useSecurity();
  const {
    zipCode,
    setZipCode,
    weatherApiKey,
    setWeatherApiKey,
    locationKey,
    setLocationKey
  } = useWeatherSettings();

  // Clear test results when security state changes to force re-testing with new data
  useEffect(() => {
    setTestResult(null);
    setShowPreview(false);
  }, [isSecurityEnabled, hasLockedData]);

  const handleSecurityUnlock = () => {
    
    // Force a refresh of the test results when security is unlocked
    setTestResult(null);
    setShowPreview(false);
    // Force a re-render by updating state
    setTimeout(() => {
      // This ensures the component re-renders after the security context updates
    }, 100);
  };

  

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <CloudSun className="h-5 w-5" />
            Weather Settings
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Configure weather display for your location using real-time weather data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <WeatherSettings
            zipCode={zipCode}
            onZipCodeChange={setZipCode}
            weatherApiKey={weatherApiKey}
            onWeatherApiKeyChange={setWeatherApiKey}
            onSecurityUnlock={handleSecurityUnlock}
            onUseManualLocationChange={setUseManualLocation}
          />

          <WeatherConnectionTest
            zipCode={zipCode}
            weatherApiKey={weatherApiKey}
            onTestResult={setTestResult}
            onShowPreviewToggle={() => setShowPreview(!showPreview)}
            showPreview={showPreview}
            testResult={testResult}
            useManualLocation={useManualLocation}
            locationKey={locationKey}
            onLocationKeyChange={setLocationKey}
          />

          {showPreview && testResult?.success && testResult.data && (
            <WeatherPreview weatherData={testResult.data} />
          )}

          <WeatherInfo />
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherTab;
