import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEIGHT_KEY = '@fasttrack:weight';

export interface WeightRecord {
  id: string;
  date: string;     // YYYY-MM-DD
  time: string;     // HH:mm
  weightKg: number;
}

interface WeightContextType {
  records: WeightRecord[];
  loaded: boolean;
  logWeight: (weightKg: number, date: string, time: string) => Promise<void>;
  deleteWeight: (id: string) => Promise<void>;
}

const WeightContext = createContext<WeightContextType>({
  records: [],
  loaded: false,
  logWeight: async () => {},
  deleteWeight: async () => {},
});

async function persistRecords(records: WeightRecord[]) {
  await AsyncStorage.setItem(WEIGHT_KEY, JSON.stringify(records));
}

export function WeightProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(WEIGHT_KEY);
        setRecords(raw ? JSON.parse(raw) : []);
      } catch {
        setRecords([]);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const logWeight = useCallback(async (weightKg: number, date: string, time: string) => {
    const record: WeightRecord = { id: Date.now().toString(), date, time, weightKg };
    setRecords(prev => {
      const next = [record, ...prev].sort((a, b) =>
        a.date !== b.date ? b.date.localeCompare(a.date) : b.time.localeCompare(a.time)
      );
      persistRecords(next).catch(console.error);
      return next;
    });
  }, []);

  const deleteWeight = useCallback(async (id: string) => {
    setRecords(prev => {
      const next = prev.filter(r => r.id !== id);
      persistRecords(next).catch(console.error);
      return next;
    });
  }, []);

  return (
    <WeightContext.Provider value={{ records, loaded, logWeight, deleteWeight }}>
      {children}
    </WeightContext.Provider>
  );
}

export function useWeightContext() {
  return useContext(WeightContext);
}
