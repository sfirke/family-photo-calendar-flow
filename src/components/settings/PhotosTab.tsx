
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const PhotosTab = () => {
  const { user } = useAuth();

  return (
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
  );
};

export default PhotosTab;
