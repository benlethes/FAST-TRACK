import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { FONT, FONT_MONO } from '@/constants/fonts';

function fmt(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtDuration(ms: number) {
  if (ms <= 0) return '0m';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

const STEPS_MIN = [-60, -15, -5, 5, 15, 60];

interface TimeAdjustModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  initialTime: Date;
  minTime: Date;
  maxTime: Date;
  referenceStart?: Date;   // if set, shows duration relative to this start
  confirmLabel: string;
  onConfirm: (time: Date) => void;
  onCancel: () => void;
}

export function TimeAdjustModal({
  visible, title, subtitle, initialTime, minTime, maxTime,
  referenceStart, confirmLabel, onConfirm, onCancel,
}: TimeAdjustModalProps) {
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    if (visible) setTime(initialTime);
  }, [visible, initialTime]);

  const adjust = (deltaMins: number) => {
    setTime(prev => {
      const next = new Date(prev.getTime() + deltaMins * 60_000);
      if (next > maxTime) return maxTime;
      if (next < minTime) return minTime;
      return next;
    });
  };

  const durationMs = referenceStart ? time.getTime() - referenceStart.getTime() : null;
  const durationValid = durationMs !== null && durationMs > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel} />

        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          {/* Reference start */}
          {referenceStart && (
            <Text style={styles.reference}>
              Started: {fmt(referenceStart)}
            </Text>
          )}

          {/* Time display */}
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{fmt(time)}</Text>
          </View>

          {/* Duration preview */}
          {durationMs !== null && (
            <Text style={[styles.duration, !durationValid && styles.durationError]}>
              {durationValid ? `Duration: ${fmtDuration(durationMs)}` : 'End time must be after start'}
            </Text>
          )}

          {/* Adjustment buttons */}
          <View style={styles.adjRow}>
            {STEPS_MIN.map(step => (
              <TouchableOpacity
                key={step}
                style={[styles.adjBtn, step > 0 && styles.adjBtnPos]}
                onPress={() => adjust(step)}
                activeOpacity={0.7}
              >
                <Text style={[styles.adjText, step > 0 && styles.adjTextPos]}>
                  {step > 0 ? `+${step}m` : `${step}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Confirm */}
          <TouchableOpacity
            style={[styles.confirmBtn, !durationValid && durationMs !== null && styles.confirmDisabled]}
            onPress={() => (durationValid || durationMs === null) && onConfirm(time)}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmText}>
              {durationValid ? `${confirmLabel} · ${fmtDuration(durationMs!)}` : confirmLabel}
            </Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.6}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: FONT,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: FONT,
    textAlign: 'center',
    marginTop: -8,
  },
  reference: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: FONT,
    textAlign: 'center',
    marginTop: -8,
  },
  timeRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  timeText: {
    fontSize: 52,
    fontWeight: '200',
    fontFamily: FONT_MONO,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  duration: {
    fontSize: 14,
    color: Colors.green,
    fontFamily: FONT,
    textAlign: 'center',
    marginTop: -8,
    fontWeight: '500',
  },
  durationError: {
    color: Colors.coral,
  },
  adjRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  adjBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  adjBtnPos: {
    backgroundColor: Colors.card,
  },
  adjText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: FONT,
  },
  adjTextPos: {
    color: Colors.textPrimary,
  },
  confirmBtn: {
    backgroundColor: Colors.amber,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 4,
    marginTop: -6,
  },
  cancelText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: FONT,
  },
});
