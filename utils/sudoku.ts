// @ts-ignore – no types for this package
import sudoku from 'sudoku';
import { Difficulty, DIFFICULTY_CLUES } from './constants';

export type Grid = (number | null)[][];

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

  // Remove clues to match difficulty
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
