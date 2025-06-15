
import React, { useState, useEffect } from 'react';
import Calendar from '@/components/Calendar';
import WeatherWidget from '@/components/WeatherWidget';
import SettingsModal from '@/components/SettingsModal';
import GooglePhotosSync from '@/components/GooglePhotosSync';
import { Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/contexts/SettingsContext';

const backgroundImages = [
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1501436513145-30f24e19fcc4?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1418065460487-3d7dd550c25a?w=1920&h=1080&fit=crop'
];

const Index = () => {
  const [currentBg, setCurrentBg] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { zipCode, backgroundDuration } = useSettings();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgroundImages.length);
    }, backgroundDuration * 60 * 1000);

    return () => clearInterval(interval);
  }, [backgroundDuration]);

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
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
        style={{ 
          backgroundImage: `url(${backgroundImages[currentBg]})` 
        }}
      />
      
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm dark:bg-black/20" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header with gradient overlay */}
        <header className="relative flex items-center justify-between p-6">
          {/* Header gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-2xl font-light text-white">Family Calendar</h1>
            <p className="text-sm text-white/90">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
              })} at {new Date().toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit'
              })}
            </p>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <WeatherWidget zipCode={zipCode} />
            
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/90">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-white hover:bg-white/20"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 pb-6 flex-1 flex flex-col">
          {user && (
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
              <GooglePhotosSync />
            </div>
          )}
          <div className="flex-1">
            <Calendar />
          </div>
        </main>
      </div>

      {/* Settings Button - Fixed in lower left corner */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowSettings(true)}
        className="fixed bottom-6 left-6 z-20 text-white hover:bg-white/20 bg-black/20 backdrop-blur-sm border border-white/20"
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
