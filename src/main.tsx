
import { StrictMode } from 'react';
import './setupLogging';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SettingsProvider } from './contexts/settings/SettingsProvider';
import { SecurityProvider } from './contexts/security/SecurityProvider';
import { ThemeProvider } from './contexts/theme/ThemeProvider';
import { ensureInstalledVersion } from '@/utils/versionInitialization';

// Initialize installed version tracking on startup (non-blocking)
ensureInstalledVersion();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SecurityProvider>
      <SettingsProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </SettingsProvider>
    </SecurityProvider>
  </StrictMode>,
);
