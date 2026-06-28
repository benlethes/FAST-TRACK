import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import Svg, { Rect, Line, Circle, Path, Text as SvgText } from 'react-native-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { FastRecord } from '@/constants/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_W = SCREEN_WIDTH - 80;
const CHART_H = 160;
const PAD = { top: 16, bottom: 28, left: 32, right: 8 };
const INNER_W = CHART_W - PAD.left - PAD.right;
const INNER_H = CHART_H - PAD.top - PAD.bottom;

function rollingAvg(data: number[], window: number): number[] {
  return data.map((_, i) => {
    const slice = data.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

interface DurationChartProps {
  fasts: FastRecord[];
  goalHours: number;
}

export function DurationChart({ fasts, goalHours }: DurationChartProps) {
  const [mode, setMode] = useState<'Bar' | 'Line'>('Bar');

  if (fasts.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Fasting duration</Text>
        <Text style={styles.empty}>No data for this period</Text>
      </View>
    );
  }

  const maxVal = Math.max(...fasts.map(f => f.durationHours), goalHours) + 1.5;
  const minVal = Math.max(0, Math.min(...fasts.map(f => f.durationHours)) - 1.5);
  const range  = maxVal - minVal || 1;

  const barW   = Math.min(INNER_W / fasts.length - 3, 18);
  const yScale = (v: number) => PAD.top + INNER_H - ((v - minVal) / range) * INNER_H;
  const xScale = (i: number) => PAD.left + (i + 0.5) * (INNER_W / fasts.length);
  const goalY  = yScale(goalHours);

  const durations = fasts.map(f => f.durationHours);
  const avgLine   = rollingAvg(durations, 7);
  const linePath  = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(v)}`).join(' ');

  const showLabels = [0, Math.floor(fasts.length / 2), fasts.length - 1];

  const handleExport = async () => {
    try {
      const csv  = ['date,duration_hours,goal_hit']
        .concat(fasts.map(f => `${f.date},${f.durationHours},${f.goalHit}`))
        .join('\n');
      const path = `${FileSystem.cacheDirectory}fasting-duration.csv`;
      await FileSystem.writeAsStringAsync(path, csv);
      await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export chart data' });
    } catch {
      Alert.alert('Export failed', 'Could not export chart data.');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.cardTitle}>Fasting duration</Text>
        <View style={styles.controls}>
          {(['Bar', 'Line'] as const).map(m => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Svg width={CHART_W} height={CHART_H}>
        {/* Goal dashed line */}
        {Array.from({ length: 16 }, (_, i) => (
          <Line
            key={i}
            x1={PAD.left + (i / 15) * INNER_W}
            y1={goalY}
            x2={PAD.left + ((i + 0.45) / 15) * INNER_W}
            y2={goalY}
            stroke={Colors.textMuted}
            strokeWidth={1}
            opacity={0.4}
          />
        ))}

        {mode === 'Bar'
          ? fasts.map((f, i) => {
              const h = ((f.durationHours - minVal) / range) * INNER_H;
              return (
                <Rect
                  key={i}
                  x={xScale(i) - barW / 2}
                  y={yScale(f.durationHours)}
                  width={barW}
                  height={Math.max(h, 2)}
                  rx={2}
                  fill={f.goalHit ? Colors.green : Colors.red}
                  opacity={0.85}
                />
              );
            })
          : (
            <>
              <Path d={linePath(avgLine)} stroke={Colors.textMuted} strokeWidth={1.2} fill="none" opacity={0.45} />
              <Path d={linePath(durations)} stroke={Colors.red} strokeWidth={2} fill="none" />
              {fasts.map((f, i) => (
                <Circle key={i} cx={xScale(i)} cy={yScale(f.durationHours)} r={2.5} fill={f.goalHit ? Colors.green : Colors.red} />
              ))}
            </>
          )}

        {showLabels.map(i => {
          const f = fasts[i];
          if (!f) return null;
          const d = new Date(f.date);
          return (
            <SvgText key={i} x={xScale(i)} y={CHART_H - 6} fontSize={9} fill={Colors.textMuted} textAnchor="middle">
              {`${d.getMonth() + 1}/${d.getDate()}`}
            </SvgText>
          );
        })}
        <SvgText x={PAD.left - 4} y={goalY + 3} fontSize={9} fill={Colors.textMuted} textAnchor="end" opacity={0.7}>
          {goalHours}h
        </SvgText>
        <SvgText x={PAD.left - 4} y={yScale(maxVal) + 3} fontSize={9} fill={Colors.textMuted} textAnchor="end">
          {Math.round(maxVal)}h
        </SvgText>
      </Svg>

      {/* Export chart — small secondary button, not full-width */}
      <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.7}>
        <Text style={styles.exportText}>Export Chart</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    padding: 16,
    marginHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: FONT,
  },
  controls: { flexDirection: 'row', gap: 4 },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 3,
    backgroundColor: Colors.background,
  },
  toggleBtnActive: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },
  toggleText: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: FONT,
    letterSpacing: 0.1 * 9,
    textTransform: 'uppercase',
  },
  toggleTextActive: { color: '#fff' },
  empty: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: FONT,
    textAlign: 'center',
    paddingVertical: 24,
  },
  exportBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.black,
    borderRadius: 3,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 12,
  },
  exportText: {
    fontSize: 8,
    color: Colors.background,
    fontFamily: FONT,
    letterSpacing: 0.14 * 8,
    textTransform: 'uppercase',
  },
});
