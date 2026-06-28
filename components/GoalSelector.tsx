import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '@/constants/colors';

const GOALS = [12, 14, 16, 18, 20, 24];

interface GoalSelectorProps {
  selected: number;
  onSelect: (hours: number) => void;
}

export function GoalSelector({ selected, onSelect }: GoalSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {GOALS.map((h) => {
        const active = h === selected;
        return (
          <TouchableOpacity
            key={h}
            onPress={() => onSelect(h)}
            style={[styles.pill, active && styles.pillActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {h}h
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  pillActive: {
    backgroundColor: Colors.coral,
    borderColor: Colors.coral,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
});
