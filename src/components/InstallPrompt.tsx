
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { showInstallPrompt, isInstalled } from '@/utils/pwa';

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (isInstalled()) {
      return;
    }

    // Check if install prompt is available
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
      
      // Show prompt after a delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    const accepted = await showInstallPrompt();
    if (accepted) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if dismissed in this session
  if (sessionStorage.getItem('installPromptDismissed')) {
    return null;
  }

  if (!showPrompt || !canInstall) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg md:left-auto md:right-4 md:max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Install App</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Install Family Photo Calendar for quick access and offline use
            </p>
            <div className="flex gap-2">
              <Button onClick={handleInstall} size="sm" className="flex-1">
                <Download className="h-4 w-4 mr-1" />
                Install
              </Button>
              <Button onClick={handleDismiss} variant="outline" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstallPrompt;
