import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useGame, InputMode } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { SPACING, BORDER_RADIUS, MIN_TOUCH_TARGET } from '@/utils/constants';

const DIGIT_ROWS = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

const INPUT_OPTIONS: { value: InputMode; label: string }[] = [
  { value: 'digit', label: 'Chiffre' },
  { value: 'candidate', label: 'Note' },
];

export default function NumberPad() {
  const {
    placeDigit,
    toggleCandidate,
    eraseCell,
    undoLastMove,
    canUndo,
    inputMode,
    setInputMode,
    mode,
    selectedDigit,
    selectedCell,
    userCandidates,
    playerGrid,
    settings,
  } = useGame();
  const dark = settings.theme === 'dark';
  const bg = dark ? Colors.surfaceDark : Colors.surface;
  const text = dark ? Colors.textPrimaryDark : Colors.textPrimary;
  const subText = dark ? Colors.textSecondaryDark : Colors.textSecondary;

  const digitCounts = Array.from({ length: 10 }, () => 0);
  playerGrid.forEach((row) => {
    row.forEach((value) => {
      if (value !== null) digitCounts[value] += 1;
    });
  });

  const selectedCandidates = selectedCell
    ? userCandidates[selectedCell.row][selectedCell.col]
    : [];

  const handlePress = (digit: number) => {
    if (mode === 'expert' && inputMode === 'candidate') {
      toggleCandidate(digit);
    } else {
      placeDigit(digit);
    }
  };

  return (
    <View style={[styles.pad, { backgroundColor: bg }]}>
      {mode === 'expert' && (
        <View
          style={[
            styles.inputSegment,
            { backgroundColor: dark ? Colors.cardBackgroundDark : Colors.cardBackground },
          ]}
        >
          {INPUT_OPTIONS.map((option) => {
            const active = inputMode === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setInputMode(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Saisie ${option.label}`}
                style={({ pressed }) => [
                  styles.inputOption,
                  {
                    backgroundColor: active ? Colors.accent : 'transparent',
                    opacity: pressed ? 0.78 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.inputOptionText,
                    { color: active ? Colors.white : subText },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.digitRows}>
        {DIGIT_ROWS.map((row) => (
          <View key={row.join('-')} style={styles.digitRow}>
            {row.map((digit) => {
              const complete = digitCounts[digit] >= 9;
              const disabled = complete && inputMode === 'digit';
              const noteActive =
                mode === 'expert' &&
                inputMode === 'candidate' &&
                selectedCandidates.includes(digit);
              const digitActive = selectedDigit === digit && inputMode === 'digit';
              const active = digitActive || noteActive;

              return (
                <Pressable
                  key={digit}
                  disabled={disabled}
                  onPress={() => handlePress(digit)}
                  accessibilityRole="button"
                  accessibilityState={{ disabled, selected: active }}
                  accessibilityLabel={
                    complete
                      ? `Chiffre ${digit} complete`
                      : inputMode === 'candidate'
                        ? `Ajouter ou retirer la note ${digit}`
                        : `Entrer le chiffre ${digit}`
                  }
                  style={({ pressed }) => [
                    styles.key,
                    disabled && styles.disabledKey,
                    {
                      backgroundColor: active
                        ? Colors.accent
                        : dark
                          ? Colors.cardBackgroundDark
                          : Colors.cardBackground,
                      opacity: disabled ? 0.32 : complete && !active ? 0.56 : pressed ? 0.75 : 1,
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
                  {complete && (
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color={active ? Colors.white : Colors.success}
                      style={styles.completeIcon}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={undoLastMove}
          disabled={!canUndo}
          accessibilityRole="button"
          accessibilityLabel="Annuler le dernier coup"
          accessibilityState={{ disabled: !canUndo }}
          style={({ pressed }) => [
            styles.key,
            styles.actionKey,
            !canUndo && styles.disabledKey,
            {
              backgroundColor: dark ? Colors.cardBackgroundDark : Colors.cardBackground,
              opacity: !canUndo ? 0.32 : pressed ? 0.75 : 1,
            },
          ]}
        >
          <Ionicons name="return-down-back-outline" size={22} color={subText} />
          <Text style={[styles.actionText, { color: subText }]}>Annuler</Text>
        </Pressable>

        <Pressable
          onPress={eraseCell}
          accessibilityRole="button"
          accessibilityLabel="Effacer la case selectionnee"
          style={({ pressed }) => [
            styles.key,
            styles.actionKey,
            {
              backgroundColor: dark ? Colors.cardBackgroundDark : Colors.cardBackground,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Ionicons name="backspace-outline" size={22} color={subText} />
          <Text style={[styles.actionText, { color: subText }]}>Effacer</Text>
        </Pressable>
      </View>
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
  inputSegment: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
    gap: SPACING.xs,
  },
  inputOption: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputOptionText: {
    fontSize: 14,
    fontWeight: '800',
  },
  digitRows: {
    gap: SPACING.sm,
  },
  digitRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  key: {
    flex: 1,
    minHeight: 54,
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
    fontSize: 24,
    fontWeight: '800',
  },
  actionKey: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  disabledKey: {
    elevation: 0,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '800',
  },
  completeIcon: {
    position: 'absolute',
    right: SPACING.sm,
    top: SPACING.sm,
  },
});
