import React, { useEffect, useRef } from 'react';
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
  useEffect(() => {
    if (value !== null && value !== prevValue.current) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 80, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }
    prevValue.current = value;
  }, [value]);

  let bgColor: string = 'transparent';
  if (customColor) bgColor = customColor;
  else if (conflict) bgColor = Colors.error;
  else if (isSelected) bgColor = Colors.selected;
  else if (isSameDigit) bgColor = Colors.sameDigit;
  else if (isSameRow || isSameCol || isSameBox) bgColor = Colors.highlighted;

  const borderRight = (col + 1) % 3 === 0 && col < 8;
  const borderBottom = (row + 1) % 3 === 0 && row < 8;

  const candidates = userCandidates[row][col];

  const handlePress = () => {
    selectCell(row, col);
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.cell,
          { backgroundColor: bgColor, transform: [{ scale }] },
          borderRight && styles.borderRight,
          borderBottom && styles.borderBottom,
          dark && styles.cellDark,
        ]}
      >
        {value !== null ? (
          <Text
            style={[
              styles.digit,
              { color: isInitial ? (dark ? Colors.white : Colors.given) : Colors.playerDigit },
              isInitial && styles.givenDigit,
              conflict && styles.conflictText,
            ]}
          >
            {value}
          </Text>
        ) : mode === 'expert' && candidates.length > 0 ? (
          <CandidateGrid candidates={candidates} fontSize={settings.candidateSize} />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function CandidateGrid({ candidates, fontSize }: { candidates: number[]; fontSize: number }) {
  return (
    <View style={styles.candidateGrid}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <Text
          key={n}
          style={[
            styles.candidateDigit,
            { fontSize, color: candidates.includes(n) ? Colors.playerDigit : 'transparent' },
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
    borderRadius: BORDER_RADIUS.sm - 2,
  },
  cellDark: {},
  borderRight: {
    borderRightWidth: 2,
    borderRightColor: Colors.borderStrong,
  },
  borderBottom: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.borderStrong,
  },
  digit: {
    fontSize: CELL_SIZE * 0.52,
    fontWeight: '500',
    textAlign: 'center',
  },
  givenDigit: {
    fontWeight: '700',
  },
  conflictText: {
    color: Colors.errorText,
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
