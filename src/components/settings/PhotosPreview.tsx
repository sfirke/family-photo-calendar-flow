
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, AlertCircle, Images } from 'lucide-react';

interface PhotosPreviewProps {
  images: string[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  albumUrl: string;
}

const PhotosPreview = ({ images, isLoading, error, onRefresh, albumUrl }: PhotosPreviewProps) => {
  if (!albumUrl) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Images className="h-5 w-5" />
            Album Preview
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Photos from your album will appear here once you add a valid URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <p>No album URL provided</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Images className="h-5 w-5" />
          Album Preview
          <Button
            onClick={onRefresh}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="ml-auto border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          {images.length > 0 
            ? `${images.length} photos found in album`
            : 'Loading photos from your Google Photos album...'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-800 dark:text-red-200">Error loading photos</p>
                <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 text-gray-400 dark:text-gray-500 animate-spin" />
            <p className="text-gray-500 dark:text-gray-400">Loading photos from album...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <p>No photos found in the album</p>
            {error && <p className="text-sm mt-1">Please check the album URL and try again</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {images.slice(0, 12).map((imageUrl, index) => (
              <div key={index} className="aspect-square relative group overflow-hidden rounded-md">
                <img
                  src={imageUrl}
                  alt={`Album photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            ))}
            {images.length > 12 && (
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                +{images.length - 12} more
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhotosPreview;
