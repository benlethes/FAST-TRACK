import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@fasttrack:settings';

export type WeekStart  = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type TimeFormat = '12h'    | '24h';

interface Settings {
  weekStart:     WeekStart;
  timeFormat:    TimeFormat;
  defaultGoal:   number;   // hours 12–24
}

interface SettingsContextType extends Settings {
  setWeekStart:   (v: WeekStart)  => void;
  setTimeFormat:  (v: TimeFormat) => void;
  setDefaultGoal: (v: number)     => void;
}

const DEFAULTS: Settings = {
  weekStart:   'Monday',
  timeFormat:  '24h',
  defaultGoal: 16,
};

const SettingsContext = createContext<SettingsContextType>({
  ...DEFAULTS,
  setWeekStart:   () => {},
  setTimeFormat:  () => {},
  setDefaultGoal: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as Partial<Settings>;
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch {}
    });
  }, []);

  const save = (next: Settings) => {
    setSettings(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const setWeekStart   = (v: WeekStart)  => save({ ...settings, weekStart: v });
  const setTimeFormat  = (v: TimeFormat) => save({ ...settings, timeFormat: v });
  const setDefaultGoal = (v: number)     => save({ ...settings, defaultGoal: v });

  return (
    <SettingsContext.Provider value={{ ...settings, setWeekStart, setTimeFormat, setDefaultGoal }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

// Shared time formatter respecting user preference
export function fmtTime(d: Date | null, format: TimeFormat): string {
  if (!d) return '––:––';
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  if (format === '24h') {
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  const period = h >= 12 ? 'pm' : 'am';
  const h12    = h % 12 || 12;
  return `${h12}:${m} ${period}`;
}
