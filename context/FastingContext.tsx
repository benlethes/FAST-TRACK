import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FastRecord, MOCK_FASTS } from '@/constants/mockData';

const STORAGE_KEY = '@fasttrack:fasts';
const SEEDED_KEY  = '@fasttrack:seeded';

interface FastingContextType {
  fasts: FastRecord[];
  loaded: boolean;
  saveFast: (fast: Omit<FastRecord, 'id'>) => Promise<void>;
  importFasts: (records: FastRecord[]) => Promise<void>;
  resetToMockData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const FastingContext = createContext<FastingContextType>({
  fasts: [],
  loaded: false,
  saveFast: async () => {},
  importFasts: async () => {},
  resetToMockData: async () => {},
  clearAllData: async () => {},
});

async function persist(records: FastRecord[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function FastingProvider({ children }: { children: React.ReactNode }) {
  const [fasts, setFasts] = useState<FastRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const seeded = await AsyncStorage.getItem(SEEDED_KEY);
        if (!seeded) {
          const withIds = MOCK_FASTS.map((f, i) => ({ ...f, id: `mock_${i}` }));
          await persist(withIds);
          await AsyncStorage.setItem(SEEDED_KEY, '1');
          setFasts(withIds);
        } else {
          const raw = await AsyncStorage.getItem(STORAGE_KEY);
          setFasts(raw ? JSON.parse(raw) : []);
        }
      } catch {
        setFasts(MOCK_FASTS);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const saveFast = useCallback(async (fast: Omit<FastRecord, 'id'>) => {
    const record: FastRecord = { ...fast, id: Date.now().toString() };
    setFasts(prev => {
      const next = [record, ...prev].sort((a, b) =>
        b.date !== a.date ? b.date.localeCompare(a.date) : b.startTime.localeCompare(a.startTime)
      );
      persist(next).catch(console.error);
      return next;
    });
  }, []);

  const resetToMockData = useCallback(async () => {
    const withIds = MOCK_FASTS.map((f, i) => ({ ...f, id: `mock_${i}` }));
    await persist(withIds);
    await AsyncStorage.setItem(SEEDED_KEY, '1');
    setFasts(withIds);
  }, []);

  const importFasts = useCallback(async (records: FastRecord[]) => {
    const withIds = records.map((f, i) => ({ ...f, id: f.id ?? `import_${Date.now()}_${i}` }));
    const sorted = withIds.sort((a, b) =>
      b.date !== a.date ? b.date.localeCompare(a.date) : b.startTime.localeCompare(a.startTime)
    );
    await persist(sorted);
    await AsyncStorage.setItem(SEEDED_KEY, '1');
    setFasts(sorted);
  }, []);

  const clearAllData = useCallback(async () => {
    await persist([]);
    setFasts([]);
  }, []);

  return (
    <FastingContext.Provider value={{ fasts, loaded, saveFast, importFasts, resetToMockData, clearAllData }}>
      {children}
    </FastingContext.Provider>
  );
}

export function useFastingContext() {
  return useContext(FastingContext);
}
