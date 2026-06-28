import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { FastRecord } from '@/constants/mockData';

function formatDate(dateStr: string): string {
  const d         = new Date(dateStr + 'T12:00:00');
  const today     = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDuration(h: number): string {
  const hours = Math.floor(h);
  const mins  = Math.round((h - hours) * 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function RecentFasts({ fasts }: { fasts: FastRecord[] }) {
  const recent = [...fasts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent</Text>

      {recent.length === 0 ? (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>No fasts recorded yet.</Text>
        </View>
      ) : (
        recent.map((f, i) => (
          <View key={f.id ?? i} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: f.goalHit ? Colors.green : Colors.red }]} />
            <Text style={styles.date}>{formatDate(f.date)}</Text>
            <Text style={styles.duration}>{formatDuration(f.durationHours)}</Text>
            <View style={[styles.tag, f.goalHit ? styles.tagGoal : styles.tagShort]}>
              <Text style={[styles.tagText, f.goalHit ? styles.tagTextGoal : styles.tagTextShort]}>
                {f.goalHit ? 'Goal' : 'Short'}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: FONT,
    letterSpacing: 0.16 * 9,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  date: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: FONT,
  },
  duration: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: FONT,
  },

  tag: {
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  tagShort: { borderColor: Colors.red },
  tagGoal:  { borderColor: Colors.green },
  tagText:  { fontSize: 8, fontFamily: FONT },
  tagTextShort: { color: '#A32D2D' },
  tagTextGoal:  { color: '#27500A' },

  emptyRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  emptyText: { fontSize: 13, color: Colors.textMuted, fontFamily: FONT },
});
