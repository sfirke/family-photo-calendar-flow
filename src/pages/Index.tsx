import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Calendar from '@/components/Calendar';
import WeatherWidget from '@/components/WeatherWidget';
import SettingsModal from '@/components/SettingsModal';
import OfflineIndicator from '@/components/OfflineIndicator';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useSettings } from '@/contexts/SettingsContext';
import { getImagesFromAlbum, getDefaultBackgroundImages } from '@/utils/googlePhotosUtils';
import { PerformanceMonitor, IntervalManager, displayOptimizations } from '@/utils/performanceUtils';
const Index = () => {
  const [currentBg, setCurrentBg] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [backgroundImages, setBackgroundImages] = useState<string[]>(getDefaultBackgroundImages());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const {
    user,
    loading
  } = useLocalAuth();
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

  // Background image loading with cached photos
  const loadBackgroundImages = useCallback(async () => {
    console.log('Loading background images, publicAlbumUrl:', publicAlbumUrl);
    if (publicAlbumUrl) {
      try {
        // First try to get cached photos
        const {
          photosCache
        } = await import('@/utils/photosCache');
        const cachedPhotos = photosCache.getRandomizedPhotos(50);
        if (cachedPhotos.length > 0) {
          console.log(`Using ${cachedPhotos.length} cached photos`);
          setBackgroundImages(cachedPhotos);
          setCurrentBg(0);
          return;
        }

        // Fallback to fetching if no cache
        console.log('No cached photos found, fetching from album...');
        const albumImages = await getImagesFromAlbum(publicAlbumUrl);
        if (albumImages.length > 0) {
          const randomizedImages = [...albumImages].sort(() => Math.random() - 0.5);
          console.log(`Loaded ${randomizedImages.length} images from album`);
          setBackgroundImages(randomizedImages);
          setCurrentBg(0);
        } else {
          console.log('No album images found, using defaults');
          setBackgroundImages(getDefaultBackgroundImages());
        }
      } catch (error) {
        console.warn('Failed to load album images, using defaults:', error);
        setBackgroundImages(getDefaultBackgroundImages());
      }
    } else {
      console.log('No album URL set, using default images');
      setBackgroundImages(getDefaultBackgroundImages());
    }
  }, [publicAlbumUrl]);

  // Load background images when component mounts or album URL changes
  useEffect(() => {
    loadBackgroundImages();
  }, [loadBackgroundImages]);

  // Optimized background rotation with seamless fade transitions
  useEffect(() => {
    if (backgroundImages.length <= 1) return;
    const intervalTime = backgroundDuration * 60 * 1000;
    console.log(`Setting up background rotation every ${backgroundDuration} minutes`);
    IntervalManager.setInterval('background-rotation', () => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentBg(prev => {
          const next = (prev + 1) % backgroundImages.length;
          console.log(`Changing background from ${prev} to ${next}`);
          return next;
        });
        setIsTransitioning(false);
      }, 500); // Half of transition duration
    }, intervalTime);
    return () => {
      IntervalManager.clearInterval('background-rotation');
    };
  }, [backgroundDuration, backgroundImages.length]);

  // Memoized background style with preloading and seamless transitions
  const backgroundStyle = useMemo(() => {
    const currentImage = backgroundImages[currentBg];
    console.log(`Current background image: ${currentImage}`);

    // Preload next image for smooth transitions
    if (backgroundImages.length > 1) {
      const nextIndex = (currentBg + 1) % backgroundImages.length;
      const nextImage = new Image();
      nextImage.src = backgroundImages[nextIndex];
    }
    return {
      backgroundImage: `url("${currentImage}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: isTransitioning ? 0 : 1,
      transition: 'opacity 1s ease-in-out'
    };
  }, [backgroundImages, currentBg, isTransitioning]);

  // Optimized time formatting - only update when time changes
  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
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
      {/* Background Image with seamless fade transitions */}
      <div className="fixed inset-0 w-full h-full" style={backgroundStyle} />
      
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] dark:bg-black/20 z-10" />
      
      {/* Content */}
      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Header with gradient overlay - Fixed positioning */}
        <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between p-6">
          {/* Header gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-xl5 text-white/90 font-semibold text-8xl">{formattedTime}</h1>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <OfflineIndicator />
            <WeatherWidget />
          </div>
        </header>

        {/* Main Content - Add top padding to account for fixed header */}
        <main className="px-6 pb-6 pt-32 flex-1 flex flex-col overflow-visible">
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