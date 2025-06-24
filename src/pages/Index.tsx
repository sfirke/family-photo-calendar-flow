import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Calendar from '@/components/Calendar';
import WeatherWidget from '@/components/WeatherWidget';
import SettingsModal from '@/components/SettingsModal';
import UserProfileDropdown from '@/components/UserProfileDropdown';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/contexts/SettingsContext';
import { getImagesFromAlbum, getDefaultBackgroundImages } from '@/utils/googlePhotosUtils';
import { PerformanceMonitor, IntervalManager, displayOptimizations } from '@/utils/performanceUtils';

const Index = () => {
  const [currentBg, setCurrentBg] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [backgroundImages, setBackgroundImages] = useState<string[]>(getDefaultBackgroundImages());
  const [currentTime, setCurrentTime] = useState(new Date());
  const {
    user,
    loading
  } = useAuth();
  const {
    backgroundDuration,
    publicAlbumUrl
  } = useSettings();

  // Optimized clock update - only update minutes, not seconds
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(prev => {
        // Only update if minute has changed to reduce renders
        if (prev.getMinutes() !== now.getMinutes() || prev.getHours() !== now.getHours()) {
          return now;
        }
        return prev;
      });
    };

    // Update immediately, then every minute at the start of the minute
    updateClock();
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const timeoutId = setTimeout(() => {
      updateClock();
      IntervalManager.setInterval('clock-update', updateClock, 60000); // Every minute
    }, msUntilNextMinute);
    return () => {
      clearTimeout(timeoutId);
      IntervalManager.clearInterval('clock-update');
    };
  }, []);

  // 24/7 display optimizations
  useEffect(() => {
    // Start performance monitoring
    PerformanceMonitor.startMonitoring();

    // Enable burn-in prevention
    const burnInInterval = displayOptimizations.enableBurnInPrevention();

    // Enable OLED optimization
    displayOptimizations.enableOLEDOptimization();

    // Adjust for time of day
    const timeAdjustmentInterval = setInterval(() => {
      displayOptimizations.adjustForTimeOfDay();
    }, 60 * 60 * 1000); // Check every hour

    // Initial time adjustment
    displayOptimizations.adjustForTimeOfDay();
    return () => {
      PerformanceMonitor.stopMonitoring();
      clearInterval(burnInInterval);
      clearInterval(timeAdjustmentInterval);
      IntervalManager.clearAllIntervals();
    };
  }, []);

  // Optimized background image loading with error recovery
  const loadBackgroundImages = useCallback(async () => {
    if (publicAlbumUrl) {
      try {
        const albumImages = await getImagesFromAlbum(publicAlbumUrl);
        if (albumImages.length > 0) {
          setBackgroundImages(albumImages);
          setCurrentBg(0);
        } else {
          setBackgroundImages(getDefaultBackgroundImages());
        }
      } catch (error) {
        console.warn('Failed to load album images, using defaults:', error);
        setBackgroundImages(getDefaultBackgroundImages());
      }
    } else {
      setBackgroundImages(getDefaultBackgroundImages());
    }
  }, [publicAlbumUrl]);
  useEffect(() => {
    loadBackgroundImages();
  }, [loadBackgroundImages]);

  // Optimized background rotation with proper cleanup
  useEffect(() => {
    if (backgroundImages.length <= 1) return;
    const intervalTime = backgroundDuration * 60 * 1000;
    IntervalManager.setInterval('background-rotation', () => {
      setCurrentBg(prev => (prev + 1) % backgroundImages.length);
    }, intervalTime);
    return () => {
      IntervalManager.clearInterval('background-rotation');
    };
  }, [backgroundDuration, backgroundImages.length]);

  // Memoized background style with preloading
  const backgroundStyle = useMemo(() => {
    const currentImage = backgroundImages[currentBg];

    // Preload next image for smooth transitions
    if (backgroundImages.length > 1) {
      const nextIndex = (currentBg + 1) % backgroundImages.length;
      const nextImage = new Image();
      nextImage.src = backgroundImages[nextIndex];
    }
    return {
      backgroundImage: `url(${currentImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  }, [backgroundImages, currentBg]);

  // Optimized date formatting - only show date
  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [currentTime]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background Image with optimized transitions */}
      <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out" style={backgroundStyle} />
      
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] dark:bg-black/20" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col text-5xl font-bold">
        {/* Header with gradient overlay */}
        <header className="relative flex items-center justify-between p-6">
          {/* Header gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-white">Family Calendar</h1>
            <p className="text-sm text-white/90">{formattedDate}</p>
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
      <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)} className="fixed bottom-6 right-6 z-20 text-white hover:bg-white/20 bg-black/20 backdrop-blur-sm border border-white/20">
        <Settings className="h-4 w-4" />
      </Button>

      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </div>;
};

export default Index;
