import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { AppState } from 'react-native';
import {
  Grid,
  generatePuzzle,
  hasConflict,
  isSolved,
  deepCopyGrid,
  computeCandidates,
} from '@/utils/sudoku';
import { Difficulty } from '@/utils/constants';

export type AppMode = 'zen' | 'expert';
export type InputMode = 'digit' | 'candidate';

export interface CellColor {
  row: number;
  col: number;
  color: string;
}

export interface ThreadSnapshot {
  grid: Grid;
  candidates: number[][][];
  label: string;
}

interface Settings {
  theme: 'light' | 'dark';
  showErrors: boolean;
  candidateSize: number; // 8–14
}

interface GameState {
  // Config
  mode: AppMode;
  difficulty: Difficulty;
  settings: Settings;

  // Puzzle data
  puzzle: Grid;
  solution: Grid;
  initial: boolean[][];
  playerGrid: Grid;

  // Expert: candidates stored as number[][] per cell (user-toggled)
  userCandidates: number[][][]; // [row][col] = list of toggled candidate numbers
  autoCandidates: Set<number>[][];

  // Selection
  selectedCell: { row: number; col: number } | null;
  selectedDigit: number | null; // for highlighting all occurrences

  // Input mode (expert only)
  inputMode: InputMode;

  // Cell colors (expert coloring tool)
  cellColors: Record<string, string>;

  // Thread snapshots (expert)
  threads: ThreadSnapshot[];

  // Timer
  elapsedSeconds: number;
  timerActive: boolean;

  // State flags
  isSolvedFlag: boolean;
  isGameStarted: boolean;
}

interface GameContextValue extends GameState {
  setMode: (mode: AppMode) => void;
  setDifficulty: (d: Difficulty) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  startNewGame: () => void;
  selectCell: (row: number, col: number) => void;
  placeDigit: (digit: number) => void;
  eraseCell: () => void;
  toggleCandidate: (digit: number) => void;
  setInputMode: (mode: InputMode) => void;
  setCellColor: (row: number, col: number, color: string) => void;
  saveThread: () => void;
  restoreThread: (index: number) => void;
  deleteThread: (index: number) => void;
  getHint: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
}

const defaultSettings: Settings = {
  theme: 'light',
  showErrors: true,
  candidateSize: 10,
};

