import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';

interface Bucket {
  label: string;
  count: number;
}

interface HorizontalBarChartProps {
  title: string;
  buckets: Bucket[];
  color: string;
}

export function HorizontalBarChart({ title, buckets, color }: HorizontalBarChartProps) {
  const maxCount = Math.max(...buckets.map(b => b.count), 1);
  const nonEmpty = buckets.filter(b => b.count > 0);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.chart}>
        {buckets.map((b, i) => {
          const isEmpty = b.count === 0;
          return (
            <View key={i} style={styles.row}>
              <Text style={[styles.label, isEmpty && styles.labelFaded]}>{b.label}</Text>
              <View style={styles.barTrack}>
                {b.count > 0 && (
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${(b.count / maxCount) * 100}%`,
                        backgroundColor: color,
                        opacity: 0.75 + 0.25 * (b.count / maxCount),
                      },
                    ]}
                  />
                )}
              </View>
              <Text style={[styles.count, isEmpty && styles.labelFaded]}>
                {b.count > 0 ? b.count : ''}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.footer}>{nonEmpty.length} active windows · {buckets.reduce((a, b) => a + b.count, 0)} total</Text>
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
  cardTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: FONT,
    marginBottom: 14,
  },
  chart: {
    gap: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: FONT,
    width: 40,
    textAlign: 'right',
  },
  labelFaded: {
    opacity: 0.35,
  },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
  count: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: FONT,
    width: 16,
    textAlign: 'right',
  },
  footer: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: FONT,
    marginTop: 10,
    textAlign: 'right',
  },
});
