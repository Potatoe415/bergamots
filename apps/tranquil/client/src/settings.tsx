import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Settings {
  soundOnMyTurn: boolean;
}

const defaults: Settings = {
  soundOnMyTurn: true,
};

const STORAGE_KEY = 'tranquillity_settings';

interface SettingsCtx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const Context = createContext<SettingsCtx>({
  settings: defaults,
  update: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch {}
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  function update(patch: Partial<Settings>) {
    setSettings(prev => ({ ...prev, ...patch }));
  }

  return <Context.Provider value={{ settings, update }}>{children}</Context.Provider>;
}

export function useSettings() {
  return useContext(Context);
}
