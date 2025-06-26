
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker, setupInstallPrompt } from './utils/pwa'

// Register service worker for PWA functionality
registerServiceWorker();

// Setup install prompt
setupInstallPrompt();

createRoot(document.getElementById("root")!).render(<App />);
