import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_W = SCREEN_WIDTH - 80;
const CHART_H = 130;
const PAD = { top: 20, bottom: 28, left: 8, right: 8 };
const INNER_W = CHART_W - PAD.left - PAD.right;
const INNER_H = CHART_H - PAD.top - PAD.bottom;

interface WeekBucket {
  label: string;
  rate: number;
}

export function WeeklyChart({ weeks }: { weeks: WeekBucket[] }) {
  const n = weeks.length;
  const barW = Math.min(INNER_W / n - 10, 40);

  const getColor = (rate: number) => {
    if (rate >= 0.7) return Colors.green;
    if (rate >= 0.4) return Colors.orange;
    return Colors.coral;
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Weekly Goal Achievement</Text>
      <Svg width={CHART_W} height={CHART_H}>
        {weeks.map((w, i) => {
          const barH = Math.max(w.rate * INNER_H, 2);
          const x = PAD.left + (i + 0.5) * (INNER_W / n) - barW / 2;
          const y = PAD.top + INNER_H - barH;
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={y} width={barW} height={barH} rx={4} fill={getColor(w.rate)} opacity={0.8} />
              <SvgText x={x + barW / 2} y={CHART_H - 8} fontSize={10} fill={Colors.textMuted} textAnchor="middle">
                {w.label}
              </SvgText>
              {w.rate > 0 && (
                <SvgText x={x + barW / 2} y={y - 5} fontSize={9} fill={Colors.textMuted} textAnchor="middle">
                  {Math.round(w.rate * 100)}%
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: Colors.green, label: '≥70%' },
          { color: Colors.orange, label: '40–70%' },
          { color: Colors.coral, label: '<40%' },
        ].map(item => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
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
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: FONT,
    marginBottom: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: FONT,
  },
});
