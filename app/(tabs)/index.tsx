import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { FONT, FONT_MONO } from '@/constants/fonts';
import { useFasting } from '@/hooks/useFasting';
import { useFastingContext } from '@/context/FastingContext';
import { Wordmark } from '@/components/Wordmark';
import { TimerCircle } from '@/components/TimerCircle';
import { WeekStrip } from '@/components/WeekStrip';
import { GoalSlider } from '@/components/GoalSlider';
import { FastingStage } from '@/components/FastingStage';
import { RecentFasts } from '@/components/RecentFasts';
import { TimeAdjustModal } from '@/components/TimeAdjustModal';
import { WeightModal } from '@/components/WeightModal';

function fmt(d: Date | null): string {
  if (!d) return '–– : ––';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function goalTime(start: Date | null, hours: number): string {
  if (!start) return '–– : ––';
  return fmt(new Date(start.getTime() + hours * 3600_000));
}

function localDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default function HomeScreen() {
  const { isActive, startTime, elapsedSeconds, goalHours, setGoalHours, startFast, stopFast, progress } =
    useFasting();
  const { fasts, saveFast } = useFastingContext();

  const [showStartModal, setShowStartModal]   = useState(false);
  const [showEndModal, setShowEndModal]       = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const capturedStartRef = useRef<Date | null>(null);

  const now = new Date();
  const maxPast24 = new Date(now.getTime() - 24 * 3600_000);

  // ── Start flow ──────────────────────────────────────────────────────────────
  const handleStartPress = () => setShowStartModal(true);

  const handleStartConfirm = (t: Date) => {
    setShowStartModal(false);
    startFast(t);
  };

  // ── End flow ────────────────────────────────────────────────────────────────
  const handleEndPress = () => {
    // Capture the start time BEFORE stopping the timer
    capturedStartRef.current = startTime;
    setShowEndModal(true);
  };

  const handleEndConfirm = (endTime: Date) => {
    setShowEndModal(false);
    const start = capturedStartRef.current;
    if (!start) return;

    stopFast();

    const durationHours = (endTime.getTime() - start.getTime()) / 3600_000;
    saveFast({
      date: localDate(start),
      startTime: fmt(start),
      endTime: fmt(endTime),
      durationHours: Math.round(durationHours * 100) / 100,
      goalHours,
      goalHit: durationHours >= goalHours,
    });
  };

  const handleEndCancel = () => {
    setShowEndModal(false);
    // don't stop the fast — user cancelled
  };

  const STREAK = fasts.filter(f => f.goalHit).length > 0 ? 7 : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Wordmark />
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {STREAK} days</Text>
          </View>
        </View>

        <GoalSlider value={goalHours} onValueChange={setGoalHours} />

        <View style={styles.section}>
          <WeekStrip isActive={isActive} fasts={fasts} />
        </View>

        <View style={styles.circleWrap}>
          <TimerCircle
            isActive={isActive}
            elapsedSeconds={elapsedSeconds}
            goalHours={goalHours}
            progress={progress}
            fasts={fasts}
          />
        </View>

        {isActive && <FastingStage elapsedSeconds={elapsedSeconds} />}

        {isActive && (
          <View style={styles.statRow}>
            <View style={styles.statTile}>
              <Text style={styles.statLabel}>Started</Text>
              <Text style={styles.statValue}>{fmt(startTime)}</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statLabel}>Goal at</Text>
              <Text style={styles.statValue}>{goalTime(startTime, goalHours)}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.mainButton, isActive && styles.mainButtonEnd]}
          onPress={isActive ? handleEndPress : handleStartPress}
          activeOpacity={0.85}
        >
          <Text style={styles.mainButtonText}>{isActive ? 'End Fast' : 'Start Fast'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.weightButton}
          onPress={() => setShowWeightModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.weightButtonText}>⚖ Log Weight</Text>
        </TouchableOpacity>

        {!isActive && <RecentFasts fasts={fasts} />}
      </ScrollView>

      {/* Start time modal */}
      <TimeAdjustModal
        visible={showStartModal}
        title="When did you start fasting?"
        subtitle="Adjust if you forgot to start on time"
        initialTime={now}
        minTime={maxPast24}
        maxTime={now}
        confirmLabel="Start Fast"
        onConfirm={handleStartConfirm}
        onCancel={() => setShowStartModal(false)}
      />

      {/* End time modal */}
      <TimeAdjustModal
        visible={showEndModal}
        title="When did you break your fast?"
        subtitle="Adjust if you forgot to stop in time"
        initialTime={now}
        minTime={startTime ?? maxPast24}
        maxTime={now}
        referenceStart={startTime ?? undefined}
        confirmLabel="Save Fast"
        onConfirm={handleEndConfirm}
        onCancel={handleEndCancel}
      />

      <WeightModal visible={showWeightModal} onClose={() => setShowWeightModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 36, gap: 22 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  streakBadge: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: FONT,
  },
  section: { paddingHorizontal: 20 },
  circleWrap: { alignItems: 'center', paddingHorizontal: 20 },
  statRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
  statTile: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: FONT,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '300',
    color: Colors.textPrimary,
    marginTop: 4,
    fontFamily: FONT_MONO,
  },
  mainButton: {
    marginHorizontal: 20,
    backgroundColor: Colors.amber,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  mainButtonEnd: { backgroundColor: Colors.sky },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.5,
    fontFamily: FONT,
  },
  weightButton: {
    marginHorizontal: 20,
    backgroundColor: Colors.card,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weightButtonText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '400',
    fontFamily: FONT,
  },
});
