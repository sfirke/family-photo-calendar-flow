
import React from 'react';
import AlbumUrlInput from './AlbumUrlInput';
import BackgroundSettings from './BackgroundSettings';
import PhotosPreview from './PhotosPreview';
import { useSettings } from '@/contexts/SettingsContext';
import { useGooglePhotos } from '@/hooks/useGooglePhotos';

const PhotosTab = () => {
  const { publicAlbumUrl } = useSettings();
  const { images, isLoading, error, refreshPhotos } = useGooglePhotos(publicAlbumUrl);

  return (
    <div className="space-y-6">
      <AlbumUrlInput />
      <PhotosPreview 
        images={images}
        isLoading={isLoading}
        error={error}
        onRefresh={refreshPhotos}
        albumUrl={publicAlbumUrl}
      />
      <BackgroundSettings />
    </div>
  );
};

export default PhotosTab;
