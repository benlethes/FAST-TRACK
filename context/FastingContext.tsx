import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { FastRecord, MOCK_FASTS } from '@/constants/mockData';

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
    id:             fast.id,
    user_id:        userId,
    date:           fast.date,
    start_time:     fast.startTime,
    end_time:       fast.endTime,
    duration_hours: fast.durationHours,
    goal_hours:     fast.goalHours,
    goal_hit:       fast.goalHit,
  };
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function localTimeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface FastingContextType {
  fasts: FastRecord[];
  loaded: boolean;
  // Save a completed fast. Pass the Supabase row id to UPDATE an existing
  // partial row; omit (or pass undefined) to INSERT a new one.
  saveFast: (fast: Omit<FastRecord, 'id'>, id?: string) => Promise<boolean>;
  // Insert a partial row (end_time = null) when a fast begins. Returns the
  // row id on success, or null if offline / auth unavailable.
  beginFast: (start: Date, goalHours: number) => Promise<string | null>;
  // Query Supabase for an in-progress fast (end_time IS NULL) for the current
  // user. Used on app load to survive logout / re-login.
  loadActiveFast: () => Promise<{ id: string; start: Date; goalHours: number } | null>;
  // Update the start_time columns on an existing partial row when the user
  // back-dates a running fast.
  updateActiveFastStart: (id: string, newStart: Date) => Promise<void>;
  importFasts: (records: FastRecord[]) => Promise<void>;
  resetToMockData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const FastingContext = createContext<FastingContextType>({
  fasts: [],
  loaded: false,
  saveFast: async () => false,
  beginFast: async () => null,
  loadActiveFast: async () => null,
  updateActiveFastStart: async () => {},
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
      .not('end_time', 'is', null)   // exclude in-progress partial rows
      .order('date', { ascending: false });
    if (error) { console.error('loadFasts:', error.message); return []; }
    const records = (data ?? []).map(fromRow);
    setFasts(records);
    return records;
  }, []);

  useEffect(() => {
    let initialized = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user?.id) {
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
          setFasts([]);
          setLoaded(false);
          initialized = false;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadFasts]);

  // ── Write ─────────────────────────────────────────────────────────────────────

  // Saves a completed fast. If `id` is provided, UPDATEs the existing partial
  // row (the one inserted by beginFast); otherwise INSERTs a fresh row.
  const saveFast = useCallback(async (fast: Omit<FastRecord, 'id'>, id?: string): Promise<boolean> => {
    const session = await getSession();
    if (!session?.user) return false;
    const record: FastRecord = { ...fast, id: id ?? Date.now().toString() };
    const row = toRow(record, session.user.id);
    const { error } = id
      ? await supabase.from('fasts').update(row).eq('id', id)
      : await supabase.from('fasts').insert(row);
    if (error) { console.error('saveFast:', error.message); return false; }
    setFasts(prev =>
      [record, ...prev.filter(f => f.id !== record.id)].sort((a, b) =>
        b.date !== a.date ? b.date.localeCompare(a.date) : b.startTime.localeCompare(a.startTime)
      )
    );
    return true;
  }, []);

  // Inserts a partial row when a fast begins (end_time stays null until the
  // fast is ended and saved). Returns the row id, or null on failure.
  const beginFast = useCallback(async (start: Date, goalHours: number): Promise<string | null> => {
    const session = await getSession();
    if (!session?.user) return null;
    const id = `active_${Date.now()}`;
    const { error } = await supabase.from('fasts').insert({
      id,
      user_id:        session.user.id,
      date:           localDateStr(start),
      start_time:     localTimeStr(start),
      end_time:       null,
      duration_hours: null,
      goal_hours:     goalHours,
      goal_hit:       null,
    });
    if (error) { console.error('beginFast:', error.message); return null; }
    return id;
  }, []);

  // Returns the most recent in-progress fast for the current user, or null.
  const loadActiveFast = useCallback(async (): Promise<{ id: string; start: Date; goalHours: number } | null> => {
    const session = await getSession();
    if (!session?.user) return null;
    const { data, error } = await supabase
      .from('fasts')
      .select('id, date, start_time, goal_hours')
      .eq('user_id', session.user.id)
      .is('end_time', null)
      .order('date', { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return null;
    const row = data[0];
    // Reconstruct local datetime — date+time stored in device-local timezone
    const start = new Date(`${row.date}T${row.start_time}:00`);
    if (isNaN(start.getTime())) return null;
    return { id: row.id as string, start, goalHours: row.goal_hours as number };
  }, []);

  // Updates the date/start_time columns when the user back-dates a running fast.
  const updateActiveFastStart = useCallback(async (id: string, newStart: Date): Promise<void> => {
    const { error } = await supabase
      .from('fasts')
      .update({ date: localDateStr(newStart), start_time: localTimeStr(newStart) })
      .eq('id', id);
    if (error) console.error('updateActiveFastStart:', error.message);
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
    <FastingContext.Provider value={{
      fasts, loaded,
      saveFast, beginFast, loadActiveFast, updateActiveFastStart,
      importFasts, resetToMockData, clearAllData,
    }}>
      {children}
    </FastingContext.Provider>
  );
}

export function useFastingContext() {
  return useContext(FastingContext);
}
