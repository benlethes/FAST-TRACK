import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { FastRecord, MOCK_FASTS } from '@/constants/mockData';

// Marks that mock data has been seeded into Supabase for this device.
// Using a separate key from the old AsyncStorage version so fresh devices
// still get seeded even if they upgraded from the previous local-only build.
const SUPABASE_SEEDED_KEY = '@fasttrack:supabase_seeded';

// ─── Row ↔ FastRecord mapping ─────────────────────────────────────────────────

function fromRow(row: Record<string, unknown>): FastRecord {
  return {
    id:            row.id as string,
    date:          row.date as string,
    startTime:     row.start_time as string,
    endTime:       row.end_time as string,
    durationHours: row.duration_hours as number,
    goalHours:     row.goal_hours as number,
    goalHit:       row.goal_hit as boolean,
  };
}

function toRow(fast: FastRecord, userId: string) {
  return {
    id:             fast.id ?? Date.now().toString(),
    user_id:        userId,
    date:           fast.date,
    start_time:     fast.startTime,
    end_time:       fast.endTime,
    duration_hours: fast.durationHours,
    goal_hours:     fast.goalHours,
    goal_hit:       fast.goalHit,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface FastingContextType {
  fasts: FastRecord[];
  loaded: boolean;
  saveFast: (fast: Omit<FastRecord, 'id'>) => Promise<boolean>;
  importFasts: (records: FastRecord[]) => Promise<void>;
  resetToMockData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const FastingContext = createContext<FastingContextType>({
  fasts: [],
  loaded: false,
  saveFast: async () => false,
  importFasts: async () => {},
  resetToMockData: async () => {},
  clearAllData: async () => {},
});

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FastingProvider({ children }: { children: React.ReactNode }) {
  const [fasts, setFasts] = useState<FastRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────────

  const loadFasts = useCallback(async (userId: string): Promise<FastRecord[]> => {
    const { data, error } = await supabase
      .from('fasts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) { console.error('loadFasts:', error.message); return []; }
    const records = (data ?? []).map(fromRow);
    setFasts(records);
    return records;
  }, []);

  // Subscribe to auth changes so the context works whether the provider
  // mounts before or after the session is available, and so it reloads
  // if the user signs out and back in without unmounting.
  useEffect(() => {
    let initialized = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user?.id) {
          // Only do the initial load once per provider lifetime.
          if (initialized) return;
          initialized = true;
          const uid = session.user.id;
          (async () => {
            try {
              const existing = await loadFasts(uid);
              const alreadySeeded = await AsyncStorage.getItem(SUPABASE_SEEDED_KEY);
              if (!alreadySeeded && existing.length === 0) {
                const rows = MOCK_FASTS.map((f, i) =>
                  toRow({ ...f, id: `mock_${i}` }, uid)
                );
                const { error } = await supabase.from('fasts').insert(rows);
                if (!error) {
                  await AsyncStorage.setItem(SUPABASE_SEEDED_KEY, '1');
                  await loadFasts(uid);
                }
              }
            } finally {
              setLoaded(true);
            }
          })();
        } else {
          // Signed out — reset state so it's clean on next login.
          setFasts([]);
          setLoaded(false);
          initialized = false;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadFasts]);

  // ── Write ─────────────────────────────────────────────────────────────────────

  const saveFast = useCallback(async (fast: Omit<FastRecord, 'id'>): Promise<boolean> => {
    const session = await getSession();
    if (!session?.user) return false;
    const record: FastRecord = { ...fast, id: Date.now().toString() };
    const { error } = await supabase.from('fasts').insert(toRow(record, session.user.id));
    if (error) { console.error('saveFast:', error.message); return false; }
    setFasts(prev =>
      [record, ...prev].sort((a, b) =>
        b.date !== a.date ? b.date.localeCompare(a.date) : b.startTime.localeCompare(a.startTime)
      )
    );
    return true;
  }, []);

  const importFasts = useCallback(async (records: FastRecord[]) => {
    const session = await getSession();
    if (!session?.user) return;
    const uid = session.user.id;

    await supabase.from('fasts').delete().eq('user_id', uid);

    const rows = records.map((f, i) =>
      toRow({ ...f, id: f.id ?? `import_${Date.now()}_${i}` }, uid)
    );
    const { error } = await supabase.from('fasts').insert(rows);
    if (error) { console.error('importFasts:', error.message); return; }
    await loadFasts(uid);
  }, [loadFasts]);

  const resetToMockData = useCallback(async () => {
    const session = await getSession();
    if (!session?.user) return;
    const uid = session.user.id;

    await supabase.from('fasts').delete().eq('user_id', uid);

    const rows = MOCK_FASTS.map((f, i) => toRow({ ...f, id: `mock_${i}` }, uid));
    const { error } = await supabase.from('fasts').insert(rows);
    if (error) { console.error('resetToMockData:', error.message); return; }
    await loadFasts(uid);
  }, [loadFasts]);

  const clearAllData = useCallback(async () => {
    const session = await getSession();
    if (!session?.user) return;
    await supabase.from('fasts').delete().eq('user_id', session.user.id);
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
