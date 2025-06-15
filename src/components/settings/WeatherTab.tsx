
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CloudSun, Info } from 'lucide-react';

interface WeatherTabProps {
  zipCode: string;
  onZipCodeChange: (zipCode: string) => void;
}

const WeatherTab = ({ zipCode, onZipCodeChange }: WeatherTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudSun className="h-5 w-5" />
          Weather Settings
        </CardTitle>
        <CardDescription>
          Configure weather display for your location using real-time weather data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="zipcode">Zip Code</Label>
          <Input
            id="zipcode"
            placeholder="Enter your zip code (e.g., 90210)"
            value={zipCode}
            onChange={(e) => onZipCodeChange(e.target.value)}
          />
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Weather data is provided by OpenWeatherMap API. The app displays current conditions 
            and 7-day forecasts including temperature and weather icons in calendar views.
          </AlertDescription>
        </Alert>

        <div className="text-sm text-gray-600">
          <p className="font-medium mb-2">Weather features:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Real-time current temperature and conditions</li>
            <li>7-day weather forecast for calendar views</li>
            <li>Weather icons in Month and Week calendar views</li>
            <li>Location-based weather using zip code</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherTab;
