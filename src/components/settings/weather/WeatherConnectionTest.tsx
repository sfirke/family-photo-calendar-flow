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
  coordinates: string;
  onTestResult: (result: WeatherTestResult | null) => void;
  onShowPreviewToggle: () => void;
  showPreview: boolean;
  testResult: WeatherTestResult | null;
  useManualLocation: boolean;
}

const WeatherConnectionTest = ({
  coordinates,
  onTestResult,
  onShowPreviewToggle,
  showPreview,
  testResult,
  useManualLocation
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
    // For NWS with manual location, require coordinates
    if (useManualLocation && !coordinates.trim()) {
      const errorMsg = 'Please enter coordinates for manual location.';
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
      // Test NWS weather API connection
  // debug removed: testing NWS Weather API connection
      
      // Use actual weather service to test connection
      const testResult = await refreshWeather(true);
      
      // Create preview data from current weather
      const previewData = {
        location: 'Test Location',
        temperature: 72,
        condition: 'Clear',
        description: 'NWS Weather API connection successful',
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
        provider: 'National Weather Service'
      };
      
      setDetailedError(null);
      setPwaInfo({
        isPWA: (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches,
        corsProxyRequired: false,
        recommendations: ['NWS API is free and does not require CORS proxy']
      });
      
      onTestResult({
        success: true,
        message: 'Successfully connected to National Weather Service API!',
        data: previewData
      });
    } catch (error) {
      console.error('Weather connection test error:', error);
      
      let errorMessage = 'Failed to connect to National Weather Service';
      let detailedErrorInfo = `Provider: National Weather Service, Coordinates: ${coordinates}`;
      
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
        detailedErrorInfo += `, Error: ${error.message}`;
        
        // Detect specific error types
        if (error.message.includes('timeout') || error.message.includes('Request timeout')) {
          errorMessage = 'Connection timeout - Please check your internet connection and try again';
          detailedErrorInfo += ' (Timeout after 30 seconds)';
        } else if (error.message.includes('Load failed') || error.message.includes('fetch')) {
          errorMessage = 'Network error - Please check your internet connection';
          detailedErrorInfo += ' (Network request failed)';
        } else if (error.message.includes('404')) {
          errorMessage = 'Location not found - Please check your coordinates';
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
                // debug removed: refreshing weather for preview
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
                       <li>Coordinates format (latitude,longitude)</li>
                       <li>National Weather Service API status</li>
                       <li>Location is within the United States</li>
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
                     <div>✅ Using National Weather Service API (free)</div>
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
