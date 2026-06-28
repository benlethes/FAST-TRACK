import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { FastRecord } from '@/constants/mockData';
import { useFastingContext } from '@/context/FastingContext';
import { useWeightContext } from '@/context/WeightContext';
import { Wordmark } from '@/components/Wordmark';
import { DurationChart } from '@/components/DurationChart';
import { HorizontalBarChart } from '@/components/HorizontalBarChart';
import { WeeklyHeatmap } from '@/components/WeeklyHeatmap';
import { WeightChart } from '@/components/WeightChart';

// ─── Date ranges ─────────────────────────────────────────────────────────────

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

function filterFasts(all: FastRecord[], days: number | null): FastRecord[] {
  if (days === null) return all;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const y = cutoff.getFullYear(), m = String(cutoff.getMonth() + 1).padStart(2, '0'), d = String(cutoff.getDate()).padStart(2, '0');
  const cutoffStr = `${y}-${m}-${d}`;
  return all.filter(f => f.date >= cutoffStr);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function avg(nums: number[]): number {
  return nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;
}

function computeStreak(fasts: FastRecord[]): { current: number; longest: number } {
  if (fasts.length === 0) return { current: 0, longest: 0 };
  const sorted = [...fasts].sort((a, b) => b.date.localeCompare(a.date));

  let longest = 0, run = 0;
  let prevDate: string | null = null;
  for (const f of sorted) {
    if (!f.goalHit) { run = 0; prevDate = null; continue; }
    if (!prevDate) { run = 1; }
    else {
      const diff = Math.round(
        (new Date(prevDate).getTime() - new Date(f.date).getTime()) / 86400000
      );
      run = diff === 1 ? run + 1 : 1;
    }
    prevDate = f.date;
    if (run > longest) longest = run;
  }

  let current = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const ds = d.toISOString().split('T')[0];
    const f = sorted.find(x => x.date === ds);
    if (f && f.goalHit) { current++; }
    else if (i > 0) { break; }
    d.setDate(d.getDate() - 1);
  }

  return { current, longest };
}

// ─── 30-min distribution buckets ─────────────────────────────────────────────

function buildHalfHourBuckets(
  fasts: FastRecord[],
  field: 'startTime' | 'endTime',
  startH: number,
  endH: number
) {
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
    const bh = Math.floor(rounded / 60);
    const bm = rounded % 60;
    const key = `${String(bh).padStart(2, '0')}:${bm === 0 ? '00' : '30'}`;
    const bucket = buckets.find(b => b.label === key);
    if (bucket) bucket.count++;
  }
  return buckets;
}

// ─── Heatmap data ─────────────────────────────────────────────────────────────

export type DayState = 'hit' | 'missed' | 'empty' | 'future';

export interface DayCell {
  dateStr: string;
  state: DayState;
}

export interface WeekRow {
  label: string;
  days: DayCell[];
  hitCount: number;
  totalFasts: number;
}

