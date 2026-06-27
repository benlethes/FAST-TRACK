"use client";
import { useState, useEffect, useCallback } from "react";

export type FastRecord = {
  id: string;
  startTime: number; // unix ms
  endTime: number;   // unix ms
  goalHours: number;
};

export type FastState = {
  isActive: boolean;
  startTime: number | null; // unix ms when current fast began
  goalHours: number;
  records: FastRecord[];
};

const STORAGE_KEY = "fasttrack_state";

// Seed realistic placeholder data — last 28 days
function generateSeedData(): FastRecord[] {
  const records: FastRecord[] = [];
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const goals = [16, 16, 14, 16, 18, 16, 16];
  for (let i = 27; i >= 1; i--) {
    const dayOffset = i * oneDay;
    // Start around 19:00–21:00
    const startHour = 19 + Math.floor(Math.random() * 2);
    const startMinute = Math.floor(Math.random() * 60);
    const startTime =
      Math.floor((now - dayOffset) / oneDay) * oneDay +
      startHour * 3600 * 1000 +
      startMinute * 60 * 1000;
    const goal = goals[i % goals.length];
    // Duration: goal ± 2 hours, sometimes short
    const miss = Math.random() < 0.35;
    const hours = miss
      ? goal * 0.6 + Math.random() * (goal * 0.3)
      : goal + (Math.random() * 2 - 0.5);
    const endTime = startTime + hours * 3600 * 1000;
    records.push({
      id: `seed-${i}`,
      startTime,
      endTime,
      goalHours: goal,
    });
  }
  return records;
}

function loadState(): FastState {
  if (typeof window === "undefined") {
    return { isActive: false, startTime: null, goalHours: 16, records: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FastState;
      if (!parsed.records || parsed.records.length === 0) {
        parsed.records = generateSeedData();
      }
      return parsed;
    }
  } catch {}
  return {
    isActive: false,
    startTime: null,
    goalHours: 16,
    records: generateSeedData(),
  };
}

function saveState(s: FastState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// Singleton state shared across components via a simple pub-sub
type Listener = () => void;
let globalState: FastState = loadState();
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function useFastStore() {
  const [, rerender] = useState(0);

  useEffect(() => {
    const listener: Listener = () => rerender((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setGoal = useCallback((hours: number) => {
    globalState = { ...globalState, goalHours: hours };
    saveState(globalState);
    notify();
  }, []);

  const startFast = useCallback(() => {
    if (globalState.isActive) return;
    globalState = {
      ...globalState,
      isActive: true,
      startTime: Date.now(),
    };
    saveState(globalState);
    notify();
  }, []);

  const endFast = useCallback(() => {
    if (!globalState.isActive || globalState.startTime === null) return;
    const record: FastRecord = {
      id: `fast-${Date.now()}`,
      startTime: globalState.startTime,
      endTime: Date.now(),
      goalHours: globalState.goalHours,
    };
    globalState = {
      ...globalState,
      isActive: false,
      startTime: null,
      records: [...globalState.records, record],
    };
    saveState(globalState);
    notify();
  }, []);

  return {
    state: globalState,
    setGoal,
    startFast,
    endFast,
  };
}

// Pure helpers
export function fastDurationMs(record: FastRecord): number {
  return record.endTime - record.startTime;
}

export function fastDurationHours(record: FastRecord): number {
  return fastDurationMs(record) / 3600000;
}

export function goalHit(record: FastRecord): boolean {
  return fastDurationHours(record) >= record.goalHours;
}

export function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  return `${h}h ${m}m`;
}

export function formatHMS(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function formatTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}
