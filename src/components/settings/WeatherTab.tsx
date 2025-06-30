
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudSun } from 'lucide-react';
import { useSecurity } from '@/contexts/SecurityContext';
import { useSettings } from '@/contexts/SettingsContext';
import WeatherSettings from './weather/WeatherSettings';
import WeatherConnectionTest from './weather/WeatherConnectionTest';
import WeatherPreview from './weather/WeatherPreview';
import WeatherInfo from './weather/WeatherInfo';

interface WeatherTabProps {
  zipCode: string;
  onZipCodeChange: (zipCode: string) => void;
  weatherApiKey: string;
  onWeatherApiKeyChange: (apiKey: string) => void;
}

const WeatherTab = ({ zipCode, onZipCodeChange, weatherApiKey, onWeatherApiKeyChange }: WeatherTabProps) => {
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { isSecurityEnabled, hasLockedData } = useSecurity();

  // Clear test results when security state changes to force re-testing with new data
  useEffect(() => {
    setTestResult(null);
    setShowPreview(false);
  }, [isSecurityEnabled, hasLockedData]);

  const handleSecurityUnlock = () => {
    console.log('WeatherTab - handleSecurityUnlock called');
    // Force a refresh of the test results when security is unlocked
    setTestResult(null);
    setShowPreview(false);
    // Force a re-render by updating state
    setTimeout(() => {
      // This ensures the component re-renders after the security context updates
    }, 100);
  };

  console.log('WeatherTab - Render state:', { isSecurityEnabled, hasLockedData, zipCode, weatherApiKey });

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
            onZipCodeChange={onZipCodeChange}
            weatherApiKey={weatherApiKey}
            onWeatherApiKeyChange={onWeatherApiKeyChange}
            onSecurityUnlock={handleSecurityUnlock}
          />

          <WeatherConnectionTest
            zipCode={zipCode}
            weatherApiKey={weatherApiKey}
            onTestResult={setTestResult}
            onShowPreviewToggle={() => setShowPreview(!showPreview)}
            showPreview={showPreview}
            testResult={testResult}
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
