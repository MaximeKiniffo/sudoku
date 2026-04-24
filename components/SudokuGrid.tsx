import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useGame } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { GRID_SIZE } from '@/utils/constants';
import GridCell from './GridCell';

export default function SudokuGrid() {
  const { settings } = useGame();
  const dark = settings.theme === 'dark';

  return (
    <View
      style={[
        styles.grid,
        {
          borderColor: dark ? Colors.white : Colors.borderStrong,
          backgroundColor: dark ? Colors.cardBackgroundDark : Colors.cardBackground,
        },
      ]}
    >
      {Array.from({ length: 9 }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: 9 }, (_, col) => (
            <GridCell key={col} row={row} col={col} />
          ))}
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
});
