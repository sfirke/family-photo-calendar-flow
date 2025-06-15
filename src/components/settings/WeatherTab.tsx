
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WeatherTabProps {
  zipCode: string;
  onZipCodeChange: (zipCode: string) => void;
}

const WeatherTab = ({ zipCode, onZipCodeChange }: WeatherTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather Settings</CardTitle>
        <CardDescription>
          Configure weather display for your location
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="zipcode">Zip Code</Label>
          <Input
            id="zipcode"
            placeholder="Enter your zip code"
            value={zipCode}
            onChange={(e) => onZipCodeChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherTab;
