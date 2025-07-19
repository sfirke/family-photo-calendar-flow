import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Key, Eye, ChevronDown, ChevronUp } from 'lucide-react';
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
  useManualLocation: boolean;
  locationKey: string;
  onLocationKeyChange: (key: string) => void;
}

const WeatherConnectionTest = ({
  zipCode,
  weatherApiKey,
  onTestResult,
  onShowPreviewToggle,
  showPreview,
  testResult,
  useManualLocation,
  locationKey,
  onLocationKeyChange
}: WeatherConnectionTestProps) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const { refreshWeather } = useWeather();

  const handleTestConnection = async () => {
    if (!weatherApiKey.trim()) {
      const errorMsg = 'Please enter an API key before testing.';
      setDetailedError(errorMsg);
      onTestResult({
        success: false,
        message: errorMsg
      });
      return;
    }

    // For AccuWeather with manual location, require zip code
    if (useManualLocation && !zipCode.trim()) {
      const errorMsg = 'Please enter a zip code for manual location.';
      setDetailedError(errorMsg);
      onTestResult({
        success: false,
        message: errorMsg
      });
      return;
    }

    setIsTestingConnection(true);
    setDetailedError(null);
    setShowErrorDetails(false);
    onTestResult(null);

    // Create a timeout promise to detect slow connections
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout - Connection took longer than 30 seconds')), 30000);
    });

    try {
      
      // Use AccuWeather provider directly
      const { AccuWeatherProvider } = await import('@/services/weatherProviders/accuWeatherProvider');
      const provider = new AccuWeatherProvider();
      
      // For automatic location, don't send zip code (use IP detection)
      const testZipCode = useManualLocation ? zipCode : '';
      
      
      const fetchPromise = provider.fetchWeather(testZipCode, {
        apiKey: weatherApiKey,
        baseUrl: '', // Provider will use their own base URL
        rateLimit: 60, // Default rate limit
        maxForecastDays: 15
      });
      const weatherData = await Promise.race([fetchPromise, timeoutPromise]) as Awaited<typeof fetchPromise>;
      
      // Check if we got mock data (indicates API failure)
      if (weatherData.location === 'Location not found') {
        const errorDetails = `Provider: AccuWeather, API Key: ${weatherApiKey.substring(0, 8)}..., Location: ${zipCode || 'IP-based'}, Error: Mock data returned - API call failed`;
        setDetailedError(errorDetails);
        onTestResult({
          success: false,
          message: 'API key or location is invalid. Please check your credentials.'
        });
      } else {
        setDetailedError(null);
        onTestResult({
          success: true,
          message: `Successfully connected! Location: ${weatherData.location} (AccuWeather)`,
          data: weatherData
        });
        
        // Refresh weather data in the main app after successful test
        refreshWeather();
      }
    } catch (error) {
      console.error('Weather connection test error:', error);
      
      let errorMessage = 'Failed to connect to weather service';
      let detailedErrorInfo = `Provider: AccuWeather, API Key: ${weatherApiKey.substring(0, 8)}...`;
      
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
        detailedErrorInfo += `, Error: ${error.message}`;
        
        // Detect specific error types
        if (error.message.includes('timeout') || error.message.includes('Request timeout')) {
          errorMessage = 'Connection timeout - Please check your internet connection and try again';
          detailedErrorInfo += ' (Timeout after 30 seconds)';
        } else if (error.message.includes('Load failed') || error.message.includes('fetch')) {
          errorMessage = 'Network error - Unable to reach weather service';
          detailedErrorInfo += ' (Network request failed - possible CORS or connectivity issue)';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Invalid API key - Please check your credentials';
          detailedErrorInfo += ' (401 Unauthorized)';
        } else if (error.message.includes('404')) {
          errorMessage = 'Location not found - Please check your zip code';
          detailedErrorInfo += ' (404 Not Found)';
        }
      } else {
        errorMessage += ': Unknown error';
        detailedErrorInfo += ', Error: Unknown error type';
      }
      
      setDetailedError(detailedErrorInfo);
      onTestResult({
        success: false,
        message: errorMessage
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
        <div className="space-y-2">
          <Alert className={testResult.success ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            <AlertDescription className={testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
              <div className="flex items-center justify-between">
                <span>{testResult.message}</span>
                {!testResult.success && detailedError && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowErrorDetails(!showErrorDetails)}
                    className="ml-2 h-6 px-2 text-xs"
                  >
                    {showErrorDetails ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Less Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        More Details
                      </>
                    )}
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
          
          {!testResult.success && detailedError && showErrorDetails && (
            <Alert className="bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700">
              <AlertDescription className="text-gray-700 dark:text-gray-300">
                <div className="space-y-1">
                  <div className="font-semibold text-sm">Detailed Error Information:</div>
                  <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded border">
                    {detailedError}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    If this error persists, please check:
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Your internet connection</li>
                      <li>API key validity and permissions</li>
                       <li>Provider service status</li>
                       <li>AccuWeather API rate limits</li>
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherConnectionTest;
