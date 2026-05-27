import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useGame, AppMode } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { BORDER_RADIUS, MIN_TOUCH_TARGET, SPACING } from '@/utils/constants';

interface Props {
  compact?: boolean;
  showDescription?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  helperText?: string;
  value?: AppMode;
  onChange?: (mode: AppMode) => void;
}

const OPTIONS: { value: AppMode; label: string; description: string }[] = [
  {
    value: 'zen',
    label: 'Zen',
    description: 'Indices et assistances, jeu simple',
  },
  {
    value: 'expert',
    label: 'Expert',
    description: 'Notes, threads et couleurs',
  },
];

export default function ModeToggle({
  compact = false,
  showDescription = false,
  disabled = false,
  disabledReason,
  helperText,
  value,
  onChange,
}: Props) {
  const { mode, setMode, settings } = useGame();
  const selectedMode = value ?? mode;
  const handleChange = onChange ?? setMode;
  const dark = settings.theme === 'dark';
  const supportingText = disabledReason ?? helperText;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.segment,
          compact ? styles.compactSegment : styles.fullSegment,
          {
            backgroundColor: dark ? Colors.surfaceDark : Colors.surface,
            opacity: disabled ? 0.55 : 1,
          },
        ]}
      >
        {OPTIONS.map((option) => {
          const active = selectedMode === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => {
                if (!disabled) handleChange(option.value);
              }}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled }}
              accessibilityLabel={`Mode ${option.label}`}
              style={({ pressed }) => [
                styles.option,
                compact ? styles.compactOption : styles.fullOption,
                {
                  backgroundColor: active
                    ? Colors.accent
                    : dark
                      ? Colors.cardBackgroundDark
                      : Colors.cardBackground,
                  opacity: pressed && !disabled ? 0.78 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.label,
                  compact && styles.compactLabel,
                  { color: active ? Colors.white : dark ? Colors.textPrimaryDark : Colors.textPrimary },
                ]}
              >
                {option.label}
              </Text>
              {showDescription && !compact && (
                <Text
                  style={[
                    styles.description,
                    { color: active ? Colors.white : dark ? Colors.textSecondaryDark : Colors.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  {option.description}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
      {supportingText && (
        <Text style={[styles.disabledReason, { color: dark ? Colors.textSecondaryDark : Colors.textSecondary }]}>
          {supportingText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: SPACING.xs,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
    gap: SPACING.xs,
  },
  compactSegment: {
    width: 108,
  },
  fullSegment: {
    width: '100%',
  },
  option: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
  },
  compactOption: {
    minHeight: 36,
  },
  fullOption: {
    paddingVertical: SPACING.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
  },
  compactLabel: {
    fontSize: 11,
  },
  description: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledReason: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
