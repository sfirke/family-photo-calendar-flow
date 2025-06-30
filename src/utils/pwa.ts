
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  platform: string | null;
}

class PWAManager {
  private installPromptEvent: BeforeInstallPromptEvent | null = null;
  private installCallback: ((state: PWAInstallState) => void) | null = null;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPromptEvent = e as BeforeInstallPromptEvent;
      this.notifyStateChange();
    });

    window.addEventListener('appinstalled', () => {
      this.installPromptEvent = null;
      this.notifyStateChange();
    });
  }

  onInstallStateChange(callback: (state: PWAInstallState) => void): void {
    this.installCallback = callback;
    this.notifyStateChange(); // Immediate callback with current state
  }

  async promptInstall(): Promise<boolean> {
    if (!this.installPromptEvent) {
      return false;
    }

    try {
      await this.installPromptEvent.prompt();
      const { outcome } = await this.installPromptEvent.userChoice;
      
      if (outcome === 'accepted') {
        this.installPromptEvent = null;
        this.notifyStateChange();
        return true;
      }
    } catch (error) {
      console.error('PWA install prompt failed:', error);
    }

    return false;
  }

  getInstallState(): PWAInstallState {
    return {
      isInstallable: !!this.installPromptEvent,
      isInstalled: this.isInstalled(),
      platform: this.installPromptEvent?.platforms?.[0] || null
    };
  }

  private isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  }

  private notifyStateChange(): void {
    if (this.installCallback) {
      this.installCallback(this.getInstallState());
    }
  }
}

export const pwaManager = new PWAManager();

export const checkPWAInstallability = (): PWAInstallState => {
  return pwaManager.getInstallState();
};

export const triggerPWAInstall = (): Promise<boolean> => {
  return pwaManager.promptInstall();
};

// Additional exports needed by components
export const showInstallPrompt = (): Promise<boolean> => {
  return pwaManager.promptInstall();
};

export const isInstalled = (): boolean => {
  return pwaManager.getInstallState().isInstalled;
};
