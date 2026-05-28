import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/utils/colors';
import { CELL_SIZE, GRID_SIZE, BORDER_RADIUS } from '@/utils/constants';
import { Grid } from '@/utils/sudoku';

interface CellPosition {
  row: number;
  col: number;
}

interface Props {
  grid: Grid;
  selectedCell: CellPosition | null;
  conflictCells: Set<string>;
  dark: boolean;
  onSelect: (row: number, col: number) => void;
}

export default function EditableSudokuGrid({
  grid,
  selectedCell,
  conflictCells,
  dark,
  onSelect,
}: Props) {
  const selectedValue =
    selectedCell != null ? grid[selectedCell.row][selectedCell.col] : null;

  return (
    <View
      style={[
        styles.grid,
        {
          borderColor: dark ? Colors.borderStrongDark : Colors.borderStrong,
          backgroundColor: dark ? Colors.cardBackgroundDark : Colors.cardBackground,
        },
      ]}
    >
      {Array.from({ length: 9 }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: 9 }, (_, col) => {
            const value = grid[row][col];
            const isSelected = selectedCell?.row === row && selectedCell?.col === col;
            const isSameRow = selectedCell?.row === row;
            const isSameCol = selectedCell?.col === col;
            const isSameBox =
              selectedCell != null &&
              Math.floor(selectedCell.row / 3) === Math.floor(row / 3) &&
              Math.floor(selectedCell.col / 3) === Math.floor(col / 3);
            const isSameDigit =
              selectedValue !== null && value === selectedValue && !isSelected;
            const isConflict = conflictCells.has(`${row}-${col}`);
            const borderRight = (col + 1) % 3 === 0 && col < 8;
            const borderBottom = (row + 1) % 3 === 0 && row < 8;
            const strongBorderColor = dark ? Colors.borderStrongDark : Colors.borderStrong;

            let bgColor = dark ? Colors.cellBackgroundDark : 'transparent';
            if (isConflict) bgColor = dark ? Colors.dangerSurfaceDark : Colors.dangerSurface;
            else if (isSelected) bgColor = dark ? Colors.selectedDark : Colors.selected;
            else if (isSameDigit) bgColor = dark ? Colors.sameDigitDark : Colors.sameDigit;
            else if (isSameRow || isSameCol || isSameBox) {
              bgColor = dark ? Colors.highlightedDark : Colors.highlighted;
            }

            return (
              <Pressable
                key={col}
                onPress={() => onSelect(row, col)}
                accessibilityRole="button"
                accessibilityLabel={
                  value === null
                    ? `Case vide ligne ${row + 1}, colonne ${col + 1}`
                    : `Case ligne ${row + 1}, colonne ${col + 1}, chiffre ${value}`
                }
                accessibilityState={{ selected: isSelected }}
              >
                <View
                  style={[
                    styles.cell,
                    dark && styles.cellDark,
                    { backgroundColor: bgColor },
                    isConflict && styles.conflictCell,
                    isConflict && {
                      borderColor: dark ? Colors.errorTextDark : Colors.danger,
                    },
                    borderRight && {
                      borderRightWidth: 2,
                      borderRightColor: strongBorderColor,
                    },
                    borderBottom && {
                      borderBottomWidth: 2,
                      borderBottomColor: strongBorderColor,
                    },
                  ]}
                >
                  {value !== null && (
                    <Text
                      style={[
                        styles.digit,
                        { color: dark ? Colors.playerDigitDark : Colors.playerDigit },
                        isConflict && {
                          color: dark ? Colors.errorTextDark : Colors.errorText,
                        },
                      ]}
                    >
                      {value}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderWidth: 2,
    borderRadius: 6,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
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
    fontWeight: '700',
    textAlign: 'center',
  },
});
