
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, AlertCircle, Images, Clock, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PhotosPreviewProps {
  images: string[];
  isLoading: boolean;
  error: string | null;
  lastFetch: Date | null;
  onRefresh: () => void;
  onClearCache: () => void;
}

const PhotosPreview = ({ images, isLoading, error, lastFetch, onRefresh, onClearCache }: PhotosPreviewProps) => {
  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Images className="h-5 w-5" />
          Album Preview
          <div className="ml-auto flex gap-2">
            <Button
              onClick={onClearCache}
              disabled={isLoading || images.length === 0}
              size="sm"
              variant="outline"
              className="border-red-300 dark:border-red-600 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
            <Button
              onClick={onRefresh}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          {images.length > 0 
            ? `${images.length} photos loaded${lastFetch ? ` • Last updated ${formatDistanceToNow(lastFetch, { addSuffix: true })}` : ''}`
            : 'Loading photos from your Google Photos album...'
          }
          {lastFetch && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              <span>Photos are cached locally and refresh daily</span>
            </div>
          )}
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
          <div className="space-y-4">
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
            
            <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Photos cached successfully!</strong> These images are randomized and stored locally. 
                They will automatically refresh daily to show new photos from your album.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhotosPreview;
