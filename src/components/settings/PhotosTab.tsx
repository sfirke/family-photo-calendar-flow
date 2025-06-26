
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera } from 'lucide-react';
import BackgroundSettings from './BackgroundSettings';

const PhotosTab = () => {
  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Camera className="h-5 w-5" />
            Photo Settings
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Configure background photos and display settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BackgroundSettings />
        </CardContent>
      </Card>
    </div>
  );
};

export default PhotosTab;
