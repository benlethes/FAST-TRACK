import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { FONT, FONT_MONO } from '@/constants/fonts';
import { FastRecord } from '@/constants/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIZE = SCREEN_WIDTH * 0.82;
const STROKE_WIDTH = 22;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CENTER = SIZE / 2;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, progress: number) {
  const clamped = Math.min(Math.max(progress, 0.001), 0.9999);
  const angle = clamped * 360;
  const start = polarToCartesian(cx, cy, r, 0);
  const end = polarToCartesian(cx, cy, r, angle);
  const large = angle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatRemaining(elapsed: number, goalH: number) {
  const rem = Math.max(goalH * 3600 - elapsed, 0);
  const h = Math.floor(rem / 3600);
  const m = Math.floor((rem % 3600) / 60);
  const s = rem % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fmtDuration(h: number): string {
  const hrs  = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

interface TimerCircleProps {
  isActive: boolean;
  elapsedSeconds: number;
  goalHours: number;
  progress: number;
  fasts?: FastRecord[];
}

export function TimerCircle({ isActive, elapsedSeconds, goalHours, progress, fasts = [] }: TimerCircleProps) {
  const lastFast = fasts.length > 0
    ? [...fasts].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;
  const arcColor = progress < 0.5 ? Colors.coral : Colors.green;

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        {/* Track */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={Colors.border}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {/* Progress arc */}
        {isActive && progress > 0 && (
          <Path
            d={arcPath(CENTER, CENTER, RADIUS, progress)}
            stroke={arcColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
          />
        )}
      </Svg>

      <View style={styles.inner}>
        {isActive ? (
          <>
            <Text style={styles.elapsed}>{formatTime(elapsedSeconds)}</Text>
            <Text style={styles.elapsedLabel}>elapsed</Text>
            <Text style={styles.remaining}>
              {formatRemaining(elapsedSeconds, goalHours)} left
            </Text>
          </>
        ) : lastFast ? (
          <View style={styles.coldCard}>
            <Text style={styles.coldLabel}>Last fast</Text>
            <Text style={styles.coldDuration}>{fmtDuration(lastFast.durationHours)}</Text>
            <Text style={styles.coldDate}>{fmtDate(lastFast.date)}</Text>
            <View style={styles.coldBadge}>
              <Text style={[styles.coldBadgeText, { color: lastFast.goalHit ? Colors.green : Colors.coral }]}>
                {lastFast.goalHit ? '✓ Goal hit' : '✗ Goal missed'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.coldCard}>
            <Text style={styles.coldLabel}>No fasts yet</Text>
            <Text style={styles.coldDate}>Tap Start Fast to begin</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SIZE,
    height: SIZE,
  },
  inner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: SIZE - STROKE_WIDTH * 2 - 48,
  },
  elapsed: {
    fontSize: 40,
    fontWeight: '200',
    fontFamily: FONT_MONO,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  elapsedLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: FONT,
  },
  remaining: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 10,
    fontFamily: FONT_MONO,
  },
  coldCard: {
    alignItems: 'center',
    gap: 4,
  },
  coldLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: FONT,
  },
  coldDuration: {
    fontSize: 30,
    fontWeight: '300',
    color: Colors.textPrimary,
    marginTop: 4,
    fontFamily: FONT,
  },
  coldDate: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: FONT,
  },
  coldBadge: {
    marginTop: 6,
  },
  coldBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FONT,
  },
});
