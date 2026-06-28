import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { FastRecord } from '@/constants/mockData';
import { useSettings } from '@/context/SettingsContext';

function getWeekDates(startOnMonday: boolean): string[] {
  const today = new Date();
  const dow   = today.getDay(); // 0=Sun…6=Sat
  // Offset so week starts on chosen day
  const offset = startOnMonday ? (dow + 6) % 7 : dow;
  const first  = new Date(today);
  first.setDate(today.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(first);
    d.setDate(first.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
}

function getDayLabels(startOnMonday: boolean): string[] {
  return startOnMonday
    ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
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
  const startOnMonday = weekStart === 'Monday';

  const weekDates = getWeekDates(startOnMonday);
  const labels    = getDayLabels(startOnMonday);
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
