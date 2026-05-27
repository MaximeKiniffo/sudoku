import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { useGame } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { CELL_SIZE, BORDER_RADIUS } from '@/utils/constants';
import { hasConflict } from '@/utils/sudoku';

interface Props {
  row: number;
  col: number;
}

export default function GridCell({ row, col }: Props) {
  const {
    playerGrid,
    solution,
    initial,
    selectedCell,
    selectedDigit,
    mode,
    userCandidates,
    settings,
    cellColors,
    selectCell,
  } = useGame();

  const dark = settings.theme === 'dark';
  const value = playerGrid[row][col];
  const isInitial = initial[row][col];
  const isSelected =
    selectedCell?.row === row && selectedCell?.col === col;

  const conflict =
    settings.showErrors && value !== null && hasConflict(playerGrid, row, col);

  const isSameRow = selectedCell?.row === row;
  const isSameCol = selectedCell?.col === col;
  const isSameBox =
    selectedCell != null &&
    Math.floor(selectedCell.row / 3) === Math.floor(row / 3) &&
    Math.floor(selectedCell.col / 3) === Math.floor(col / 3);

  const isSameDigit =
    selectedDigit !== null && value === selectedDigit && !isSelected;

  const colorKey = `${row}-${col}`;
  const customColor = cellColors[colorKey];

  // Animation on digit place
  const scale = useRef(new Animated.Value(1)).current;
  const prevValue = useRef(value);
  const mistakeFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mistakeFlash, setMistakeFlash] = useState(false);

  useEffect(() => {
    if (value !== null && value !== prevValue.current) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 80, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();

      if (!isInitial && value !== solution[row][col]) {
        setMistakeFlash(true);
        if (mistakeFlashTimer.current) clearTimeout(mistakeFlashTimer.current);
        mistakeFlashTimer.current = setTimeout(() => {
          setMistakeFlash(false);
          mistakeFlashTimer.current = null;
        }, 320);
      }
    }
    prevValue.current = value;
  }, [col, isInitial, row, scale, solution, value]);

  useEffect(
    () => () => {
      if (mistakeFlashTimer.current) clearTimeout(mistakeFlashTimer.current);
    },
    []
  );

  let bgColor: string = dark ? Colors.cellBackgroundDark : 'transparent';
  if (mistakeFlash || conflict) bgColor = dark ? Colors.dangerSurfaceDark : Colors.dangerSurface;
  else if (customColor) bgColor = customColor;
  else if (isSelected) bgColor = dark ? Colors.selectedDark : Colors.selected;
  else if (isSameDigit) bgColor = dark ? Colors.sameDigitDark : Colors.sameDigit;
  else if (isSameRow || isSameCol || isSameBox) {
    bgColor = dark ? Colors.highlightedDark : Colors.highlighted;
  }

  const borderRight = (col + 1) % 3 === 0 && col < 8;
  const borderBottom = (row + 1) % 3 === 0 && row < 8;
  const strongBorderColor = dark ? Colors.borderStrongDark : Colors.borderStrong;
  const playerColor = dark ? Colors.playerDigitDark : Colors.playerDigit;

  const candidates = userCandidates[row][col];

  const handlePress = () => {
    selectCell(row, col);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={
        value === null
          ? `Case vide ligne ${row + 1}, colonne ${col + 1}`
          : `Case ligne ${row + 1}, colonne ${col + 1}, chiffre ${value}`
      }
      accessibilityState={{ selected: isSelected }}
    >
      <Animated.View
        style={[
          styles.cell,
          dark && styles.cellDark,
          { backgroundColor: bgColor, transform: [{ scale }] },
          (mistakeFlash || conflict) && styles.conflictCell,
          (mistakeFlash || conflict) && { borderColor: dark ? Colors.errorTextDark : Colors.danger },
          borderRight && { borderRightWidth: 2, borderRightColor: strongBorderColor },
          borderBottom && { borderBottomWidth: 2, borderBottomColor: strongBorderColor },
        ]}
      >
        {value !== null ? (
          <Text
            style={[
              styles.digit,
              { color: isInitial ? (dark ? Colors.givenDark : Colors.given) : playerColor },
              isInitial && styles.givenDigit,
              conflict && { color: dark ? Colors.errorTextDark : Colors.errorText },
            ]}
          >
            {value}
          </Text>
        ) : mode === 'expert' && candidates.length > 0 ? (
          <CandidateGrid
            candidates={candidates}
            fontSize={settings.candidateSize}
            color={playerColor}
          />
        ) : null}
        {conflict && (
          <View style={styles.conflictIcon}>
            <Ionicons
              name="alert-circle"
              size={12}
              color={dark ? Colors.errorTextDark : Colors.danger}
            />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

function CandidateGrid({
  candidates,
  fontSize,
  color,
}: {
  candidates: number[];
  fontSize: number;
  color: string;
}) {
  return (
    <View style={styles.candidateGrid}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <Text
          key={n}
          style={[
            styles.candidateDigit,
            { fontSize, color: candidates.includes(n) ? color : 'transparent' },
          ]}
        >
          {n}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.cellBorder,
    borderRadius: BORDER_RADIUS.sm - 2,
  },
  cellDark: {
    borderColor: Colors.cellBorderDark,
  },
  conflictCell: {
    borderWidth: 1.5,
  },
  digit: {
    fontSize: CELL_SIZE * 0.52,
    fontWeight: '500',
    textAlign: 'center',
  },
  givenDigit: {
    fontWeight: '700',
  },
  conflictIcon: {
    position: 'absolute',
    right: 2,
    top: 2,
  },
  candidateGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 1,
    paddingVertical: 1,
  },
  candidateDigit: {
    width: '33.33%',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: undefined,
  },
});
