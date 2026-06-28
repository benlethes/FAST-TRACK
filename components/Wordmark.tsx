import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';

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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  word: {
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 2.5,
    color: Colors.textPrimary,
    fontFamily: FONT,
  },
  slash: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.slash,
    fontFamily: FONT,
    letterSpacing: 0,
    marginHorizontal: 1,
  },
});
