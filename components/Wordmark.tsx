import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

export function Wordmark() {
  return (
    <View style={styles.row}>
      <Text style={styles.word}>FAST</Text>
      <Text style={styles.slash}>//</Text>
      <Text style={styles.word}>TRACK</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  word: {
    fontSize: 22,
    fontFamily: 'Caveat_700Bold',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  slash: {
    fontSize: 22,
    fontFamily: 'Caveat_700Bold',
    color: Colors.red,
    letterSpacing: -2,
    marginHorizontal: 1,
  },
});
