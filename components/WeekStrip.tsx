import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { FastRecord } from '@/constants/mockData';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getWeekDates(): string[] {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
}

type DayState = 'completed-hit' | 'completed-missed' | 'today-active' | 'future';

function DayCircle({ label, state }: { label: string; state: DayState }) {
  const filled = state === 'completed-hit' || state === 'completed-missed';
  const isToday = state === 'today-active';
  const color =
    state === 'completed-hit'    ? Colors.green :
    state === 'completed-missed' ? Colors.coral :
    state === 'today-active'     ? Colors.amber :
    Colors.border;

  return (
    <View style={styles.dayCol}>
      <View style={[
        styles.circle,
        filled  ? { backgroundColor: color, borderColor: color } :
        isToday ? { borderColor: color, borderWidth: 2 } :
                  { borderColor: Colors.border },
      ]}>
        <Text style={[styles.dayText, { color: filled ? '#fff' : isToday ? color : Colors.textMuted }]}>
          {label}
        </Text>
      </View>
    </View>
  );
}

interface WeekStripProps {
  isActive: boolean;
  fasts: FastRecord[];
}

export function WeekStrip({ isActive, fasts }: WeekStripProps) {
  const weekDates = getWeekDates();
  const today = weekDates[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const byDate = new Map(fasts.map(f => [f.date, f]));

  const states: DayState[] = weekDates.map(date => {
    const fast = byDate.get(date);
    if (fast) return fast.goalHit ? 'completed-hit' : 'completed-missed';
    if (date === today) return isActive ? 'today-active' : 'future';
    return 'future';
  });

  return (
    <View style={styles.row}>
      {DAYS.map((label, i) => <DayCircle key={i} label={label} state={states[i]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dayCol: { alignItems: 'center', flex: 1 },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT,
  },
});
