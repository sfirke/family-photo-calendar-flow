import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Key, Eye, ChevronDown, ChevronUp, Smartphone } from 'lucide-react';
import { enhancedWeatherService } from '@/services/enhancedWeatherService';
import { useWeather } from '@/contexts/WeatherContext';
import { useWeatherSettings } from '@/contexts/settings/useWeatherSettings';
import { WeatherTestResult } from '@/types/weather';
import { PWAWeatherTestService } from '@/utils/weather/pwaTestService';

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
  const [pwaInfo, setPwaInfo] = useState<{
    isPWA: boolean;
    corsProxyRequired: boolean;
    recommendations: string[];
  } | null>(null);
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
      // Run PWA-specific comprehensive test
      const environmentInfo = PWAWeatherTestService.getEnvironmentInfo();
      console.log('PWA Environment Info:', environmentInfo);
      
      const pwaTestResult = await Promise.race([
        PWAWeatherTestService.testWeatherConnectivity(weatherApiKey),
        timeoutPromise
      ]) as Awaited<ReturnType<typeof PWAWeatherTestService.testWeatherConnectivity>>;
      
      console.log('PWA Test Results:', pwaTestResult);
      
      // Set PWA information
      setPwaInfo({
        isPWA: environmentInfo.isPWA,
        corsProxyRequired: pwaTestResult.summary.corsProxyRequired,
        recommendations: pwaTestResult.summary.recommendations
      });
      
      if (pwaTestResult.ipLocation.success) {
        // Get the weather data from IP location result
        const locationData = pwaTestResult.ipLocation.data;
        const method = pwaTestResult.ipLocation.method;
        
        // Check if current conditions or forecast failed
        const hasPartialFailure = !pwaTestResult.currentConditions.success || !pwaTestResult.forecast.success;
        
        // Transform the raw API data into the expected WeatherData format for preview
        const previewData = locationData ? {
          location: locationData.LocalizedName || 'Unknown Location',
          temperature: 72, // Mock temperature since location API doesn't provide it
          condition: 'Clear',
          description: 'Weather data connection successful',
          humidity: 50,
          windSpeed: 5,
          forecast: [
            {
              date: new Date().toISOString().split('T')[0],
              high: 75,
              low: 65,
              condition: 'Sunny'
            }
          ],
          lastUpdated: new Date().toISOString(),
          provider: 'AccuWeather'
        } : null;
        
        setDetailedError(null);
        
        let message = `Successfully connected! Location: ${locationData?.LocalizedName || 'Unknown'} ${method === 'proxy' ? '(via CORS proxy)' : '(direct access)'}`;
        if (hasPartialFailure) {
          const failedServices = [];
          if (!pwaTestResult.currentConditions.success) failedServices.push('current conditions');
          if (!pwaTestResult.forecast.success) failedServices.push('forecast');
          message += ` (Warning: ${failedServices.join(' and ')} may have limited data)`;
        }
        
        onTestResult({
          success: true,
          message,
          data: previewData
        });
        
        // Force refresh weather data in the main app after successful test
        console.log('WeatherConnectionTest - Triggering main app weather refresh');
        await refreshWeather(true);
      } else {
        const failedTests = [];
        if (!pwaTestResult.ipLocation.success) failedTests.push('Location detection');
        if (!pwaTestResult.currentConditions.success) failedTests.push('Current conditions');
        if (!pwaTestResult.forecast.success) failedTests.push('Weather forecast');
        
        const errorDetails = `Provider: AccuWeather, API Key: ${weatherApiKey.substring(0, 8)}..., Environment: ${environmentInfo.isPWA ? 'PWA Mode' : 'Browser Mode'}, Failed: ${failedTests.join(', ')}, Error: ${pwaTestResult.ipLocation.error || 'API connection failed'}`;
        setDetailedError(errorDetails);
        onTestResult({
          success: false,
          message: `Connection test failed: ${failedTests.join(', ')}`
        });
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
        } else if (error.message.includes('Load failed') || error.message.includes('fetch') || error.message.includes('CORS')) {
          errorMessage = 'Network/CORS error - Using CORS proxy for PWA compatibility';
          detailedErrorInfo += ' (Network request failed - CORS proxy will be used automatically)';
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
            onClick={async () => {
              onShowPreviewToggle();
              // Also refresh weather data when showing preview
              if (!showPreview) {
                console.log('WeatherConnectionTest - Refreshing weather for preview');
                await refreshWeather(true);
              }
            }}
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
                       <li>PWA/iOS Safari compatibility (CORS proxy enabled automatically)</li>
                    </ul>
                   </div>
                </div>
              </AlertDescription>
            </Alert>
           )}
          
          {/* PWA-specific information */}
          {pwaInfo && (
            <Alert className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
              <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                <div className="space-y-2">
                  <div className="font-semibold text-sm">
                    {pwaInfo.isPWA ? '📱 PWA Mode Detected' : '🌐 Browser Mode'}
                  </div>
                  <div className="text-xs space-y-1">
                    {pwaInfo.corsProxyRequired && (
                      <div>✅ CORS proxy enabled for PWA compatibility</div>
                    )}
                    {pwaInfo.recommendations.map((rec, index) => (
                      <div key={index}>• {rec}</div>
                    ))}
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
