import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const GRID_SIZE = Math.min(width - 24, 380);
export const CELL_SIZE = GRID_SIZE / 9;

export const DIFFICULTIES = ['Facile', 'Moyen', 'Difficile', 'Expert'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_CLUES: Record<Difficulty, number> = {
  Facile: 46,
  Moyen: 36,
  Difficile: 28,
  Expert: 22,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 20,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
