// @ts-ignore – no types for this package
import sudoku from 'sudoku';
import { Difficulty, DIFFICULTY_CLUES } from './constants';

export type Grid = (number | null)[][];

export interface CustomPuzzle {
  id: string;
  name: string;
  puzzle: Grid;
  solution: Grid;
  createdAt: string;
}

export type CustomPuzzleValidation =
  | {
      ok: true;
      puzzle: Grid;
      solution: Grid;
      initial: boolean[][];
    }
  | {
      ok: false;
      reason: 'empty' | 'conflict' | 'no-solution' | 'multiple-solutions';
      message: string;
      conflictCells: Set<string>;
    };

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function createEmptyGrid(): Grid {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}

function chunkTo9x9(flat: (number | null)[]): Grid {
  const grid: Grid = [];
  for (let r = 0; r < 9; r++) {
    grid.push(flat.slice(r * 9, r * 9 + 9));
  }
  return grid;
}

export function generatePuzzle(difficulty: Difficulty): {
  puzzle: Grid;
  solution: Grid;
  initial: boolean[][];
} {
  // sudoku.makepuzzle() returns a flat array of 81 values (0-8) or null
  let flat: (number | null)[] = sudoku.makepuzzle();
  const solutionFlat: number[] = sudoku.solvepuzzle(flat);

  // Convert 0-8 → 1-9
  const puzzleNorm = flat.map((v) => (v === null ? null : v + 1));
  const solutionNorm = solutionFlat.map((v) => v + 1);

  // Match the visible clue count for each difficulty. The library generates
  // very sparse puzzles, so easier levels need clues added back from the solution.
  const targetClues = DIFFICULTY_CLUES[difficulty];
  const filled = puzzleNorm.filter((v) => v !== null).length;
  if (filled > targetClues) {
    const givenIdxs = puzzleNorm
      .map((v, i) => (v !== null ? i : -1))
      .filter((i) => i !== -1);
    shuffleArray(givenIdxs);
    const toRemove = filled - targetClues;
    for (let i = 0; i < toRemove; i++) {
      puzzleNorm[givenIdxs[i]] = null;
    }
  } else if (filled < targetClues) {
    const emptyIdxs = puzzleNorm
      .map((v, i) => (v === null ? i : -1))
      .filter((i) => i !== -1);
    shuffleArray(emptyIdxs);
    const toAdd = Math.min(targetClues - filled, emptyIdxs.length);
    for (let i = 0; i < toAdd; i++) {
      const idx = emptyIdxs[i];
      puzzleNorm[idx] = solutionNorm[idx];
    }
  }

  const puzzle = chunkTo9x9(puzzleNorm);
  const solution = chunkTo9x9(solutionNorm);
  const initial: boolean[][] = puzzle.map((row) => row.map((v) => v !== null));

  return { puzzle, solution, initial };
}

function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function hasConflict(grid: Grid, row: number, col: number): boolean {
  const val = grid[row][col];
  if (val === null) return false;

  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] === val) return true;
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] === val) return true;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c] === val) return true;
    }
  }
  return false;
}

export function gridToFlat(grid: Grid): (number | null)[] {
  const flat: (number | null)[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      flat.push(grid[r]?.[c] ?? null);
    }
  }
  return flat;
}

export function gridToSudokuFlat(grid: Grid): (number | null)[] {
  return gridToFlat(grid).map((v) => (v === null ? null : v - 1));
}

export function sudokuFlatToGrid(flat: (number | null)[]): Grid {
  return chunkTo9x9(flat.map((v) => (v === null ? null : v + 1)));
}

export function getFilledCellCount(grid: Grid): number {
  let count = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== null) count += 1;
    }
  }
  return count;
}

export function createInitialFromGrid(grid: Grid): boolean[][] {
  return grid.map((row) => row.map((v) => v !== null));
}

export function getConflictCellKeys(grid: Grid): Set<string> {
  const conflictCells = new Set<string>();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (hasConflict(grid, r, c)) conflictCells.add(`${r}-${c}`);
    }
  }
  return conflictCells;
}

export function hasGridConflicts(grid: Grid): boolean {
  return getConflictCellKeys(grid).size > 0;
}

