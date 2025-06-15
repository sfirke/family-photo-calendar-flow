
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Camera } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/contexts/SettingsContext';

const PhotosTab = () => {
  const { user } = useAuth();
  const { backgroundDuration, setBackgroundDuration } = useSettings();

  const formatDuration = (minutes: number) => {
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Background Photos</CardTitle>
          <CardDescription>
            Choose a Google Photos album for rotating background images
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="text-center py-8 text-gray-500">
              <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Photo album selection coming soon</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Connect your Google account to access photo albums</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Background Settings</CardTitle>
          <CardDescription>
            Configure how background images are displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="duration-slider">
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
            <div className="flex justify-between text-sm text-gray-500">
              <span>1 minute</span>
              <span>30 minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhotosTab;
