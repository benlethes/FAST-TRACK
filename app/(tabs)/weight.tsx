import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions,
} from 'react-native';
import Svg, { Circle, Path, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { Wordmark } from '@/components/Wordmark';
import { WeightModal } from '@/components/WeightModal';
import { useWeightContext } from '@/context/WeightContext';
import { WeightRecord } from '@/context/WeightContext';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 40;
const CHART_H = 140;
const PAD = { top: 20, bottom: 24, left: 8, right: 8 };
const INNER_W = CHART_W - PAD.left - PAD.right;
const INNER_H = CHART_H - PAD.top - PAD.bottom;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const today     = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return `Today, ${d.toLocaleDateString('en', { day: 'numeric', month: 'short' })}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${d.toLocaleDateString('en', { day: 'numeric', month: 'short' })}`;
  return d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
}

function monthDelta(records: WeightRecord[]): { delta: number; label: string } | null {
  if (records.length < 2) return null;
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const cutoff = `${monthAgo.getFullYear()}-${String(monthAgo.getMonth() + 1).padStart(2, '0')}-${String(monthAgo.getDate()).padStart(2, '0')}`;
  const inMonth = records.filter(r => r.date >= cutoff);
  if (inMonth.length < 2) return null;
  const sorted  = [...inMonth].sort((a, b) => a.date.localeCompare(b.date));
  const delta   = sorted[sorted.length - 1].weightKg - sorted[0].weightKg;
  const sign    = delta > 0 ? '+' : '';
  return { delta, label: `${sign}${delta.toFixed(1)} kg this month` };
}

function WeightLineChart({ records }: { records: WeightRecord[] }) {
  if (records.length < 2) return null;

  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map(r => r.weightKg);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const pad    = Math.max((maxVal - minVal) * 0.3, 0.5);
  const lo     = minVal - pad;
  const hi     = maxVal + pad;
  const range  = hi - lo || 1;

  const xScale = (i: number) => PAD.left + (i / Math.max(sorted.length - 1, 1)) * INNER_W;
  const yScale = (v: number) => PAD.top + INNER_H - ((v - lo) / range) * INNER_H;

  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(v)}`).join(' ');

  const labelIdxs = sorted.length <= 4
    ? sorted.map((_, i) => i)
    : [0, Math.floor(sorted.length / 2), sorted.length - 1];

  const latest = sorted[sorted.length - 1];

  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Path d={path} stroke={Colors.red} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {sorted.map((r, i) => (
        <Circle
          key={r.id}
          cx={xScale(i)}
          cy={yScale(values[i])}
          r={i === sorted.length - 1 ? 4 : 3}
          fill={i === sorted.length - 1 ? Colors.background : Colors.red}
          stroke={Colors.red}
          strokeWidth={1.5}
        />
      ))}
      {/* latest value label */}
      <SvgText
        x={xScale(sorted.length - 1)}
        y={yScale(values[sorted.length - 1]) - 8}
        fontSize={10}
        fill={Colors.textPrimary}
        textAnchor="middle"
        fontWeight="600"
      >
        {values[sorted.length - 1].toFixed(1)}
      </SvgText>
      {/* x-axis labels */}
      {labelIdxs.map(i => {
        const d = new Date(sorted[i].date + 'T12:00:00');
        return (
          <SvgText key={i} x={xScale(i)} y={CHART_H - 4} fontSize={9} fill={Colors.textMuted} textAnchor="middle">
            {d.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </SvgText>
        );
      })}
    </Svg>
  );
}

export default function WeightScreen() {
  const { records } = useWeightContext();
  const [showModal, setShowModal] = useState(false);

  const sorted  = [...records].sort((a, b) =>
    a.date !== b.date ? b.date.localeCompare(a.date) : b.time.localeCompare(a.time)
  );
  const latest  = sorted[0]?.weightKg ?? null;
  const delta   = monthDelta(records);

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
          <Text style={styles.screenLabel}>Weight</Text>
        </View>

        {/* Big weight number */}
        <View style={styles.heroWrap}>
          {latest !== null ? (
            <>
              <View style={styles.heroRow}>
                <Text style={styles.heroNum}>{latest.toFixed(1)}</Text>
                <Text style={styles.heroUnit}>kg</Text>
              </View>
              {delta && (
                <Text style={[styles.heroDelta, { color: delta.delta <= 0 ? Colors.green : Colors.red }]}>
                  {delta.label}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.heroEmpty}>No weight logged yet</Text>
          )}
        </View>

        {/* Chart */}
        {records.length >= 2 && (
          <View style={styles.chartWrap}>
            <WeightLineChart records={records} />
          </View>
        )}

        {/* Log button */}
        <TouchableOpacity style={styles.logBtn} onPress={() => setShowModal(true)} activeOpacity={0.85}>
          <Text style={styles.logBtnText}>Log Weight</Text>
        </TouchableOpacity>

        {/* History */}
        {sorted.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionLabel}>History</Text>
            {sorted.map((r, i) => {
              const prev  = sorted[i + 1];
              const diff  = prev ? r.weightKg - prev.weightKg : null;
              const sign  = diff !== null && diff > 0 ? '+' : '';
              return (
                <View key={r.id} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{formatDate(r.date)}</Text>
                  <Text style={styles.historyWeight}>{r.weightKg.toFixed(1)} kg</Text>
                  {diff !== null && (
                    <Text style={[styles.historyDelta, { color: diff <= 0 ? Colors.green : Colors.red }]}>
                      {sign}{diff.toFixed(1)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <WeightModal visible={showModal} onClose={() => setShowModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  scroll:  { flex: 1 },
  content: { paddingBottom: 40, gap: 20 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  screenLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: FONT,
    letterSpacing: 0.16 * 9,
    textTransform: 'uppercase',
  },

  heroWrap: { paddingHorizontal: 20 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  heroNum: {
    fontSize: 64,
    fontWeight: '200',
    color: Colors.textPrimary,
    fontFamily: FONT,
    letterSpacing: -2,
    lineHeight: 72,
  },
  heroUnit: {
    fontSize: 20,
    fontWeight: '200',
    color: Colors.textPrimary,
    fontFamily: FONT,
    marginBottom: 10,
  },
  heroDelta: {
    fontSize: 13,
    fontFamily: FONT,
    marginTop: 2,
  },
  heroEmpty: {
    fontSize: 16,
    color: Colors.textMuted,
    fontFamily: FONT,
  },

  chartWrap: { paddingHorizontal: 20 },

  logBtn: {
    marginHorizontal: 20,
    backgroundColor: Colors.red,
    borderRadius: 3,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.20 * 11,
    textTransform: 'uppercase',
    fontFamily: FONT,
  },

  historySection: { paddingHorizontal: 20 },
  sectionLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: FONT,
    letterSpacing: 0.16 * 9,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  historyDate: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: FONT,
  },
  historyWeight: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: FONT,
    marginRight: 8,
  },
  historyDelta: {
    fontSize: 13,
    fontFamily: FONT,
    width: 40,
    textAlign: 'right',
  },
});
