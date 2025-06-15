
import React from 'react';
import AlbumUrlInput from './AlbumUrlInput';
import BackgroundSettings from './BackgroundSettings';

const PhotosTab = () => {
  return (
    <div className="space-y-6">
      <AlbumUrlInput />
      <BackgroundSettings />
    </div>
  );
};

export default PhotosTab;
