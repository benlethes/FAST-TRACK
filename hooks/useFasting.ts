import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFastingContext } from '@/context/FastingContext';

const ACTIVE_KEY = '@fasttrack:active_fast';

export function useFasting() {
  const [isActive, setIsActive]         = useState(false);
  const [startTime, setStartTime]       = useState<Date | null>(null);
  const [elapsedSeconds, setElapsed]    = useState(0);
  const [goalHours, setGoalHours]       = useState(16);
  const [activeFastId, setActiveFastId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { beginFast, loadActiveFast, updateActiveFastStart } = useFastingContext();

  // ── Restore in-progress fast on mount ────────────────────────────────────────
  // Priority: Supabase (survives logout/re-login) → AsyncStorage (offline fallback)
  useEffect(() => {
    (async () => {
      // 1. Check Supabase for a partial row (end_time IS NULL)
      try {
        const active = await loadActiveFast();
        if (active && Date.now() - active.start.getTime() < 48 * 3600 * 1000) {
          setActiveFastId(active.id);
          setStartTime(active.start);
          setGoalHours(active.goalHours);
          setElapsed(Math.max(0, Math.floor((Date.now() - active.start.getTime()) / 1000)));
          setIsActive(true);
          // Mirror to AsyncStorage so offline ticks still work
          await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify({
            startTime:  active.start.toISOString(),
            goalHours:  active.goalHours,
            supabaseId: active.id,
          }));
          return;
        }
      } catch {
        // Network or auth issue — fall through to AsyncStorage
      }

      // 2. Fall back to AsyncStorage
      const raw = await AsyncStorage.getItem(ACTIVE_KEY);
      if (!raw) return;
      try {
        const { startTime: iso, goalHours: gh, supabaseId } = JSON.parse(raw) as {
          startTime: string; goalHours: number; supabaseId?: string;
        };
        const start = new Date(iso);
        if (isNaN(start.getTime())) return;
        if (Date.now() - start.getTime() > 48 * 3600 * 1000) {
          AsyncStorage.removeItem(ACTIVE_KEY);
          return;
        }
        setActiveFastId(supabaseId ?? null);
        setStartTime(start);
        setGoalHours(gh);
        setElapsed(Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000)));
        setIsActive(true);
      } catch {
        AsyncStorage.removeItem(ACTIVE_KEY);
      }
    })();
  }, [loadActiveFast]);

  // ── Tick ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isActive && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.max(0, Math.floor((Date.now() - startTime.getTime()) / 1000)));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, startTime]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const startFast = useCallback(async (customStart?: Date) => {
    const t = customStart ?? new Date();
    setStartTime(t);
    setElapsed(Math.max(0, Math.floor((Date.now() - t.getTime()) / 1000)));
    setIsActive(true);
    // Insert partial row; null if offline — saveFast will INSERT instead of UPDATE
    const id = await beginFast(t, goalHours);
    setActiveFastId(id);
    await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify({
      startTime:  t.toISOString(),
      goalHours,
      supabaseId: id,
    }));
  }, [goalHours, beginFast]);

  const stopFast = useCallback(async () => {
    setIsActive(false);
    setStartTime(null);
    setElapsed(0);
    setActiveFastId(null);
    await AsyncStorage.removeItem(ACTIVE_KEY);
  }, []);

  const adjustStartTime = useCallback(async (newStart: Date) => {
    setStartTime(newStart);
    setElapsed(Math.max(0, Math.floor((Date.now() - newStart.getTime()) / 1000)));
    await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify({
      startTime:  newStart.toISOString(),
      goalHours,
      supabaseId: activeFastId,
    }));
    if (activeFastId) {
      await updateActiveFastStart(activeFastId, newStart);
    }
  }, [goalHours, activeFastId, updateActiveFastStart]);

  const progress = goalHours > 0
    ? Math.min(elapsedSeconds / (goalHours * 3600), 1)
    : 0;

  return {
    isActive, startTime, elapsedSeconds, goalHours, setGoalHours,
    startFast, stopFast, adjustStartTime, progress,
    activeFastId,
  };
}
