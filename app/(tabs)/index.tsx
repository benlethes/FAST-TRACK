import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { FONT, FONT_MONO } from '@/constants/fonts';
import { useFasting } from '@/hooks/useFasting';
import { useFastingContext } from '@/context/FastingContext';
import { useSettings, fmtTime } from '@/context/SettingsContext';
import { FastRecord } from '@/constants/mockData';
import { Wordmark } from '@/components/Wordmark';
import { TimerCircle } from '@/components/TimerCircle';
import { WeekStrip } from '@/components/WeekStrip';
import { GoalSlider } from '@/components/GoalSlider';
import { FastingStage } from '@/components/FastingStage';
import { RecentFasts } from '@/components/RecentFasts';
import { DatePickerModal } from '@/components/DatePickerModal';

function localDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function computeCurrentStreak(fasts: FastRecord[]): number {
  if (fasts.length === 0) return 0;
  const sorted = [...fasts].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const fast = sorted.find(x => x.date === ds);
    if (fast && fast.goalHit) {
      streak++;
    } else if (i > 0) {
      break;
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

type EndedFast = { startTime: Date; endTime: Date; supabaseId: string | null };

export default function HomeScreen() {
  const { isActive, startTime, elapsedSeconds, goalHours, setGoalHours,
          startFast, stopFast, adjustStartTime, progress, activeFastId } = useFasting();
  const { fasts, saveFast } = useFastingContext();
  const { timeFormat, defaultGoal } = useSettings();

  const [endedFast, setEndedFast]             = useState<EndedFast | null>(null);
  const [showStartAdjust, setShowStartAdjust] = useState(false);
  const [showEndAdjust, setShowEndAdjust]     = useState(false);

  // Use defaultGoal to initialise on first render
  React.useEffect(() => {
    if (!isActive && !endedFast) {
      setGoalHours(defaultGoal);
    }
  // Only run when defaultGoal changes, not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultGoal]);

  const handleMainButton = async () => {
    if (endedFast) {
      const { startTime: st, endTime: et, supabaseId } = endedFast;
      const durationHours = (et.getTime() - st.getTime()) / 3600_000;
      // If we have a supabaseId, UPDATE the partial row; otherwise INSERT fresh
      const saved = await saveFast({
        date: localDate(st),
        startTime: fmtTime(st, '24h'),
        endTime: fmtTime(et, '24h'),
        durationHours: Math.round(durationHours * 100) / 100,
        goalHours,
        goalHit: durationHours >= goalHours,
      }, supabaseId ?? undefined);
      if (saved) {
        setEndedFast(null);
      } else {
        Alert.alert('Save failed', 'Your fast could not be saved. Please check your connection and try again.');
      }
    } else if (isActive) {
      const capturedStart = startTime ?? new Date();
      const capturedId = activeFastId;   // capture before stopFast clears it
      stopFast();
      setEndedFast({ startTime: capturedStart, endTime: new Date(), supabaseId: capturedId });
    } else {
      startFast();
    }
  };

  const handleStartAdjustConfirm = (t: Date) => {
    setShowStartAdjust(false);
    if (endedFast) {
      setEndedFast(prev => prev ? { ...prev, startTime: t } : null);
    } else {
      adjustStartTime(t);
    }
  };

  const handleEndAdjustConfirm = (t: Date) => {
    setShowEndAdjust(false);
    setEndedFast(prev => prev ? { ...prev, endTime: t } : null);
  };

  const streak    = computeCurrentStreak(fasts);
  const maxPast24 = new Date(Date.now() - 24 * 3600_000);
  const showStickyButton = isActive || !!endedFast;

  const buttonLabel = endedFast ? 'Save Fast' : isActive ? 'End Fast' : 'Start Fast';
  const buttonStyle = endedFast
    ? styles.mainButtonSave
    : isActive
    ? styles.mainButtonEnd
    : styles.mainButton;

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, showStickyButton && { paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Wordmark />
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>{streak} {streak === 1 ? 'day' : 'days'}</Text>
            </View>
          )}
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

        {/* Stat row (active or ended-pending) */}
        {(isActive || endedFast) && (
          <View style={styles.statRow}>
            <TouchableOpacity style={styles.statTile} onPress={() => setShowStartAdjust(true)} activeOpacity={0.7}>
              <Text style={styles.statLabel}>Started</Text>
              <Text style={styles.statValue}>{fmtTime(endedFast?.startTime ?? startTime, timeFormat)}</Text>
              <Text style={styles.statHint}>tap to adjust</Text>
            </TouchableOpacity>
            {isActive ? (
              <View style={styles.statTile}>
                <Text style={styles.statLabel}>Goal at</Text>
                <Text style={styles.statValue}>
                  {startTime ? fmtTime(new Date(startTime.getTime() + goalHours * 3600_000), timeFormat) : '––'}
                </Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.statTile} onPress={() => setShowEndAdjust(true)} activeOpacity={0.7}>
                <Text style={styles.statLabel}>Ended</Text>
                <Text style={styles.statValue}>{fmtTime(endedFast?.endTime ?? null, timeFormat)}</Text>
                <Text style={styles.statHint}>tap to adjust</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Start Fast button — only inside scroll when NOT active */}
        {!showStickyButton && (
          <TouchableOpacity style={styles.mainButton} onPress={handleMainButton} activeOpacity={0.85}>
            <Text style={styles.mainButtonText}>Start Fast</Text>
          </TouchableOpacity>
        )}

        {!isActive && !endedFast && <RecentFasts fasts={fasts} />}
      </ScrollView>

      {/* ── Sticky End / Save button ── */}
      {showStickyButton && (
        <View style={styles.stickyWrap}>
          <TouchableOpacity style={[styles.mainButton, buttonStyle]} onPress={handleMainButton} activeOpacity={0.85}>
            <Text style={styles.mainButtonText}>{buttonLabel}</Text>
          </TouchableOpacity>
        </View>
      )}

      <DatePickerModal
        visible={showStartAdjust}
        title="Start time"
        value={endedFast?.startTime ?? startTime ?? new Date()}
        minimumDate={maxPast24}
        maximumDate={endedFast?.endTime ?? new Date()}
        confirmLabel="Update start time"
        onConfirm={handleStartAdjustConfirm}
        onCancel={() => setShowStartAdjust(false)}
      />
      <DatePickerModal
        visible={showEndAdjust}
        title="End time"
        value={endedFast?.endTime ?? new Date()}
        minimumDate={endedFast?.startTime ?? maxPast24}
        maximumDate={new Date()}
        confirmLabel="Update end time"
        onConfirm={handleEndAdjustConfirm}
        onCancel={() => setShowEndAdjust(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  scroll:  { flex: 1 },
  content: { paddingBottom: 36, gap: 18 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14,
  },
  streakBadge: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 4,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  streakText: { fontSize: 11, fontWeight: '400', color: Colors.textPrimary, fontFamily: FONT, letterSpacing: 0.5 },

  section:    { paddingHorizontal: 20 },
  circleWrap: { alignItems: 'center' },

  statRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
  statTile: {
    flex: 1, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 4, padding: 14, alignItems: 'center',
  },
  statLabel: {
    fontSize: 9, color: Colors.textMuted, letterSpacing: 0.16 * 9,
    textTransform: 'uppercase', fontFamily: FONT,
  },
  statValue: {
    fontSize: 20, fontWeight: '200', color: Colors.textPrimary,
    marginTop: 4, fontFamily: FONT_MONO,
  },
  statHint: { fontSize: 9, color: Colors.textMuted, fontFamily: FONT, marginTop: 3 },

  mainButton: {
    marginHorizontal: 20, backgroundColor: Colors.red,
    borderRadius: 3, height: 46, alignItems: 'center', justifyContent: 'center',
  },
  mainButtonEnd:  { backgroundColor: Colors.black },
  mainButtonSave: { backgroundColor: Colors.green },
  mainButtonText: {
    color: '#FFFFFF', fontSize: 11, fontWeight: '400',
    letterSpacing: 0.20 * 11, textTransform: 'uppercase', fontFamily: FONT,
  },

  stickyWrap: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 0,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
