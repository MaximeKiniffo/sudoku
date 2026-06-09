import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useGame, InputMode } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { SPACING, BORDER_RADIUS } from '@/utils/constants';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const DIGIT_ROWS = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

const INPUT_OPTIONS: { value: InputMode; label: string; icon: IconName }[] = [
  { value: 'digit', label: 'Chiffre', icon: 'keypad-outline' },
  { value: 'candidate', label: 'Note', icon: 'create-outline' },
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
  const isExpertMode = mode === 'expert';
  const isCandidateMode = isExpertMode && inputMode === 'candidate';
  const candidateSurface = dark ? Colors.highlightedDark : Colors.highlighted;
  const keySurface = dark ? Colors.cardBackgroundDark : Colors.cardBackground;

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
    if (isCandidateMode) {
      toggleCandidate(digit);
    } else {
      placeDigit(digit);
    }
  };

  const digitGrid = (
    <View style={[styles.digitRows, isExpertMode && styles.expertDigitRows]}>
      {DIGIT_ROWS.map((row) => (
        <View key={row.join('-')} style={[styles.digitRow, isExpertMode && styles.expertDigitRow]}>
          {row.map((digit) => {
            const complete = digitCounts[digit] >= 9;
            const disabled = complete && inputMode === 'digit';
            const noteActive =
              isExpertMode &&
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
                    ? `Chiffre ${digit} complété`
                    : inputMode === 'candidate'
                      ? `Ajouter ou retirer la note ${digit}`
                      : `Entrer le chiffre ${digit}`
                }
                style={({ pressed }) => [
                  styles.key,
                  isExpertMode && styles.expertKey,
                  disabled && styles.disabledKey,
                  isCandidateMode && styles.noteKey,
                  isExpertMode && isCandidateMode && styles.expertNoteKey,
                  {
                    backgroundColor: active
                      ? Colors.accent
                      : keySurface,
                    borderColor: isCandidateMode
                      ? active
                        ? Colors.accent
                        : dark
                          ? Colors.borderStrongDark
                          : Colors.borderStrong
                      : dark
                        ? Colors.borderDark
                        : Colors.border,
                    opacity: disabled
                      ? 0.32
                      : complete && inputMode === 'digit' && !active
                        ? 0.56
                        : pressed
                          ? 0.75
                          : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.keyText,
                    isExpertMode && styles.expertKeyText,
                    isCandidateMode && styles.noteKeyText,
                    isExpertMode && isCandidateMode && styles.expertNoteKeyText,
                    { color: active ? Colors.white : text },
                  ]}
                >
                  {digit}
                </Text>
                {noteActive && (
                  <View style={[styles.noteActiveDot, styles.expertNoteActiveDot]} />
                )}
                {complete && !isExpertMode && (
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
  );

  const inputModeSelector = isExpertMode ? (
    <View style={[styles.inputRail, { backgroundColor: keySurface }]}>
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
            <Ionicons
              name={option.icon}
              size={17}
              color={active ? Colors.white : subText}
            />
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
  ) : null;

  return (
    <View
      style={[
        styles.pad,
        isExpertMode && styles.expertPad,
        {
          backgroundColor: isCandidateMode ? candidateSurface : bg,
          borderColor: isCandidateMode ? Colors.accent : dark ? Colors.borderDark : Colors.border,
        },
      ]}
    >
      {isExpertMode ? (
        <View style={styles.expertPadBody}>
          <View style={styles.expertDigitGrid}>{digitGrid}</View>
          {inputModeSelector}
        </View>
      ) : (
        digitGrid
      )}

      <View style={[styles.actionRow, isExpertMode && styles.expertActionRow]}>
        <Pressable
          onPress={undoLastMove}
          disabled={!canUndo}
          accessibilityRole="button"
          accessibilityLabel="Annuler le dernier coup"
          accessibilityState={{ disabled: !canUndo }}
          style={({ pressed }) => [
            styles.key,
            styles.actionKey,
            isExpertMode && styles.expertActionKey,
            !canUndo && styles.disabledKey,
            {
              backgroundColor: keySurface,
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
          accessibilityLabel="Effacer la case sélectionnée"
          style={({ pressed }) => [
            styles.key,
            styles.actionKey,
            isExpertMode && styles.expertActionKey,
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
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.sm,
    gap: SPACING.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  expertPad: {
    gap: SPACING.xs,
  },
  expertPadBody: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: SPACING.xs,
  },
  expertDigitGrid: {
    flex: 1,
  },
  inputRail: {
    width: 82,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
    gap: SPACING.xs,
  },
  inputOption: {
    flex: 1,
    minHeight: 0,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  inputOptionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  digitRows: {
    gap: SPACING.sm,
  },
  expertDigitRows: {
    gap: SPACING.xs,
  },
  digitRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  expertDigitRow: {
    gap: SPACING.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  expertActionRow: {
    gap: SPACING.xs,
  },
  key: {
    flex: 1,
    minHeight: 54,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  expertKey: {
    minHeight: 44,
    borderRadius: BORDER_RADIUS.sm,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '800',
  },
  expertKeyText: {
    fontSize: 20,
  },
  noteKey: {
    minHeight: 50,
  },
  expertNoteKey: {
    minHeight: 44,
  },
  noteKeyText: {
    fontSize: 19,
  },
  expertNoteKeyText: {
    fontSize: 17,
  },
  noteActiveDot: {
    position: 'absolute',
    right: SPACING.sm,
    bottom: SPACING.sm,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  expertNoteActiveDot: {
    right: 5,
    bottom: 5,
    width: 5,
    height: 5,
  },
  actionKey: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  expertActionKey: {
    minHeight: 46,
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
