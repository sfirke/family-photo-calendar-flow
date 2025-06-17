
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CloudSun, Info, Key, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import { fetchWeatherData } from '@/services/weatherService';

interface WeatherTabProps {
  zipCode: string;
  onZipCodeChange: (zipCode: string) => void;
  weatherApiKey: string;
  onWeatherApiKeyChange: (apiKey: string) => void;
}

const WeatherTab = ({ zipCode, onZipCodeChange, weatherApiKey, onWeatherApiKeyChange }: WeatherTabProps) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleTestConnection = async () => {
    if (!weatherApiKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter an API key before testing.'
      });
      return;
    }

    if (!zipCode.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter a zip code before testing.'
      });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const weatherData = await fetchWeatherData(zipCode, weatherApiKey);
      
      // Check if we got mock data (indicates API failure)
      if (weatherData.location === 'Location not found') {
        setTestResult({
          success: false,
          message: 'API key or zip code is invalid. Please check your credentials.'
        });
      } else {
        setTestResult({
          success: true,
          message: `Successfully connected! Location: ${weatherData.location}`,
          data: weatherData
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to connect to weather service. Please check your API key and zip code.'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const formatCondition = (condition: string) => {
    return condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase();
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
          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-gray-700 dark:text-gray-300">OpenWeatherMap API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your OpenWeatherMap API key"
              value={weatherApiKey}
              onChange={(e) => onWeatherApiKeyChange(e.target.value)}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get a free API key from{' '}
              <a 
                href="https://openweathermap.org/api" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                OpenWeatherMap
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipcode" className="text-gray-700 dark:text-gray-300">Zip Code</Label>
            <Input
              id="zipcode"
              placeholder="Enter your zip code (e.g., 90210)"
              value={zipCode}
              onChange={(e) => onZipCodeChange(e.target.value)}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>

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
                onClick={() => setShowPreview(!showPreview)}
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

          {showPreview && testResult?.success && testResult.data && (
            <Card className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Weather Preview</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Current weather and 7-day forecast for {testResult.data.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Current Weather</h4>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {testResult.data.temperature}°F
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {formatCondition(testResult.data.condition)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">7-Day Forecast</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {testResult.data.forecast.slice(0, 7).map((day: any, index: number) => {
                        const date = new Date(day.date);
                        const isToday = index === 0;
                        return (
                          <div key={day.date} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {day.high || day.temp}°{day.low ? `/${day.low}°` : ''} {formatCondition(day.condition)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Alert className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              Weather data is provided by OpenWeatherMap API. The app displays current conditions 
              and 7-day forecasts including temperature and weather icons in calendar views.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-2 text-gray-900 dark:text-gray-100">Weather features:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Real-time current temperature and conditions</li>
              <li>7-day weather forecast for calendar views</li>
              <li>Weather icons in Month and Week calendar views</li>
              <li>Location-based weather using zip code</li>
              <li>Updates every 30 minutes for current weather</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherTab;
