import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import type { WeekRow, DayState } from '@/app/(tabs)/analytics';

const CELL = 26;
const GAP  = 3;
const HEADER_H = 22;
const COUNT_H  = 18;
const DAY_LABEL_W = 18;

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function cellBg(state: DayState): string {
  switch (state) {
    case 'hit':    return Colors.green;
    case 'missed': return Colors.coral;
    default:       return 'transparent';
  }
}

function cellBorder(state: DayState): string {
  switch (state) {
    case 'hit':    return Colors.green;
    case 'missed': return Colors.coral;
    default:       return Colors.border;
  }
}

function cellOpacity(state: DayState): number {
  return state === 'future' ? 0.25 : 1;
}

function trendLabel(weeks: WeekRow[]): string {
  if (weeks.length < 2) return '';
  const last = weeks[weeks.length - 1];
  const prev = weeks[weeks.length - 2];
  const r1 = last.totalFasts > 0 ? last.hitCount / last.totalFasts : 0;
  const r2 = prev.totalFasts > 0 ? prev.hitCount / prev.totalFasts : 0;
  if (r1 - r2 > 0.1)  return '▲ Improving';
  if (r2 - r1 > 0.1)  return '▼ Declining';
  return '→ Steady';
}

function trendColor(t: string): string {
  if (t.startsWith('▲')) return Colors.green;
  if (t.startsWith('▼')) return Colors.coral;
  return Colors.textMuted;
}

export function WeeklyHeatmap({ weeks }: { weeks: WeekRow[] }) {
  const scrollRef = useRef<ScrollView>(null);
  const trend = trendLabel(weeks);

  // Always land on the most recent (rightmost) week
  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
    return () => clearTimeout(t);
  }, [weeks.length]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Activity</Text>
        {trend !== '' && (
          <Text style={[styles.trend, { color: trendColor(trend) }]}>{trend}</Text>
        )}
      </View>

      <View style={styles.gridRow}>
        {/* ── Fixed day-label column ── */}
        <View style={styles.labelCol}>
          {/* Align with week headers */}
          <View style={{ height: HEADER_H + GAP }} />
          {DAY_LABELS.map((d, i) => (
            <View key={i} style={styles.labelCell}>
              <Text style={styles.dayLabel}>{d}</Text>
            </View>
          ))}
          {/* Align with count row */}
          <View style={{ height: COUNT_H + GAP }} />
        </View>

        {/* ── Scrollable week columns ── */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weeksContent}
        >
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekCol}>
              {/* Week label */}
              <Text
                style={[styles.weekLabel, wi === weeks.length - 1 && styles.weekLabelNow]}
                numberOfLines={1}
              >
                {week.label}
              </Text>

              {/* Day cells */}
              {week.days.map((day, di) => (
                <View
                  key={di}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: cellBg(day.state),
                      borderColor: cellBorder(day.state),
                      opacity: cellOpacity(day.state),
                    },
                  ]}
                />
              ))}

              {/* Hit / total */}
              <Text style={styles.weekCount}>
                {week.totalFasts > 0 ? `${week.hitCount}/${week.totalFasts}` : '·'}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: Colors.green,  label: 'Goal hit' },
          { color: Colors.coral,  label: 'Missed'   },
          { color: 'transparent', label: 'No fast'  },
        ].map(item => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendCell, {
              backgroundColor: item.color,
              borderColor: item.color === 'transparent' ? Colors.border : item.color,
            }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginHorizontal: 20,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: FONT,
  },
  trend: {
    fontSize: 12,
    fontFamily: FONT,
    fontWeight: '500',
  },

  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // Fixed labels
  labelCol: {
    width: DAY_LABEL_W,
    gap: GAP,
    marginRight: GAP,
  },
  labelCell: {
    height: CELL,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  dayLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: FONT,
  },

  // Scrollable weeks
  weeksContent: {
    flexDirection: 'row',
    gap: GAP,
  },
  weekCol: {
    width: CELL,
    gap: GAP,
    alignItems: 'center',
  },
  weekLabel: {
    height: HEADER_H,
    fontSize: 8,
    color: Colors.textMuted,
    fontFamily: FONT,
    textAlign: 'center',
    lineHeight: HEADER_H,
  },
  weekLabelNow: {
    color: Colors.coral,
    fontWeight: '600',
    fontSize: 9,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 5,
    borderWidth: 1.2,
  },
  weekCount: {
    height: COUNT_H,
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: FONT,
    textAlign: 'center',
    lineHeight: COUNT_H,
  },

  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1.2,
  },
  legendText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: FONT,
  },
});
