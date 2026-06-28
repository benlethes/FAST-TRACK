import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Path, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { WeightRecord } from '@/context/WeightContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_W = SCREEN_WIDTH - 80;
const CHART_H = 160;
const PAD = { top: 16, bottom: 28, left: 40, right: 8 };
const INNER_W = CHART_W - PAD.left - PAD.right;
const INNER_H = CHART_H - PAD.top - PAD.bottom;

interface WeightChartProps {
  records: WeightRecord[];
}

export function WeightChart({ records }: WeightChartProps) {
  if (records.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weight</Text>
        <Text style={styles.empty}>No weight entries for this period</Text>
      </View>
    );
  }

  // Oldest first for the chart
  const sorted = [...records].sort((a, b) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : a.time.localeCompare(b.time)
  );

  const values = sorted.map(r => Math.round(r.weightKg * 10) / 10);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const padding = Math.max((maxVal - minVal) * 0.25, 1);
  const lo = minVal - padding;
  const hi = maxVal + padding;
  const range = hi - lo || 1;

  const yScale = (v: number) => PAD.top + INNER_H - ((v - lo) / range) * INNER_H;
  const xScale = (i: number) => PAD.left + (i / Math.max(sorted.length - 1, 1)) * INNER_W;

  const linePath = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(v)}`)
    .join(' ');

  const labelIndices = sorted.length <= 5
    ? sorted.map((_, i) => i)
    : [0, Math.floor(sorted.length / 2), sorted.length - 1];

  const latest = values[values.length - 1];
  const earliest = values[0];
  const delta = latest - earliest;
  const deltaSign = delta > 0 ? '+' : '';
  const deltaStr = `${deltaSign}${delta.toFixed(1)} kg`;
  const deltaColor = delta <= 0 ? Colors.green : Colors.coral;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.cardTitle}>Weight</Text>
        {records.length >= 2 && (
          <Text style={[styles.delta, { color: deltaColor }]}>{deltaStr}</Text>
        )}
      </View>

      <Svg width={CHART_W} height={CHART_H}>
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75].map(t => {
          const y = PAD.top + INNER_H * (1 - t);
          return (
            <Line
              key={t}
              x1={PAD.left}
              y1={y}
              x2={PAD.left + INNER_W}
              y2={y}
              stroke={Colors.border}
              strokeWidth={1}
              opacity={0.6}
            />
          );
        })}

        {/* Line */}
        {sorted.length > 1 && (
          <Path
            d={linePath}
            stroke={Colors.green}
            strokeWidth={2.2}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Dots */}
        {sorted.map((r, i) => (
          <Circle
            key={r.id}
            cx={xScale(i)}
            cy={yScale(values[i])}
            r={sorted.length > 30 ? 2 : 3.5}
            fill={Colors.green}
            stroke="#fff"
            strokeWidth={1.5}
          />
        ))}

        {/* X-axis labels */}
        {labelIndices.map(i => {
          const r = sorted[i];
          const d = new Date(r.date + 'T12:00:00');
          return (
            <SvgText
              key={i}
              x={xScale(i)}
              y={CHART_H - 6}
              fontSize={9}
              fill={Colors.textMuted}
              textAnchor="middle"
            >
              {`${d.getMonth() + 1}/${d.getDate()}`}
            </SvgText>
          );
        })}

        {/* Y-axis labels */}
        <SvgText
          x={PAD.left - 4}
          y={PAD.top + 4}
          fontSize={9}
          fill={Colors.textMuted}
          textAnchor="end"
        >
          {hi.toFixed(1)}
        </SvgText>
        <SvgText
          x={PAD.left - 4}
          y={PAD.top + INNER_H + 4}
          fontSize={9}
          fill={Colors.textMuted}
          textAnchor="end"
        >
          {lo.toFixed(1)}
        </SvgText>

        {/* Latest value callout */}
        {sorted.length > 0 && (
          <SvgText
            x={xScale(sorted.length - 1)}
            y={yScale(latest) - 8}
            fontSize={10}
            fontWeight="600"
            fill={Colors.green}
            textAnchor={sorted.length > 1 ? 'middle' : 'middle'}
          >
            {latest.toFixed(1)}
          </SvgText>
        )}
      </Svg>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: FONT,
  },
  delta: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FONT,
  },
  empty: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: FONT,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
