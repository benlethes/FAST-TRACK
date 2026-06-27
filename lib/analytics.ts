import { FastRecord, fastDurationHours, goalHit } from "./store";

export type DateRange = 7 | 14 | 30 | 90;

export function filterByDays(records: FastRecord[], days: DateRange): FastRecord[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return records.filter((r) => r.endTime >= cutoff);
}

export function avgFastHours(records: FastRecord[]): number {
  if (records.length === 0) return 0;
  return records.reduce((s, r) => s + fastDurationHours(r), 0) / records.length;
}

export function goalHitRate(records: FastRecord[]): number {
  if (records.length === 0) return 0;
  return (records.filter(goalHit).length / records.length) * 100;
}

export function currentStreak(records: FastRecord[]): number {
  if (records.length === 0) return 0;
  const sorted = [...records].sort((a, b) => b.endTime - a.endTime);
  const oneDay = 24 * 60 * 60 * 1000;
  let streak = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);
  for (const r of sorted) {
    const endDay = new Date(r.endTime);
    endDay.setHours(0, 0, 0, 0);
    const diff = (checkDate.getTime() - endDay.getTime()) / oneDay;
    if (diff <= 1) {
      streak++;
      checkDate = new Date(endDay.getTime() - oneDay);
    } else break;
  }
  return streak;
}

export function longestStreak(records: FastRecord[]): number {
  if (records.length === 0) return 0;
  const sorted = [...records].sort((a, b) => a.endTime - b.endTime);
  const oneDay = 24 * 60 * 60 * 1000;
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].endTime);
    const curr = new Date(sorted[i].endTime);
    prev.setHours(0, 0, 0, 0);
    curr.setHours(0, 0, 0, 0);
    const diff = (curr.getTime() - prev.getTime()) / oneDay;
    if (diff <= 1) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}

// Returns last N days as { label, durationH, hit, goalH }
export function buildDurationChartData(
  records: FastRecord[],
  days: DateRange,
  goalHours: number
) {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (days - 1 - i));
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    const record = records.find((r) => r.endTime >= day.getTime() && r.endTime < nextDay.getTime());
    const durationH = record ? Math.round(fastDurationHours(record) * 10) / 10 : 0;
    const hit = record ? goalHit(record) : false;

    return {
      label: day.toLocaleDateString([], { month: "numeric", day: "numeric" }),
      durationH,
      hit,
      goalH: goalHours,
    };
  });
}

// Build rolling 7-day average per day
export function buildRollingAvg(data: { durationH: number }[]): number[] {
  return data.map((_, i) => {
    const window = data.slice(Math.max(0, i - 6), i + 1).filter((d) => d.durationH > 0);
    if (window.length === 0) return 0;
    return Math.round((window.reduce((s, d) => s + d.durationH, 0) / window.length) * 10) / 10;
  });
}

// Start time distribution buckets (17:00–23:00)
export function buildStartTimeData(records: FastRecord[]) {
  const buckets: Record<string, number> = {};
  for (let h = 17; h <= 23; h++) {
    buckets[`${h}:00`] = 0;
  }
  records.forEach((r) => {
    const h = new Date(r.startTime).getHours();
    const key = `${h}:00`;
    if (buckets[key] !== undefined) buckets[key]++;
  });
  return Object.entries(buckets).map(([time, count]) => ({ time, count }));
}

// First meal distribution buckets (10:00–16:00)
export function buildFirstMealData(records: FastRecord[]) {
  const buckets: Record<string, number> = {};
  for (let h = 10; h <= 16; h++) {
    buckets[`${h}:00`] = 0;
  }
  records.forEach((r) => {
    const h = new Date(r.endTime).getHours();
    const key = `${h}:00`;
    if (buckets[key] !== undefined) buckets[key]++;
  });
  return Object.entries(buckets).map(([time, count]) => ({ time, count }));
}

// Weekly achievement
export function buildWeeklyData(records: FastRecord[], weeks = 5) {
  const now = new Date();
  return Array.from({ length: weeks }, (_, i) => {
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - i * 7);
    weekEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const weekRecords = records.filter(
      (r) => r.endTime >= weekStart.getTime() && r.endTime <= weekEnd.getTime()
    );
    const pct = weekRecords.length > 0
      ? (weekRecords.filter(goalHit).length / weekRecords.length) * 100
      : 0;

    return {
      label: `W-${i === 0 ? "cur" : i}`,
      pct: Math.round(pct),
      fill: pct >= 70 ? "#4caf7d" : pct >= 40 ? "#f5a623" : "#ff5c5c",
    };
  }).reverse();
}

export function generateInsight(records: FastRecord[]): string {
  if (records.length < 5) return "Keep fasting — more data will reveal your patterns.";

  // Compare fasts started before 19:00 vs after
  const earlyStarts = records.filter((r) => new Date(r.startTime).getHours() < 19);
  const lateStarts = records.filter((r) => new Date(r.startTime).getHours() >= 19);

  if (earlyStarts.length >= 3 && lateStarts.length >= 3) {
    const earlyAvg = avgFastHours(earlyStarts);
    const lateAvg = avgFastHours(lateStarts);
    const diff = Math.abs(earlyAvg - lateAvg).toFixed(1);
    if (earlyAvg > lateAvg) {
      return `Fasts started before 19:00 average ${diff}h longer than later starts.`;
    } else {
      return `Later evening starts tend to produce ${diff}h longer fasts on average.`;
    }
  }

  const rate = goalHitRate(records);
  if (rate >= 70) {
    return `You&apos;re hitting your goal ${Math.round(rate)}% of the time — great consistency.`;
  }
  if (rate < 50) {
    return `Your goal hit rate is ${Math.round(rate)}%. Consider a shorter goal to build consistency.`;
  }
  return `You&apos;re hitting your goal about ${Math.round(rate)}% of the time.`;
}
