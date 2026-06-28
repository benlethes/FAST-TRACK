import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_KEY = '@fasttrack:active_fast';

export function useFasting() {
  const [isActive, setIsActive]       = useState(false);
  const [startTime, setStartTime]     = useState<Date | null>(null);
  const [elapsedSeconds, setElapsed]  = useState(0);
  const [goalHours, setGoalHours]     = useState(16);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Restore in-progress fast on mount ────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(ACTIVE_KEY).then(raw => {
      if (!raw) return;
      try {
        const { startTime: iso, goalHours: gh } = JSON.parse(raw) as {
          startTime: string;
          goalHours: number;
        };
        const start = new Date(iso);
        if (isNaN(start.getTime())) return;
        // Discard stale keys — a fast started more than 48 h ago was almost
        // certainly abandoned (crash, uninstall/reinstall, etc.).
        if (Date.now() - start.getTime() > 48 * 3600 * 1000) {
          AsyncStorage.removeItem(ACTIVE_KEY);
          return;
        }
        setStartTime(start);
        setGoalHours(gh);
        setElapsed(Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000)));
        setIsActive(true);
      } catch {
        // corrupt entry — discard silently
        AsyncStorage.removeItem(ACTIVE_KEY);
      }
    });
  }, []);

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
    await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify({
      startTime: t.toISOString(),
      goalHours,
    }));
  }, [goalHours]);

  const stopFast = useCallback(async () => {
    setIsActive(false);
    const t = startTime;
    setStartTime(null);
    setElapsed(0);
    await AsyncStorage.removeItem(ACTIVE_KEY);
    return t;
  }, [startTime]);

  // Update the start time of a running fast (e.g. user back-dates it)
  const adjustStartTime = useCallback(async (newStart: Date) => {
    setStartTime(newStart);
    setElapsed(Math.max(0, Math.floor((Date.now() - newStart.getTime()) / 1000)));
    await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify({
      startTime: newStart.toISOString(),
      goalHours,
    }));
  }, [goalHours]);

  const progress = goalHours > 0
    ? Math.min(elapsedSeconds / (goalHours * 3600), 1)
    : 0;

  return { isActive, startTime, elapsedSeconds, goalHours, setGoalHours, startFast, stopFast, adjustStartTime, progress };
}
