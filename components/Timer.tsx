import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useGame } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';

export default function Timer() {
  const { elapsedSeconds } = useGame();
  const m = Math.floor(elapsedSeconds / 60);
  const s = elapsedSeconds % 60;
  return (
    <Text style={styles.timer}>
      {m}:{s.toString().padStart(2, '0')}
    </Text>
  );
}

const styles = StyleSheet.create({
  timer: {
    fontSize: 14,
    color: Colors.secondary,
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
