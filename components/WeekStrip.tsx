import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { FastRecord } from '@/constants/mockData';
import { useSettings } from '@/context/SettingsContext';

// Maps WeekStart name → JS getDay() value (0=Sun, 1=Mon, …, 6=Sat)
const DAY_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getWeekDates(startDay: number): string[] {
  const today  = new Date();
  const dow    = today.getDay();                     // 0=Sun…6=Sat
  const offset = (dow - startDay + 7) % 7;          // days since week start
  const first  = new Date(today);
  first.setDate(today.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(first);
    d.setDate(first.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
}

function getDayLabels(startDay: number): string[] {
  return Array.from({ length: 7 }, (_, i) => DAY_LABELS[(startDay + i) % 7]);
}

type DayState = 'completed-hit' | 'completed-missed' | 'today' | 'future';

function DayCircle({ label, state }: { label: string; state: DayState }) {
  const bg =
    state === 'completed-hit'    ? Colors.green :
    state === 'completed-missed' ? Colors.red   :
    'transparent';

  const borderColor =
    state === 'completed-hit'    ? Colors.green :
    state === 'completed-missed' ? Colors.red   :
    state === 'today'            ? Colors.textPrimary :
    '#D5D1C8';

  const textColor =
    (state === 'completed-hit' || state === 'completed-missed') ? '#fff' :
    state === 'today' ? Colors.textPrimary :
    Colors.textMuted;

  return (
    <View style={styles.dayCol}>
      <View style={[styles.circle, { backgroundColor: bg, borderColor }]}>
        <Text style={[styles.dayText, { color: textColor }]}>{label}</Text>
      </View>
    </View>
  );
}

interface WeekStripProps {
  isActive: boolean;
  fasts: FastRecord[];
}

export function WeekStrip({ isActive, fasts }: WeekStripProps) {
  const { weekStart } = useSettings();
  const startDay = DAY_INDEX[weekStart] ?? 1;  // default Monday

  const weekDates = getWeekDates(startDay);
  const labels    = getDayLabels(startDay);
  const today     = new Date();
  const todayStr  = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const byDate    = new Map(fasts.map(f => [f.date, f]));

  const states: DayState[] = weekDates.map(date => {
    const fast = byDate.get(date);
    if (fast) return fast.goalHit ? 'completed-hit' : 'completed-missed';
    if (date === todayStr) return 'today';
    return 'future';
  });

  return (
    <View style={styles.row}>
      {labels.map((label, i) => <DayCircle key={i} label={label} state={states[i]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dayCol: { alignItems: 'center', flex: 1 },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontSize: 9, fontFamily: FONT },
});
