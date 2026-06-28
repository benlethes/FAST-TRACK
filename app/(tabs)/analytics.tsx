import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { FastRecord } from '@/constants/mockData';
import { useFastingContext } from '@/context/FastingContext';
import { Wordmark } from '@/components/Wordmark';
import { DurationChart } from '@/components/DurationChart';
import { HorizontalBarChart } from '@/components/HorizontalBarChart';
import { WeeklyHeatmap } from '@/components/WeeklyHeatmap';

// ─── Types ────────────────────────────────────────────────────────────────────

type RangeKey = '7d' | '14d' | '30d' | '3M' | '6M' | '1Y' | 'All';

const RANGES: { key: RangeKey; label: string; days: number | null }[] = [
  { key: '7d',  label: '7d',  days: 7 },
  { key: '14d', label: '14d', days: 14 },
  { key: '30d', label: '30d', days: 30 },
  { key: '3M',  label: '3M',  days: 90 },
  { key: '6M',  label: '6M',  days: 180 },
  { key: '1Y',  label: '1Y',  days: 365 },
  { key: 'All', label: 'All', days: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function filterFasts(all: FastRecord[], days: number | null): FastRecord[] {
  if (days === null) return all;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const y = cutoff.getFullYear(), m = String(cutoff.getMonth() + 1).padStart(2, '0'), d = String(cutoff.getDate()).padStart(2, '0');
  return all.filter(f => f.date >= `${y}-${m}-${d}`);
}

function avg(nums: number[]): number {
  return nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;
}

function computeStreak(fasts: FastRecord[]): { current: number; longest: number } {
  if (fasts.length === 0) return { current: 0, longest: 0 };
  const sorted = [...fasts].sort((a, b) => b.date.localeCompare(a.date));

  let longest = 0, run = 0, prevDate: string | null = null;
  for (const f of sorted) {
    if (!f.goalHit) { run = 0; prevDate = null; continue; }
    run = !prevDate ? 1 : Math.round((new Date(prevDate).getTime() - new Date(f.date).getTime()) / 86400000) === 1 ? run + 1 : 1;
    prevDate = f.date;
    if (run > longest) longest = run;
  }

  let current = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const f  = sorted.find(x => x.date === ds);
    if (f && f.goalHit) { current++; }
    else if (i > 0)     { break; }
    d.setDate(d.getDate() - 1);
  }
  return { current, longest };
}

function buildHalfHourBuckets(fasts: FastRecord[], field: 'startTime' | 'endTime', startH: number, endH: number) {
  const buckets: { label: string; count: number }[] = [];
  for (let h = startH; h <= endH; h++) {
    for (const m of [0, 30]) {
      if (h === endH && m === 30) break;
      buckets.push({ label: `${String(h).padStart(2, '0')}:${m === 0 ? '00' : '30'}`, count: 0 });
    }
  }
  for (const f of fasts) {
    const [h, m] = f[field].split(':').map(Number);
    const rounded = Math.round((h * 60 + m) / 30) * 30;
    const key = `${String(Math.floor(rounded / 60)).padStart(2, '0')}:${rounded % 60 === 0 ? '00' : '30'}`;
    const bucket = buckets.find(b => b.label === key);
    if (bucket) bucket.count++;
  }
  return buckets;
}

export type DayState = 'hit' | 'missed' | 'empty' | 'future';
export interface DayCell { dateStr: string; state: DayState }
export interface WeekRow { label: string; days: DayCell[]; hitCount: number; totalFasts: number }

function buildHeatmapWeeks(fasts: FastRecord[], numWeeks: number): WeekRow[] {
  const today       = new Date();
  const todayStr    = today.toISOString().split('T')[0];
  const fastsByDate = new Map(fasts.map(f => [f.date, f]));

  return Array.from({ length: numWeeks }, (_, rev) => {
    const w       = numWeeks - 1 - rev;
    const refDate = new Date(today);
    refDate.setDate(today.getDate() - w * 7);
    const dow    = refDate.getDay();
    const monday = new Date(refDate);
    monday.setDate(refDate.getDate() - ((dow + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const days: DayCell[] = Array.from({ length: 7 }, (_, d) => {
      const day     = new Date(monday);
      day.setDate(monday.getDate() + d);
      const dateStr = day.toISOString().split('T')[0];
      if (dateStr > todayStr) return { dateStr, state: 'future' };
      const fast = fastsByDate.get(dateStr);
      return { dateStr, state: fast ? (fast.goalHit ? 'hit' : 'missed') : 'empty' };
    });

    return {
      label:      w === 0 ? 'Now' : monday.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      days,
      hitCount:   days.filter(d => d.state === 'hit').length,
      totalFasts: days.filter(d => d.state === 'hit' || d.state === 'missed').length,
    };
  });
}

function rangeToWeeks(days: number | null) { return days === null ? 52 : Math.min(Math.ceil(days / 7) + 1, 52); }

function generateInsight(fasts: FastRecord[]): string {
  if (fasts.length < 5) return 'Log more fasts to unlock personalized insights.';
  const early = fasts.filter(f => parseInt(f.startTime.split(':')[0]) < 19);
  const late  = fasts.filter(f => parseInt(f.startTime.split(':')[0]) >= 19);
  const diff  = Math.abs(avg(early.map(f => f.durationHours)) - avg(late.map(f => f.durationHours)));
  if (diff > 0.3) {
    return avg(early.map(f => f.durationHours)) > avg(late.map(f => f.durationHours))
      ? `Fasts started before 19:00 average ${diff.toFixed(1)}h longer than later starts.`
      : `Fasts started at 19:00 or later average ${diff.toFixed(1)}h longer than earlier starts.`;
  }
  return `You've hit your fasting goal ${Math.round(fasts.filter(f => f.goalHit).length / fasts.length * 100)}% of the time in this period.`;
}

const GOAL_HOURS = 16;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const { fasts: allFasts } = useFastingContext();
  const [range, setRange]             = useState<RangeKey>('14d');
  const { days }                      = RANGES.find(r => r.key === range)!;

  const fasts = useMemo(() => filterFasts(allFasts, days), [allFasts, days]);

  const avgFast     = avg(fasts.map(f => f.durationHours));
  const goalHitRate = fasts.length > 0 ? fasts.filter(f => f.goalHit).length / fasts.length : 0;
  const { current: currentStreak, longest: longestStreak } = useMemo(() => computeStreak(fasts), [fasts]);

  const numWeeks     = rangeToWeeks(days);
  const startBuckets = useMemo(() => buildHalfHourBuckets(fasts, 'startTime', 17, 23), [fasts]);
  const mealBuckets  = useMemo(() => buildHalfHourBuckets(fasts, 'endTime',    9, 15), [fasts]);
  const heatmapWeeks = useMemo(() => buildHeatmapWeeks(fasts, numWeeks), [fasts, numWeeks]);
  const insight      = useMemo(() => generateInsight(fasts), [fasts]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <Wordmark />
          <Text style={styles.screenLabel}>Analytics</Text>
        </View>

        {/* Range tabs — centered */}
        <View style={styles.rangeContainer}>
          <View style={styles.rangeRow}>
            {RANGES.map(r => {
              const active = r.key === range;
              return (
                <TouchableOpacity key={r.key} onPress={() => setRange(r.key)} style={styles.tab} activeOpacity={0.6}>
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{r.label}</Text>
                  {active && <View style={styles.tabUnderline} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.rangeBaseline} />
        </View>

        {/* 2×2 stat grid — explicit rows to guarantee the matrix layout */}
        <View style={styles.gridWrap}>
          <View style={styles.gridRow}>
            <View style={styles.statTile}>
              <Text style={styles.statNum}>{avgFast.toFixed(1)}</Text>
              <Text style={styles.statName}>Avg Fast</Text>
            </View>
            <View style={styles.gridVDivider} />
            <View style={styles.statTile}>
              <Text style={styles.statNum}>{fasts.length}</Text>
              <Text style={styles.statName}>Total Fasts</Text>
              <Text style={styles.statSub}>last {days ?? 'all'} days</Text>
            </View>
          </View>
          <View style={styles.gridHDivider} />
          <View style={styles.gridRow}>
            <View style={styles.statTile}>
              <Text style={styles.statNum}>{Math.round(goalHitRate * 100)}%</Text>
              <Text style={styles.statName}>Goal Hit Rate</Text>
            </View>
            <View style={styles.gridVDivider} />
            <View style={styles.statTile}>
              <Text style={styles.statNum}>{currentStreak}</Text>
              <Text style={styles.statName}>Streak</Text>
              <Text style={styles.statSub}>{currentStreak === 1 ? 'day' : 'days'}</Text>
            </View>
          </View>
        </View>

        {/* Streaks card */}
        <View style={styles.streaksCard}>
          <Text style={styles.streaksLabel}>Streaks 🔥</Text>
          <View style={styles.streaksRow}>
            <View style={styles.streakItem}>
              <Text style={styles.streakNum}>{currentStreak}</Text>
              <Text style={styles.streakSub}>Current</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakItem}>
              <Text style={styles.streakNum}>{longestStreak}</Text>
              <Text style={styles.streakSub}>Longest</Text>
            </View>
          </View>
        </View>

        {/* Duration chart */}
        <DurationChart fasts={fasts} goalHours={GOAL_HOURS} />

        {/* Start Time distribution */}
        <HorizontalBarChart title="Start Time" buckets={startBuckets} color={Colors.amber} />

        {/* First Meal distribution */}
        <HorizontalBarChart title="First Meal" buckets={mealBuckets} color={Colors.sky} />

        {/* Weekly heatmap */}
        <WeeklyHeatmap weeks={heatmapWeeks} />

        {/* Insight */}
        <View style={styles.insightCard}>
          <Text style={styles.insightText}>{insight}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  scroll:  { flex: 1 },
  content: { paddingBottom: 44, gap: 16 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14,
  },
  screenLabel: {
    fontSize: 9, color: Colors.textMuted, fontFamily: FONT,
    letterSpacing: 0.16 * 9, textTransform: 'uppercase',
  },

  // Centered range tabs
  rangeContainer: { paddingHorizontal: 20 },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'nowrap',
  },
  tab: { paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', position: 'relative' },
  tabText: { fontSize: 13, color: Colors.textMuted, fontFamily: FONT },
  tabTextActive: { color: Colors.textPrimary, fontWeight: '600' },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: 10, right: 10,
    height: 2, backgroundColor: Colors.red, borderRadius: 1,
  },
  rangeBaseline: { height: 1, backgroundColor: Colors.border },

  // 2×2 grid
  gridWrap: {
    paddingHorizontal: 20,
    backgroundColor: Colors.border,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 1,
  },
  gridRow: { flexDirection: 'row', backgroundColor: Colors.border, gap: 1 },
  gridVDivider: { width: 1, backgroundColor: Colors.border },
  gridHDivider: { height: 1, backgroundColor: Colors.border },
  statTile: { flex: 1, backgroundColor: Colors.card, padding: 14 },
  statNum:  { fontSize: 26, fontWeight: '200', color: Colors.textPrimary, fontFamily: FONT },
  statName: { fontSize: 8, color: Colors.textMuted, letterSpacing: 0.12 * 8, textTransform: 'uppercase', fontFamily: FONT, marginTop: 3 },
  statSub:  { fontSize: 8, color: Colors.textMuted, fontFamily: FONT, marginTop: 1 },

  // Streaks
  streaksCard: { backgroundColor: Colors.card, marginHorizontal: 20, padding: 16 },
  streaksLabel: {
    fontSize: 9, color: Colors.textMuted, fontFamily: FONT,
    letterSpacing: 0.12 * 9, textTransform: 'uppercase', marginBottom: 14,
  },
  streaksRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  streakItem: { alignItems: 'center', flex: 1 },
  streakNum:  { fontSize: 40, fontWeight: '200', color: Colors.textPrimary, fontFamily: FONT },
  streakSub:  { fontSize: 9, color: Colors.textMuted, letterSpacing: 0.12 * 9, textTransform: 'uppercase', fontFamily: FONT, marginTop: 2 },
  streakDivider: { width: 1, height: 54, backgroundColor: Colors.border },

  // Insight
  insightCard: { backgroundColor: Colors.card, marginHorizontal: 20, padding: 16 },
  insightText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 22, fontStyle: 'italic', fontFamily: FONT },
});
