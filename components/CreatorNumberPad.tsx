import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/utils/colors';
import { SPACING, BORDER_RADIUS, MIN_TOUCH_TARGET } from '@/utils/constants';

const DIGIT_ROWS = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

interface Props {
  selectedDigit: number | null;
  dark: boolean;
  onDigit: (digit: number) => void;
  onErase: () => void;
}

export default function CreatorNumberPad({
  selectedDigit,
  dark,
  onDigit,
  onErase,
}: Props) {
  const keySurface = dark ? Colors.cardBackgroundDark : Colors.cardBackground;
  const text = dark ? Colors.textPrimaryDark : Colors.textPrimary;
  const subText = dark ? Colors.textSecondaryDark : Colors.textSecondary;

  return (
    <View
      style={[
        styles.pad,
        {
          backgroundColor: dark ? Colors.surfaceDark : Colors.surface,
        },
      ]}
    >
      <View style={styles.digitRows}>
        {DIGIT_ROWS.map((row) => (
          <View key={row.join('-')} style={styles.digitRow}>
            {row.map((digit) => {
              const active = selectedDigit === digit;
              return (
                <Pressable
                  key={digit}
                  onPress={() => onDigit(digit)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Placer le chiffre ${digit}`}
                  style={({ pressed }) => [
                    styles.key,
                    {
                      backgroundColor: active ? Colors.accent : keySurface,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.keyText,
                      { color: active ? Colors.white : text },
                    ]}
                  >
                    {digit}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <Pressable
        onPress={onErase}
        accessibilityRole="button"
        accessibilityLabel="Effacer la case selectionnee"
        style={({ pressed }) => [
          styles.eraseKey,
          {
            backgroundColor: keySurface,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <Ionicons name="backspace-outline" size={22} color={subText} />
        <Text style={[styles.actionText, { color: subText }]}>Effacer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    gap: SPACING.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  digitRows: {
    gap: SPACING.sm,
  },
  digitRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  key: {
    flex: 1,
    minHeight: 54,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '800',
  },
  eraseKey: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
