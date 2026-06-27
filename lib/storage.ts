export interface FastSession {
  start: number; // Unix ms
  end: number;   // Unix ms
  goal: number;  // hours
}

export interface AppState {
  sessions: FastSession[];
  fasting: boolean;
  startTime: number | null;
  goalHours: number;
}

const KEY = "fasttrack_v1";

export function loadState(): AppState {
  if (typeof window === "undefined") {
    return { sessions: [], fasting: false, startTime: null, goalHours: 16 };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      return {
        sessions: parsed.sessions ?? [],
        fasting: parsed.fasting ?? false,
        startTime: parsed.startTime ?? null,
        goalHours: parsed.goalHours ?? 16,
      };
    }
  } catch (_) {
    // ignore
  }
  return { sessions: [], fasting: false, startTime: null, goalHours: 16 };
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

/** Seed 28 days of realistic sample data if sessions array is empty */
export function seedSampleData(state: AppState): AppState {
  if (state.sessions.length > 0) return state;

  const sessions: FastSession[] = [];
  const now = Date.now();
  const DAY = 86400000;

  for (let i = 28; i >= 1; i--) {
    // ~85% of days have a session
    if (Math.random() > 0.85) continue;

    // Start time: 19:00–22:00 (random within range)
    const dayBase = new Date(now - i * DAY);
    dayBase.setHours(19, 0, 0, 0);
    const startOffset = Math.floor(Math.random() * 3 * 60 * 60 * 1000); // 0–3h
    const startTs = dayBase.getTime() + startOffset;

    // Duration: 14–18h
    const durationHours = 14 + Math.random() * 4;
    const endTs = startTs + durationHours * 3600000;

    sessions.push({ start: startTs, end: endTs, goal: 16 });
  }

  return { ...state, sessions };
}

/** Return the day-of-week string YYYY-MM-DD in local time */
export function localDateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Calculate current streak (days with qualifying sessions, consecutive ending today/yesterday) */
export function calcStreak(sessions: FastSession[]): number {
  // Build a set of dates where a qualifying fast occurred
  const qualifiedDays = new Set<string>();
  for (const s of sessions) {
    const duration = (s.end - s.start) / 3600000;
    if (duration >= s.goal) {
      qualifiedDays.add(localDateKey(s.start));
    }
  }

  // Walk backwards from yesterday (today's fast may not be complete)
  let streak = 0;
  const today = localDateKey(Date.now());
  // If today has a qualifying fast, include it
  if (qualifiedDays.has(today)) streak = 1;

  let dayOffset = streak === 1 ? 1 : 1; // start checking from yesterday
  while (true) {
    const d = new Date(Date.now() - dayOffset * 86400000);
    const key = localDateKey(d.getTime());
    if (qualifiedDays.has(key)) {
      streak++;
      dayOffset++;
    } else {
      break;
    }
  }

  return streak;
}
