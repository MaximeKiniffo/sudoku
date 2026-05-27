import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/utils/colors';
import { Difficulty, SPACING, BORDER_RADIUS, MIN_TOUCH_TARGET } from '@/utils/constants';

interface Props {
  difficulties: Difficulty[];
  selected: Difficulty;
  onSelect: (d: Difficulty) => void;
  dark: boolean;
}

export default function DifficultyPicker({ difficulties, selected, onSelect, dark }: Props) {
  return (
    <View style={styles.row}>
      {difficulties.map((d) => {
        const active = d === selected;
        return (
          <Pressable
            key={d}
            onPress={() => onSelect(d)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Difficulté ${d}`}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: active
                  ? Colors.accent
                  : dark
                  ? Colors.surfaceDark
                  : Colors.surface,
                borderColor: active ? Colors.accent : dark ? Colors.surfaceDark : Colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                { color: active ? Colors.white : dark ? Colors.textPrimaryDark : Colors.textPrimary },
              ]}
            >
              {d}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
