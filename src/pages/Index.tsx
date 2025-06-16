
import React, { useState, useEffect, useMemo } from 'react';
import Calendar from '@/components/Calendar';
import WeatherWidget from '@/components/WeatherWidget';
import SettingsModal from '@/components/SettingsModal';
import UserProfileDropdown from '@/components/UserProfileDropdown';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/contexts/SettingsContext';
import { getImagesFromAlbum, getDefaultBackgroundImages } from '@/utils/googlePhotosUtils';

const Index = () => {
  const [currentBg, setCurrentBg] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [backgroundImages, setBackgroundImages] = useState<string[]>(getDefaultBackgroundImages());
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, loading } = useAuth();
  const { backgroundDuration, publicAlbumUrl } = useSettings();

  // Real-time clock update
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(clockInterval);
  }, []);

  // Load images from album URL or use defaults
  useEffect(() => {
    const loadBackgroundImages = async () => {
      if (publicAlbumUrl) {
        try {
          const albumImages = await getImagesFromAlbum(publicAlbumUrl);
          if (albumImages.length > 0) {
            setBackgroundImages(albumImages);
            setCurrentBg(0); // Reset to first image when album changes
          } else {
            setBackgroundImages(getDefaultBackgroundImages());
          }
        } catch (error) {
          console.error('Failed to load album images:', error);
          // Fall back to default images
          setBackgroundImages(getDefaultBackgroundImages());
        }
      } else {
        setBackgroundImages(getDefaultBackgroundImages());
      }
    };

    loadBackgroundImages();
  }, [publicAlbumUrl]);

  // Background rotation effect
  useEffect(() => {
    if (backgroundImages.length === 0) return;

    const intervalTime = backgroundDuration * 60 * 1000; // Convert minutes to milliseconds
    
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgroundImages.length);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [backgroundDuration, backgroundImages.length]);

  // Memoize background style to prevent unnecessary re-renders
  const backgroundStyle = useMemo(() => ({
    backgroundImage: `url(${backgroundImages[currentBg]})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }), [backgroundImages, currentBg]);

  // Memoize formatted date and time to reduce calculations
  const formattedDateTime = useMemo(() => {
    const dateString = currentTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    const timeString = currentTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit'
    });
    return `${dateString} at ${timeString}`;
  }, [currentTime]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background Image */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
        style={backgroundStyle}
      />
      
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] dark:bg-black/20" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header with gradient overlay */}
        <header className="relative flex items-center justify-between p-6">
          {/* Header gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-white">Family Calendar</h1>
            <p className="text-sm text-white/90">{formattedDateTime}</p>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <WeatherWidget />
            <UserProfileDropdown />
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 pb-6 flex-1 flex flex-col">
          <div className="flex-1">
            <Calendar />
          </div>
        </main>
      </div>

      {/* Settings Button - Fixed in lower right corner */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowSettings(true)}
        className="fixed bottom-6 right-6 z-20 text-white hover:bg-white/20 bg-black/20 backdrop-blur-sm border border-white/20"
      >
        <Settings className="h-4 w-4" />
      </Button>

      <SettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings}
      />
    </div>
  );
};

export default Index;
