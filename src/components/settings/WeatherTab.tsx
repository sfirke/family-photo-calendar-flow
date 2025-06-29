
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudSun, Shield, Key } from 'lucide-react';
import WeatherSettings from './weather/WeatherSettings';
import WeatherConnectionTest from './weather/WeatherConnectionTest';
import WeatherPreview from './weather/WeatherPreview';
import WeatherInfo from './weather/WeatherInfo';

interface WeatherTabProps {
  zipCode: string;
  onZipCodeChange: (zipCode: string) => void;
}

const WeatherTab = ({ zipCode, onZipCodeChange }: WeatherTabProps) => {
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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
          {/* Security Notice */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                  Secure Weather Integration
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Weather data is now fetched through a secure server-side proxy. 
                  Your API keys are safely stored on the server and never exposed to the browser.
                </p>
              </div>
            </div>
          </div>

          <WeatherSettings
            zipCode={zipCode}
            onZipCodeChange={onZipCodeChange}
          />

          <WeatherConnectionTest
            zipCode={zipCode}
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
