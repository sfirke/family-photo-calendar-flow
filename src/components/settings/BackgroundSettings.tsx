
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useSettings } from '@/contexts/SettingsContext';

const BackgroundSettings = () => {
  const { backgroundDuration, setBackgroundDuration } = useSettings();

  const formatDuration = (minutes: number) => {
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100">Background Settings</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Configure how background images are displayed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label htmlFor="duration-slider" className="text-gray-700 dark:text-gray-300">
            Background Duration: {formatDuration(backgroundDuration)}
          </Label>
          <Slider
            id="duration-slider"
            min={1}
            max={30}
            step={1}
            value={[backgroundDuration]}
            onValueChange={(value) => setBackgroundDuration(value[0])}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>1 minute</span>
            <span>30 minutes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackgroundSettings;
