
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { fetchWeatherData } from '@/services/weatherService';

interface WeatherConnectionTestProps {
  zipCode: string;
  onTestResult: (result: { success: boolean; message: string; data?: any }) => void;
  onShowPreviewToggle: () => void;
  showPreview: boolean;
  testResult: { success: boolean; message: string; data?: any } | null;
}

const WeatherConnectionTest = ({
  zipCode,
  onTestResult,
  onShowPreviewToggle,
  showPreview,
  testResult
}: WeatherConnectionTestProps) => {
  const [isTesting, setIsTesting] = useState(false);

  const testConnection = async () => {
    if (!zipCode.trim()) {
      onTestResult({
        success: false,
        message: 'Please enter a zip code first'
      });
      return;
    }

    setIsTesting(true);
    
    try {
      console.log('Testing weather connection...');
      const weatherData = await fetchWeatherData(zipCode);
      
      if (weatherData.location === 'Location not found') {
        onTestResult({
          success: false,
          message: 'Could not find weather data for the provided zip code. Please check your zip code and try again.'
        });
      } else {
        onTestResult({
          success: true,
          message: `Successfully connected! Found weather data for ${weatherData.location}`,
          data: weatherData
        });
      }
    } catch (error) {
      console.error('Weather connection test failed:', error);
      onTestResult({
        success: false,
        message: 'Connection test failed. Please check your zip code and try again.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={testConnection}
          disabled={isTesting || !zipCode.trim()}
          className="flex items-center gap-2"
          variant="outline"
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          {isTesting ? 'Testing Connection...' : 'Test Weather Connection'}
        </Button>

        {testResult?.success && (
          <Button
            onClick={onShowPreviewToggle}
            variant="outline"
            className="flex items-center gap-2"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show Preview
              </>
            )}
          </Button>
        )}
      </div>

      {testResult && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          testResult.success 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          {testResult.success ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <span className="text-sm">{testResult.message}</span>
        </div>
      )}
    </div>
  );
};

export default WeatherConnectionTest;
