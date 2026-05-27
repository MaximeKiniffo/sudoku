import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useGame } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { formatElapsedTime } from '@/utils/time';

export default function Timer() {
  const { elapsedSeconds, settings } = useGame();
  const dark = settings.theme === 'dark';

  return (
    <Text style={[styles.timer, { color: dark ? Colors.textSecondaryDark : Colors.textSecondary }]}>
      {formatElapsedTime(elapsedSeconds)}
    </Text>
  );
}

const styles = StyleSheet.create({
  timer: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
});
