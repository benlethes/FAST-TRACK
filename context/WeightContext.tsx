import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface WeightRecord {
  id: string;
  date: string;     // YYYY-MM-DD
  time: string;     // HH:mm
  weightKg: number;
}

function fromRow(row: Record<string, unknown>): WeightRecord {
  return {
    id:       row.id as string,
    date:     row.date as string,
    time:     row.time as string,
    weightKg: row.weight_kg as number,
  };
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

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function WeightProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const session = await getSession();
        if (!session?.user) return;
        const { data, error } = await supabase
          .from('weight_entries')
          .select('*')
          .eq('user_id', session.user.id)
          .order('date', { ascending: false });
        if (error) { console.error('loadWeight:', error.message); return; }
        setRecords((data ?? []).map(fromRow));
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const logWeight = useCallback(async (weightKg: number, date: string, time: string) => {
    const session = await getSession();
    if (!session?.user) return;
    const id = Date.now().toString();
    const { error } = await supabase.from('weight_entries').insert({
      id,
      user_id:   session.user.id,
      date,
      time,
      weight_kg: weightKg,
    });
    if (error) { console.error('logWeight:', error.message); return; }
    const record: WeightRecord = { id, date, time, weightKg };
    setRecords(prev =>
      [record, ...prev].sort((a, b) =>
        a.date !== b.date ? b.date.localeCompare(a.date) : b.time.localeCompare(a.time)
      )
    );
  }, []);

  const deleteWeight = useCallback(async (id: string) => {
    const { error } = await supabase.from('weight_entries').delete().eq('id', id);
    if (error) { console.error('deleteWeight:', error.message); return; }
    setRecords(prev => prev.filter(r => r.id !== id));
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
