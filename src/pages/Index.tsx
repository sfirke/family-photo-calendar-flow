import React, { useState, useEffect } from 'react';
import Calendar from '@/components/Calendar';
import WeatherWidget from '@/components/WeatherWidget';
import SettingsModal from '@/components/SettingsModal';
import { Settings, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [zipCode, setZipCode] = useState('48226'); // Detroit, MI default

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgroundImages.length);
    }, 30000); // Change background every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${backgroundImages[currentBg]})` 
        }}
      />
      
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between p-6 text-white">
          <div>
            <h1 className="text-2xl font-light text-white/90">Family Calendar</h1>
            <p className="text-sm text-white/70">
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
          
          <div className="flex items-center gap-4">
            <WeatherWidget zipCode={zipCode} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="text-white hover:bg-white/20"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 pb-6">
          <Calendar />
        </main>
      </div>

      <SettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings}
        zipCode={zipCode}
        onZipCodeChange={setZipCode}
      />
    </div>
  );
};

export default Index;
