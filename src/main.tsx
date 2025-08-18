
import { StrictMode } from 'react';
import './setupLogging';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SettingsProvider } from './contexts/settings/SettingsProvider';
import { SecurityProvider } from './contexts/security/SecurityProvider';
import { ThemeProvider } from './contexts/theme/ThemeProvider';

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
