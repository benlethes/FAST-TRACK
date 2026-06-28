import React, { useRef, useEffect, useState } from 'react';
import { View, Text, PanResponder, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';

const MIN = 12;
const MAX = 24;
const THUMB = 26;
const TRACK_H = 5;
const SNAP = [12, 14, 16, 18, 20, 22, 24];
const DEFAULT = 16;

interface GoalSliderProps {
  value: number;
  onValueChange: (v: number) => void;
}

export function GoalSlider({ value, onValueChange }: GoalSliderProps) {
  const [trackWidth, setTrackWidth] = useState(1);
  const trackWidthRef = useRef(1);
  const onChangeRef = useRef(onValueChange);
  const initialX = useRef(0);

  useEffect(() => { onChangeRef.current = onValueChange; }, [onValueChange]);

  const snapToNearest = (raw: number) =>
    SNAP.reduce((prev, cur) =>
      Math.abs(cur - raw) < Math.abs(prev - raw) ? cur : prev
    );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        initialX.current = e.nativeEvent.locationX;
        const pct = Math.max(0, Math.min(1, e.nativeEvent.locationX / trackWidthRef.current));
        onChangeRef.current(snapToNearest(MIN + pct * (MAX - MIN)));
      },
      onPanResponderMove: (_e, state) => {
        const x = Math.max(0, Math.min(trackWidthRef.current, initialX.current + state.dx));
        onChangeRef.current(snapToNearest(MIN + (x / trackWidthRef.current) * (MAX - MIN)));
      },
    })
  ).current;

  const pct = (value - MIN) / (MAX - MIN);
  const fillW = Math.max(0, trackWidth * pct);
  const thumbLeft = Math.max(0, Math.min(trackWidth - THUMB, fillW - THUMB / 2));

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.label}>Fasting Goal</Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{value}h</Text>
        </View>
      </View>

      <View
        style={styles.trackArea}
        onLayout={e => {
          const w = e.nativeEvent.layout.width;
          trackWidthRef.current = w;
          setTrackWidth(w);
        }}
        {...panResponder.panHandlers}
      >
        {/* Track */}
        <View style={styles.track}>
          <View style={[styles.fill, { width: fillW }]} />
        </View>

        {/* Snap ticks — 16h gets special treatment */}
        {SNAP.map(h => {
          const p = (h - MIN) / (MAX - MIN);
          const isDefault = h === DEFAULT;
          const isFilled = h <= value;
          return (
            <View
              key={h}
              style={[
                styles.tick,
                isDefault ? styles.tickDefault : undefined,
                {
                  left: trackWidth * p - (isDefault ? 2 : 1),
                  backgroundColor: isFilled
                    ? (isDefault ? Colors.background : Colors.background)
                    : (isDefault ? Colors.coral : Colors.border),
                },
              ]}
            />
          );
        })}

        {/* Thumb */}
        <View style={[styles.thumb, { left: thumbLeft }]}>
          <View style={styles.thumbInner} />
        </View>
      </View>

      {/* Labels row */}
      <View style={styles.labelsRow}>
        {SNAP.map(h => {
          const isDefault = h === DEFAULT;
          const isActive = h === value;
          return (
            <View key={h} style={styles.labelItem}>
              <Text style={[
                styles.snapLabel,
                isActive && styles.snapLabelActive,
                isDefault && !isActive && styles.snapLabelDefault,
              ]}>
                {h}h{isDefault ? ' ★' : ''}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: FONT,
    letterSpacing: 0.3,
  },
  chip: {
    backgroundColor: Colors.coral,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
    fontFamily: FONT,
  },
  trackArea: {
    height: THUMB + 8,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_H,
    backgroundColor: Colors.border,
    borderRadius: TRACK_H / 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.coral,
    borderRadius: TRACK_H / 2,
  },
  tick: {
    position: 'absolute',
    width: 2,
    height: 8,
    borderRadius: 1,
    top: '50%',
    marginTop: -4,
  },
  tickDefault: {
    width: 3,
    height: 14,
    borderRadius: 1.5,
    marginTop: -7,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    top: '50%',
    marginTop: -THUMB / 2,
  },
  thumbInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.coral,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelItem: {
    alignItems: 'center',
  },
  snapLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: FONT,
  },
  snapLabelActive: {
    color: Colors.coral,
    fontWeight: '600',
    fontSize: 11,
  },
  snapLabelDefault: {
    color: Colors.coral,
    opacity: 0.6,
  },
});
