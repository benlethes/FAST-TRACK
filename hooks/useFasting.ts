import { useState, useEffect, useRef, useCallback } from 'react';

export function useFasting() {
  const [isActive, setIsActive]       = useState(false);
  const [startTime, setStartTime]     = useState<Date | null>(null);
  const [elapsedSeconds, setElapsed]  = useState(0);
  const [goalHours, setGoalHours]     = useState(16);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const startFast = useCallback((customStart?: Date) => {
    const t = customStart ?? new Date();
    setStartTime(t);
    setElapsed(Math.max(0, Math.floor((Date.now() - t.getTime()) / 1000)));
    setIsActive(true);
  }, []);

  // Stops the visual timer and returns the recorded start time so the
  // caller can open the end-time adjustment modal before saving.
  const stopFast = useCallback(() => {
    setIsActive(false);
    const t = startTime;
    setStartTime(null);
    setElapsed(0);
    return t;
  }, [startTime]);

  const progress = goalHours > 0
    ? Math.min(elapsedSeconds / (goalHours * 3600), 1)
    : 0;

  return { isActive, startTime, elapsedSeconds, goalHours, setGoalHours, startFast, stopFast, progress };
}