const defaultGrid: Grid = Array.from({ length: 9 }, () => Array(9).fill(null));

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>('zen');
  const [difficulty, setDifficultyState] = useState<Difficulty>('Moyen');
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const [puzzle, setPuzzle] = useState<Grid>(defaultGrid);
  const [solution, setSolution] = useState<Grid>(defaultGrid);
  const [initial, setInitial] = useState<boolean[][]>(
    Array.from({ length: 9 }, () => Array(9).fill(false))
  );
  const [playerGrid, setPlayerGrid] = useState<Grid>(defaultGrid);

  const [userCandidates, setUserCandidates] = useState<number[][][]>(
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []))
  );
  const [autoCandidates, setAutoCandidates] = useState<Set<number>[][]>(
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>()))
  );

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedDigit, setSelectedDigit] = useState<number | null>(null);
  const [inputMode, setInputModeState] = useState<InputMode>('digit');
  const [cellColors, setCellColorsState] = useState<Record<string, string>>({});
  const [threads, setThreads] = useState<ThreadSnapshot[]>([]);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isSolvedFlag, setIsSolvedFlag] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer management
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    setTimerActive(true);
  }, []);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);
  }, []);

  const resumeTimer = useCallback(() => {
    startTimer();
  }, [startTimer]);

  // Pause timer when app goes to background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') pauseTimer();
      else if (state === 'active' && isGameStarted && !isSolvedFlag) startTimer();
    });
    return () => sub.remove();
  }, [isGameStarted, isSolvedFlag, pauseTimer, startTimer]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startNewGame = useCallback(() => {
    const { puzzle: p, solution: s, initial: ini } = generatePuzzle(difficulty);
    const playerG = deepCopyGrid(p);
    setPuzzle(p);
    setSolution(s);
    setInitial(ini);
    setPlayerGrid(playerG);
    setUserCandidates(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [])));
    setAutoCandidates(computeCandidates(playerG));
    setSelectedCell(null);
    setSelectedDigit(null);
    setCellColorsState({});
    setThreads([]);
    setElapsedSeconds(0);
    setIsSolvedFlag(false);
    setIsGameStarted(true);
    if (timerRef.current) clearInterval(timerRef.current);
    startTimer();
  }, [difficulty, startTimer]);

  const setMode = useCallback((m: AppMode) => {
    setModeState(m);
    setInputModeState('digit');
  }, []);

  const setDifficulty = useCallback((d: Difficulty) => {
    setDifficultyState(d);
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const selectCell = useCallback(
    (row: number, col: number) => {
      setSelectedCell({ row, col });
      const val = playerGrid[row][col];
      setSelectedDigit(val ?? null);
    },
    [playerGrid]
  );

  const placeDigit = useCallback(
    (digit: number) => {
      if (!selectedCell) return;
      const { row, col } = selectedCell;
      if (initial[row][col]) return;

      const newGrid = deepCopyGrid(playerGrid);
      newGrid[row][col] = digit;
      setPlayerGrid(newGrid);
      setSelectedDigit(digit);

      // Clear user candidates for this cell
      const newCand = userCandidates.map((r) => r.map((c) => [...c]));
      newCand[row][col] = [];
      setUserCandidates(newCand);
      setAutoCandidates(computeCandidates(newGrid));

      if (isSolved(newGrid)) {
        setIsSolvedFlag(true);
        pauseTimer();
      }
    },
    [selectedCell, initial, playerGrid, userCandidates, pauseTimer]
  );

  const eraseCell = useCallback(() => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    if (initial[row][col]) return;

    const newGrid = deepCopyGrid(playerGrid);
    newGrid[row][col] = null;
    setPlayerGrid(newGrid);
    setSelectedDigit(null);

    const newCand = userCandidates.map((r) => r.map((c) => [...c]));
    newCand[row][col] = [];
    setUserCandidates(newCand);
    setAutoCandidates(computeCandidates(newGrid));
  }, [selectedCell, initial, playerGrid, userCandidates]);

  const toggleCandidate = useCallback(
    (digit: number) => {
      if (!selectedCell) return;
      const { row, col } = selectedCell;
      if (initial[row][col] || playerGrid[row][col] !== null) return;

      const newCand = userCandidates.map((r) => r.map((c) => [...c]));
      const cell = newCand[row][col];
      const idx = cell.indexOf(digit);
      if (idx >= 0) cell.splice(idx, 1);
      else cell.push(digit);
      setUserCandidates(newCand);
    },
    [selectedCell, initial, playerGrid, userCandidates]
  );

  const setInputMode = useCallback((m: InputMode) => {
    setInputModeState(m);
  }, []);

  const setCellColor = useCallback((row: number, col: number, color: string) => {
    const key = `${row}-${col}`;
    setCellColorsState((prev) => {
      if (prev[key] === color) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: color };
    });
  }, []);

  const saveThread = useCallback(() => {
    const snap: ThreadSnapshot = {
      grid: deepCopyGrid(playerGrid),
      candidates: userCandidates.map((r) => r.map((c) => [...c])),
      label: `Thread ${threads.length + 1}`,
    };
    setThreads((prev) => [...prev, snap]);
  }, [playerGrid, userCandidates, threads.length]);

  const restoreThread = useCallback(
    (index: number) => {
      const snap = threads[index];
      if (!snap) return;
      setPlayerGrid(deepCopyGrid(snap.grid));
      setUserCandidates(snap.candidates.map((r) => r.map((c) => [...c])));
      setAutoCandidates(computeCandidates(snap.grid));
      setIsSolvedFlag(false);
    },
    [threads]
  );

  const deleteThread = useCallback((index: number) => {
    setThreads((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const getHint = useCallback(() => {
    if (!selectedCell) {
      // Find first empty conflicting or empty cell
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (!initial[r][c] && (playerGrid[r][c] === null || hasConflict(playerGrid, r, c))) {
            setSelectedCell({ row: r, col: c });
            const newGrid = deepCopyGrid(playerGrid);
            newGrid[r][c] = solution[r][c];
            setPlayerGrid(newGrid);
            setAutoCandidates(computeCandidates(newGrid));
            return;
          }
        }
      }
      return;
    }
    const { row, col } = selectedCell;
    if (initial[row][col]) return;
    const newGrid = deepCopyGrid(playerGrid);
    newGrid[row][col] = solution[row][col];
    setPlayerGrid(newGrid);
    setAutoCandidates(computeCandidates(newGrid));
    if (isSolved(newGrid)) {
      setIsSolvedFlag(true);
      pauseTimer();
    }
  }, [selectedCell, initial, playerGrid, solution, pauseTimer]);

  const value: GameContextValue = {
    mode,
    difficulty,
    settings,
    puzzle,
    solution,
    initial,
    playerGrid,
    userCandidates,
    autoCandidates,
    selectedCell,
    selectedDigit,
    inputMode,
    cellColors,
    threads,
    elapsedSeconds,
    timerActive,
    isSolvedFlag,
    isGameStarted,
    setMode,
    setDifficulty,
    updateSettings,
    startNewGame,
    selectCell,
    placeDigit,
    eraseCell,
    toggleCandidate,
    setInputMode,
    setCellColor,
    saveThread,
    restoreThread,
    deleteThread,
    getHint,
    pauseTimer,
    resumeTimer,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
