import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';

interface Stage {
  minH: number;
  maxH: number;
  emoji: string;
  title: string;
  desc: string;
}

const STAGES: Stage[] = [
  { minH: 0,  maxH: 4,  emoji: '🍽️', title: 'Digesting',    desc: 'Processing your last meal, blood sugar stabilizing' },
  { minH: 4,  maxH: 8,  emoji: '⚡',  title: 'Glycolysis',   desc: 'Glycogen stores depleting, energy from carbs' },
  { minH: 8,  maxH: 12, emoji: '🔥',  title: 'Fat Burning',  desc: 'Body switching to fat for fuel' },
  { minH: 12, maxH: 16, emoji: '✨',  title: 'Ketosis',      desc: 'Ketone bodies forming, mental clarity improving' },
  { minH: 16, maxH: 18, emoji: '🧹',  title: 'Autophagy',   desc: 'Cellular cleanup process beginning' },
  { minH: 18, maxH: 20, emoji: '💪',  title: 'Peak Burn',   desc: 'Maximum fat oxidation and hormone optimization' },
  { minH: 20, maxH: 24, emoji: '🧬',  title: 'Deep Renewal', desc: 'Growth hormone peaks, deep cellular regeneration' },
];

interface FastingStageProps {
  elapsedSeconds: number;
}

export function FastingStage({ elapsedSeconds }: FastingStageProps) {
  const elapsedH = elapsedSeconds / 3600;
  const stage = STAGES.find(s => elapsedH >= s.minH && elapsedH < s.maxH) ?? STAGES[STAGES.length - 1];
  const stageIdx = STAGES.indexOf(stage);

  const stageProgress = (elapsedH - stage.minH) / (stage.maxH - stage.minH);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.emoji}>{stage.emoji}</Text>
        <View style={styles.textCol}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{stage.title}</Text>
            <Text style={styles.stepLabel}>Stage {stageIdx + 1}/{STAGES.length}</Text>
          </View>
          <Text style={styles.desc}>{stage.desc}</Text>
        </View>
      </View>

      {/* Stage progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${Math.min(stageProgress * 100, 100)}%` }]} />
      </View>

      {/* Mini stage dots */}
      <View style={styles.dots}>
        {STAGES.map((s, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < stageIdx && styles.dotDone,
              i === stageIdx && styles.dotActive,
            ]}
          />
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
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  emoji: {
    fontSize: 28,
    lineHeight: 36,
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: FONT,
  },
  stepLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: FONT,
  },
  desc: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: FONT,
    lineHeight: 18,
  },
  progressBg: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.coral,
    borderRadius: 2,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotDone: {
    backgroundColor: Colors.green,
  },
  dotActive: {
    backgroundColor: Colors.coral,
    width: 18,
    borderRadius: 3,
  },
});
