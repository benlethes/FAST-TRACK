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
    fontSize: 20,
    fontFamily: 'PermanentMarker_400Regular',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  slash: {
    fontSize: 20,
    fontFamily: 'PermanentMarker_400Regular',
    color: Colors.amber,   // warm orange
    letterSpacing: -1,
    marginHorizontal: 1,
  },
});