export function solveCustomGrid(grid: Grid): Grid | null {
  const solutionFlat = sudoku.solvepuzzle(gridToSudokuFlat(grid));
  if (!solutionFlat) return null;
  return sudokuFlatToGrid(solutionFlat);
}

function getAllowedDigits(grid: Grid, row: number, col: number): number[] {
  if (grid[row][col] !== null) return [];

  const used = new Set<number>();
  for (let i = 0; i < 9; i++) {
    const rowValue = grid[row][i];
    const colValue = grid[i][col];
    if (rowValue !== null) used.add(rowValue);
    if (colValue !== null) used.add(colValue);
  }

  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      const value = grid[r][c];
      if (value !== null) used.add(value);
    }
  }

  return DIGITS.filter((digit) => !used.has(digit));
}

function findBestEmptyCell(
  grid: Grid
): { row: number; col: number; candidates: number[] } | null {
  let best: { row: number; col: number; candidates: number[] } | null = null;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] !== null) continue;

      const candidates = getAllowedDigits(grid, row, col);
      if (candidates.length === 0) return { row, col, candidates };
      if (!best || candidates.length < best.candidates.length) {
        best = { row, col, candidates };
      }
    }
  }

  return best;
}

function countSolutions(
  grid: Grid,
  limit = 2
): { count: number; firstSolution: Grid | null } {
  const board = deepCopyGrid(grid);
  let count = 0;
  let firstSolution: Grid | null = null;

  const visit = () => {
    if (count >= limit) return;

    const emptyCell = findBestEmptyCell(board);
    if (!emptyCell) {
      count += 1;
      if (!firstSolution) firstSolution = deepCopyGrid(board);
      return;
    }

    if (emptyCell.candidates.length === 0) return;

    for (const digit of emptyCell.candidates) {
      board[emptyCell.row][emptyCell.col] = digit;
      visit();
      board[emptyCell.row][emptyCell.col] = null;
      if (count >= limit) return;
    }
  };

  visit();
  return { count, firstSolution };
}

export function validateCustomPuzzle(grid: Grid): CustomPuzzleValidation {
  const conflictCells = getConflictCellKeys(grid);

  if (getFilledCellCount(grid) === 0) {
    return {
      ok: false,
      reason: 'empty',
      message: 'Ajoute au moins un chiffre avant de jouer.',
      conflictCells,
    };
  }

  if (conflictCells.size > 0) {
    return {
      ok: false,
      reason: 'conflict',
      message: 'Corrige les conflits dans les lignes, colonnes ou blocs.',
      conflictCells,
    };
  }

  const librarySolution = solveCustomGrid(grid);
  if (!librarySolution) {
    return {
      ok: false,
      reason: 'no-solution',
      message: "Cette grille n'a pas de solution.",
      conflictCells,
    };
  }

  const { count, firstSolution } = countSolutions(grid);
  if (count === 0) {
    return {
      ok: false,
      reason: 'no-solution',
      message: "Cette grille n'a pas de solution.",
      conflictCells,
    };
  }

  if (count > 1) {
    return {
      ok: false,
      reason: 'multiple-solutions',
      message: 'Cette grille a plusieurs solutions. Ajoute quelques chiffres.',
      conflictCells,
    };
  }

  const puzzle = deepCopyGrid(grid);
  return {
    ok: true,
    puzzle,
    solution: firstSolution ?? librarySolution,
    initial: createInitialFromGrid(puzzle),
  };
}

export function isSolved(grid: Grid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === null) return false;
      if (hasConflict(grid, r, c)) return false;
    }
  }
  return true;
}

export function deepCopyGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

export function computeCandidates(grid: Grid): Set<number>[][] {
  const candidates: Set<number>[][] = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set<number>())
  );
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== null) continue;
      for (let n = 1; n <= 9; n++) {
        let ok = true;
        for (let i = 0; i < 9; i++) {
          if (grid[r][i] === n || grid[i][c] === n) { ok = false; break; }
        }
        if (ok) {
          const br = Math.floor(r / 3) * 3;
          const bc = Math.floor(c / 3) * 3;
          for (let i = br; i < br + 3 && ok; i++)
            for (let j = bc; j < bc + 3 && ok; j++)
              if (grid[i][j] === n) ok = false;
        }
        if (ok) candidates[r][c].add(n);
      }
    }
  }
  return candidates;
}
