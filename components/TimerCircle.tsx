import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { FastRecord } from '@/constants/mockData';

const { width: SCREEN_W } = Dimensions.get('window');
const SIZE         = Math.round(SCREEN_W * 0.86);
const R            = Math.round((SIZE - 20) / 2 - 8);
const STROKE_WIDTH = 18;
const CIRCUMFERENCE = 2 * Math.PI * R;

function fmtElapsed(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function fmtDuration(h: number): string {
  const hrs  = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
}

interface TimerCircleProps {
  isActive: boolean;
  elapsedSeconds: number;
  goalHours: number;
  progress: number;
  fasts?: FastRecord[];
}

export function TimerCircle({ isActive, elapsedSeconds, goalHours, progress, fasts = [] }: TimerCircleProps) {
  const lastFast    = fasts.length > 0
    ? [...fasts].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;

  const clampedProg = Math.min(Math.max(progress, 0), 1);
  const offset      = CIRCUMFERENCE * (1 - clampedProg);
  const ringColor   = progress >= 1 ? Colors.green : Colors.red;

  return (
    <View style={[styles.container, { width: SIZE, height: SIZE }]}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Track */}
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none" stroke="#E0DCD5" strokeWidth={STROKE_WIDTH}
        />
        {/* Progress */}
        {isActive && progress > 0 && (
          <Circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke={ringColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        )}
      </Svg>

      <View style={styles.inner}>
        {isActive ? (
          <>
            <Text style={styles.label}>Elapsed</Text>
            <Text style={styles.bigNum}>{fmtElapsed(elapsedSeconds)}</Text>
            <Text style={styles.sub}>
              {Math.round(progress * 100)}% of {goalHours}h goal
            </Text>
          </>
        ) : lastFast ? (
          <>
            <Text style={styles.label}>Last Fast</Text>
            <Text style={styles.bigNum}>{fmtDuration(lastFast.durationHours)}</Text>
            <Text style={styles.sub}>{fmtDate(lastFast.date)}</Text>
            <Text style={[styles.goalTag, { color: lastFast.goalHit ? Colors.green : Colors.red }]}>
              {lastFast.goalHit ? '✓ Goal hit' : '× Goal missed'}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.label}>No fasts yet</Text>
            <Text style={styles.sub}>Tap Start Fast</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: SIZE - STROKE_WIDTH * 2 - 40,
  },
  label: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.16 * 9,
    textTransform: 'uppercase',
    fontFamily: FONT,
    marginBottom: 4,
  },
  bigNum: {
    fontSize: Math.round(SIZE * 0.11),
    fontWeight: '200',
    color: Colors.textPrimary,
    fontFamily: FONT,
    letterSpacing: -1,
    textAlign: 'center',
  },
  sub: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: FONT,
    marginTop: 6,
    textAlign: 'center',
  },
  goalTag: {
    fontSize: 13,
    fontFamily: FONT,
    marginTop: 6,
  },
});
