import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useGame } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { SPACING, BORDER_RADIUS } from '@/utils/constants';

export default function NumberPad() {
  const { placeDigit, toggleCandidate, inputMode, mode, selectedDigit, settings } = useGame();
  const dark = settings.theme === 'dark';
  const bg = dark ? Colors.surfaceDark : Colors.surface;
  const text = dark ? Colors.white : Colors.accent;

  const handlePress = (digit: number) => {
    if (mode === 'expert' && inputMode === 'candidate') {
      toggleCandidate(digit);
    } else {
      placeDigit(digit);
    }
  };

  return (
    <View style={[styles.pad, { backgroundColor: bg }]}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
        const isActive = selectedDigit === digit && inputMode === 'digit';
        return (
          <Pressable
            key={digit}
            style={({ pressed }) => [
              styles.key,
              {
                backgroundColor: isActive
                  ? Colors.accent
                  : dark
                  ? Colors.cardBackgroundDark
                  : Colors.cardBackground,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            onPress={() => handlePress(digit)}
          >
            <Text
              style={[
                styles.keyText,
                { color: isActive ? Colors.white : text },
              ]}
            >
              {digit}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    gap: SPACING.xs,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  key: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  keyText: {
    fontSize: 22,
    fontWeight: '600',
  },
});
