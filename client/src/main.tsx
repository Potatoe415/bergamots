import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './i18n';
import { SettingsProvider } from './settings';
import { syncViewportHeight } from './lib/syncViewportHeight';
import './index.css';

syncViewportHeight();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </LanguageProvider>
  </React.StrictMode>
);
