import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { FastRecord } from '@/constants/mockData';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00'); // noon to avoid timezone shift
  const today = new Date();
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

interface RecentFastsProps {
  fasts: FastRecord[];
}

export function RecentFasts({ fasts }: RecentFastsProps) {
  const recent = [...fasts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  if (recent.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent</Text>
        <View style={styles.list}>
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No fasts recorded yet. Tap Start Fast to begin.</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent</Text>
      <View style={styles.list}>
        {recent.map((f, i) => (
          <View key={f.id ?? i} style={[styles.row, i === recent.length - 1 && styles.rowLast]}>
            <View style={[styles.dot, { backgroundColor: f.goalHit ? Colors.green : Colors.coral }]} />
            <Text style={styles.date}>{formatDate(f.date)}</Text>
            <Text style={styles.duration}>{formatDuration(f.durationHours)}</Text>
            <View style={[styles.badge, { backgroundColor: (f.goalHit ? Colors.green : Colors.coral) + '22' }]}>
              <Text style={[styles.badgeText, { color: f.goalHit ? Colors.green : Colors.coral }]}>
                {f.goalHit ? 'Goal' : 'Short'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 20, gap: 10 },
  sectionTitle: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: FONT,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  list: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  date: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontFamily: FONT },
  duration: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: FONT,
    marginRight: 4,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '600', fontFamily: FONT },
  empty: { padding: 20 },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: FONT,
    textAlign: 'center',
    lineHeight: 20,
  },
});
