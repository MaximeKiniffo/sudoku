import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useGame } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { BORDER_RADIUS, SPACING } from '@/utils/constants';

interface Props {
  compact?: boolean;
}

export default function ModeToggle({ compact }: Props) {
  const { mode, setMode } = useGame();
  const isZen = mode === 'zen';

  return (
    <Pressable
      onPress={() => setMode(isZen ? 'expert' : 'zen')}
      style={[styles.toggle, compact && styles.compact]}
    >
      <View style={[styles.track, { backgroundColor: isZen ? Colors.surface : Colors.accent }]}>
        <View style={[styles.thumb, isZen ? styles.thumbLeft : styles.thumbRight]} />
      </View>
      {!compact && (
        <Text style={[styles.label, { color: Colors.secondary }]}>
          {isZen ? 'Zen' : 'Expert'}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  compact: {},
  track: {
    width: 46,
    height: 26,
    borderRadius: 13,
    position: 'relative',
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
    top: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  thumbLeft: { left: 2 },
  thumbRight: { left: 24 },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