function buildHeatmapWeeks(fasts: FastRecord[], numWeeks: number): WeekRow[] {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const fastsByDate = new Map(fasts.map(f => [f.date, f]));

  return Array.from({ length: numWeeks }, (_, rev) => {
    const w = numWeeks - 1 - rev;

    // Find Monday of the target week
    const refDate = new Date(today);
    refDate.setDate(today.getDate() - w * 7);
    const dow = refDate.getDay();
    const monday = new Date(refDate);
    monday.setDate(refDate.getDate() - ((dow + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const days: DayCell[] = Array.from({ length: 7 }, (_, d) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + d);
      const dateStr = day.toISOString().split('T')[0];
      if (dateStr > todayStr) return { dateStr, state: 'future' as DayState };
      const fast = fastsByDate.get(dateStr);
      if (fast) return { dateStr, state: (fast.goalHit ? 'hit' : 'missed') as DayState };
      return { dateStr, state: 'empty' as DayState };
    });

    const shortDate = monday.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    return {
      label: w === 0 ? 'Now' : shortDate,
      days,
      hitCount: days.filter(d => d.state === 'hit').length,
      totalFasts: days.filter(d => d.state === 'hit' || d.state === 'missed').length,
    };
  });
}

function rangeToWeeks(days: number | null): number {
  if (days === null) return 52;
  return Math.min(Math.ceil(days / 7) + 1, 52);
}

// ─── Insight ──────────────────────────────────────────────────────────────────

function generateInsight(fasts: FastRecord[]): string {
  if (fasts.length < 5) return 'Log more fasts to unlock personalized insights.';
  const early = fasts.filter(f => parseInt(f.startTime.split(':')[0]) < 19);
  const late  = fasts.filter(f => parseInt(f.startTime.split(':')[0]) >= 19);
  const diff = Math.abs(avg(early.map(f => f.durationHours)) - avg(late.map(f => f.durationHours)));
  if (diff > 0.3) {
    const earlyLonger = avg(early.map(f => f.durationHours)) > avg(late.map(f => f.durationHours));
    return earlyLonger
      ? `Fasts started before 19:00 average ${diff.toFixed(1)}h longer than later starts.`
      : `Fasts started at 19:00 or later average ${diff.toFixed(1)}h longer than earlier starts.`;
  }
  return `You've hit your fasting goal ${Math.round(
    fasts.filter(f => f.goalHit).length / fasts.length * 100
  )}% of the time in this period.`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const GOAL_HOURS = 16;

export default function AnalyticsScreen() {
  const { fasts: allFasts, importFasts, resetToMockData, clearAllData } = useFastingContext();
  const { records: allWeightRecords } = useWeightContext();
  const [range, setRange] = useState<RangeKey>('14d');
  const { days } = RANGES.find(r => r.key === range)!;
  const fasts = useMemo(() => filterFasts(allFasts, days), [allFasts, days]);
  const weightRecords = useMemo(() => {
    if (days === null) return allWeightRecords;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
    return allWeightRecords.filter(r => r.date >= cutoffStr);
  }, [allWeightRecords, days]);

  const handleExport = async () => {
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const filename = `fasttrack-backup-${dateStr}.json`;
      const path = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(allFasts, null, 2));
      await Sharing.shareAsync(path, {
        mimeType: 'application/json',
        dialogTitle: 'Save your FAST//TRACK backup',
        UTI: 'public.json',
      });
    } catch (e) {
      Alert.alert('Export failed', 'Could not export your data. Please try again.');
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const parsed: unknown = JSON.parse(content);

      if (!Array.isArray(parsed)) {
        Alert.alert('Invalid file', 'This file does not contain a valid FAST//TRACK backup.');
        return;
      }

      const valid = (parsed as FastRecord[]).filter(
        f => typeof f.date === 'string' &&
             typeof f.startTime === 'string' &&
             typeof f.endTime === 'string' &&
             typeof f.durationHours === 'number' &&
             typeof f.goalHours === 'number' &&
             typeof f.goalHit === 'boolean'
      );

      if (valid.length === 0) {
        Alert.alert('No valid records', 'The file contained no recognisable fast records.');
        return;
      }

      Alert.alert(
        'Import backup',
        `Found ${valid.length} fast${valid.length === 1 ? '' : 's'}. This will replace your current data.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Import ${valid.length} fasts`,
            onPress: () => importFasts(valid),
          },
        ]
      );
    } catch (e) {
      Alert.alert('Import failed', 'Could not read that file. Make sure it is a valid FAST//TRACK backup.');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Data',
      'Choose an option:',
      [
        {
          text: 'Restore demo data',
          onPress: resetToMockData,
        },
        {
          text: 'Clear everything',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Clear all fasts?', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearAllData },
            ]),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const avgFast      = avg(fasts.map(f => f.durationHours));
  const goalHitRate  = fasts.length > 0 ? fasts.filter(f => f.goalHit).length / fasts.length : 0;
  const { current: currentStreak, longest: longestStreak } = useMemo(() => computeStreak(fasts), [fasts]);

  const numWeeks = rangeToWeeks(days);

  const startBuckets = useMemo(() => buildHalfHourBuckets(fasts, 'startTime', 17, 23), [fasts]);
  const mealBuckets  = useMemo(() => buildHalfHourBuckets(fasts, 'endTime',   9,  15), [fasts]);
  const heatmapWeeks = useMemo(() => buildHeatmapWeeks(fasts, numWeeks), [fasts, numWeeks]);
  const insight      = useMemo(() => generateInsight(fasts), [fasts]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Wordmark />
          <Text style={styles.screenLabel}>Analytics</Text>
        </View>

        {/* ── Date range — underline tab style ── */}
        <View style={styles.rangeContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rangeRow}
          >
            {RANGES.map(r => {
              const active = r.key === range;
              return (
                <TouchableOpacity
                  key={r.key}
                  onPress={() => setRange(r.key)}
                  style={styles.tab}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {r.label}
                  </Text>
                  {active && <View style={styles.tabUnderline} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.rangeBaseline} />
        </View>

        {/* ── 2×2 stat grid ── */}
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{avgFast.toFixed(1)}h</Text>
              <Text style={styles.statName}>Avg Fast</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{fasts.length}</Text>
              <Text style={styles.statName}>Total Fasts</Text>
              <Text style={styles.statSub}>last {days ?? 'all'} days</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{Math.round(goalHitRate * 100)}%</Text>
              <Text style={styles.statName}>Goal Hit Rate</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{currentStreak} 🔥</Text>
              <Text style={styles.statName}>Streak</Text>
              <Text style={styles.statSub}>{currentStreak === 1 ? 'day' : 'days'}</Text>
            </View>
          </View>
        </View>

        {/* ── Streak card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔥 Streaks</Text>
          <View style={styles.streakRow}>
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

        {/* ── Duration chart ── */}
        <DurationChart fasts={fasts} goalHours={GOAL_HOURS} />

        {/* ── Weight chart ── */}
        <WeightChart records={weightRecords} />

        {/* ── Start Time — amber ── */}
        <HorizontalBarChart
          title="Start Time"
          buckets={startBuckets}
          color={Colors.amber}
        />

        {/* ── First Meal — sky ── */}
        <HorizontalBarChart
          title="First Meal"
          buckets={mealBuckets}
          color={Colors.sky}
        />

        {/* ── Weekly heatmap ── */}
        <WeeklyHeatmap weeks={heatmapWeeks} />

        {/* ── Insight ── */}
        <View style={[styles.card, styles.insightCard]}>
          <Text style={styles.insightText}>{insight}</Text>
        </View>

        {/* ── Data management ── */}
        <View style={styles.dataRow}>
          <TouchableOpacity style={styles.dataBtn} onPress={handleExport} activeOpacity={0.6}>
            <Text style={styles.dataText}>Export Data</Text>
          </TouchableOpacity>
          <View style={styles.dataDivider} />
          <TouchableOpacity style={styles.dataBtn} onPress={handleImport} activeOpacity={0.6}>
            <Text style={styles.dataText}>Import Data</Text>
          </TouchableOpacity>
          <View style={styles.dataDivider} />
          <TouchableOpacity style={styles.dataBtn} onPress={handleReset} activeOpacity={0.6}>
            <Text style={styles.dataText}>Reset / Clear</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 44, gap: 16 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  screenLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: FONT,
  },

  // Underline range selector
  rangeContainer: {
    marginHorizontal: 20,
  },
  rangeRow: {
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: FONT,
    fontWeight: '400',
  },
  tabTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: Colors.coral,
    borderRadius: 1,
  },
  rangeBaseline: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 0,
  },

  // 2×2 grid
  grid: { paddingHorizontal: 20, gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  statNum: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.textPrimary,
    fontFamily: FONT,
  },
  statName: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
    fontFamily: FONT,
  },
  statSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
    fontFamily: FONT,
  },

  // Cards
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginHorizontal: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: FONT,
    marginBottom: 14,
  },

  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  streakItem: { alignItems: 'center', flex: 1 },
  streakNum: {
    fontSize: 40,
    fontWeight: '200',
    color: Colors.textPrimary,
    fontFamily: FONT,
  },
  streakSub: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: FONT,
    marginTop: 2,
  },
  streakDivider: {
    width: 1,
    height: 54,
    backgroundColor: Colors.border,
  },

  insightCard: {},
  insightText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
    fontStyle: 'italic',
    fontFamily: FONT,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 4,
  },
  dataBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dataText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: FONT,
    textDecorationLine: 'underline',
  },
  dataDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border,
  },
});
