import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { AppState, Platform } from 'react-native';
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
  hintedCells: HintedCells;
  label: string;
}

export interface Settings {
  theme: 'light' | 'dark';
  showErrors: boolean;
  candidateSize: number;
}

export interface SavedGameState {
  mode: AppMode;
  difficulty: Difficulty;
  settings: Settings;
  puzzle: Grid;
  solution: Grid;
  initial: boolean[][];
  playerGrid: Grid;
  userCandidates: number[][][];
  cellColors: Record<string, string>;
  threads: ThreadSnapshot[];
  selectedCell: { row: number; col: number } | null;
  selectedDigit: number | null;
  elapsedSeconds: number;
  hintedCells: HintedCells;
  isGameStarted: boolean;
  savedAt: string;
}

type HintedCells = Record<string, true>;

type MoveSnapshot = {
  playerGrid: Grid;
  userCandidates: number[][][];
  hintedCells: HintedCells;
  selectedCell: { row: number; col: number } | null;
  selectedDigit: number | null;
};

type SaveableGameState = Omit<SavedGameState, 'savedAt'> & {
  isHydrated: boolean;
  isSolvedFlag: boolean;
};

interface GameState {
  mode: AppMode;
  newGameMode: AppMode;
  difficulty: Difficulty;
  settings: Settings;
  puzzle: Grid;
  solution: Grid;
  initial: boolean[][];
  playerGrid: Grid;
  userCandidates: number[][][];
  autoCandidates: Set<number>[][];
  selectedCell: { row: number; col: number } | null;
  selectedDigit: number | null;
  inputMode: InputMode;
  cellColors: Record<string, string>;
  threads: ThreadSnapshot[];
  history: MoveSnapshot[];
  canUndo: boolean;
  elapsedSeconds: number;
  timerActive: boolean;
  isSolvedFlag: boolean;
  isGameStarted: boolean;
  hasSavedGame: boolean;
  isHydrated: boolean;
}

interface GameContextValue extends GameState {
  setMode: (mode: AppMode) => void;
  setNewGameMode: (mode: AppMode) => void;
  setDifficulty: (d: Difficulty) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  startNewGame: () => void;
  selectCell: (row: number, col: number) => void;
  placeDigit: (digit: number) => void;
  eraseCell: () => void;
  undoLastMove: () => void;
  toggleCandidate: (digit: number) => void;
  setInputMode: (mode: InputMode) => void;
  setCellColor: (row: number, col: number, color: string) => void;
  saveThread: () => void;
  restoreThread: (index: number) => void;
  deleteThread: (index: number) => void;
  getHint: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  loadSavedGame: () => Promise<boolean>;
  clearSavedGame: () => Promise<void>;
}

const SETTINGS_STORAGE_KEY = 'sudoku:settings:v1';
const GAME_STORAGE_KEY = 'sudoku:saved-game:v1';

const defaultSettings: Settings = {
  theme: 'light',
  showErrors: true,
  candidateSize: 10,
};

const createEmptyGrid = (): Grid =>
  Array.from({ length: 9 }, () => Array(9).fill(null));

const createInitialGrid = (): boolean[][] =>
  Array.from({ length: 9 }, () => Array(9).fill(false));

const createEmptyCandidates = (): number[][][] =>
  Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));

const createEmptyHintedCells = (): HintedCells => ({});

const getCellKey = (row: number, col: number) => `${row}-${col}`;

const cloneCandidates = (candidates: number[][][] = createEmptyCandidates()) =>
  candidates.map((r) => r.map((c) => [...c]));

const cloneHintedCells = (hintedCells?: HintedCells | null): HintedCells => ({
  ...(hintedCells ?? {}),
});

const normalizeThread = (thread: Partial<ThreadSnapshot>): ThreadSnapshot => ({
  grid: thread.grid ? deepCopyGrid(thread.grid) : createEmptyGrid(),
  candidates: cloneCandidates(thread.candidates),
  hintedCells: cloneHintedCells(thread.hintedCells),
  label: thread.label ?? 'Thread',
});

const parseSavedGame = (raw: string): SavedGameState | null => {
  try {
    const saved = JSON.parse(raw) as Partial<SavedGameState>;

    if (
      !saved ||
      typeof saved !== 'object' ||
      !saved.isGameStarted ||
      !Array.isArray(saved.puzzle) ||
      !Array.isArray(saved.solution) ||
      !Array.isArray(saved.initial) ||
      !Array.isArray(saved.playerGrid) ||
      !Array.isArray(saved.userCandidates)
    ) {
      return null;
    }

    return saved as SavedGameState;
  } catch {
    return null;
  }
};

const defaultGrid = createEmptyGrid();

const GameContext = createContext<GameContextValue | null>(null);

function triggerHaptic(type: 'selection' | 'impact' | 'success' = 'selection') {
  if (Platform.OS === 'web') return;

  if (type === 'impact') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    return;
  }

  if (type === 'success') {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => undefined
    );
    return;
  }

  void Haptics.selectionAsync().catch(() => undefined);
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>('zen');
  const [newGameMode, setNewGameModeState] = useState<AppMode>('zen');
  const [difficulty, setDifficultyState] = useState<Difficulty>('Moyen');
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const [puzzle, setPuzzle] = useState<Grid>(defaultGrid);
  const [solution, setSolution] = useState<Grid>(defaultGrid);
  const [initial, setInitial] = useState<boolean[][]>(createInitialGrid);
  const [playerGrid, setPlayerGrid] = useState<Grid>(defaultGrid);
  const [userCandidates, setUserCandidates] = useState<number[][][]>(
    createEmptyCandidates
  );
  const [autoCandidates, setAutoCandidates] = useState<Set<number>[][]>(
    Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => new Set<number>())
    )
  );

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(
    null
  );
  const [selectedDigit, setSelectedDigit] = useState<number | null>(null);
  const [inputMode, setInputModeState] = useState<InputMode>('digit');
  const [cellColors, setCellColorsState] = useState<Record<string, string>>({});
  const [threads, setThreads] = useState<ThreadSnapshot[]>([]);
  const [hintedCells, setHintedCells] = useState<HintedCells>(createEmptyHintedCells);
  const [history, setHistory] = useState<MoveSnapshot[]>([]);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isSolvedFlag, setIsSolvedFlag] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasTimerActiveBeforeBackground = useRef(false);
  const storageOperationRef = useRef(0);
  const storageQueueRef = useRef<Promise<void>>(Promise.resolve());
  const elapsedSecondsRef = useRef(0);
  const latestSaveStateRef = useRef<SaveableGameState>({
    mode,
    difficulty,
    settings,
    puzzle,
    solution,
    initial,
    playerGrid,
    userCandidates,
    cellColors,
    threads,
    selectedCell,
    selectedDigit,
    elapsedSeconds,
    hintedCells,
    isGameStarted,
    isHydrated,
    isSolvedFlag,
  });

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
    latestSaveStateRef.current = {
      mode,
      difficulty,
      settings,
      puzzle,
      solution,
      initial,
      playerGrid,
      userCandidates,
      cellColors,
      threads,
      selectedCell,
      selectedDigit,
      elapsedSeconds,
      hintedCells,
      isGameStarted,
      isHydrated,
      isSolvedFlag,
    };
  }, [
    mode,
    difficulty,
    settings,
    puzzle,
    solution,
    initial,
    playerGrid,
    userCandidates,
    cellColors,
    threads,
    selectedCell,
    selectedDigit,
    elapsedSeconds,
    hintedCells,
    isGameStarted,
    isHydrated,
    isSolvedFlag,
  ]);

  const enqueueGameStorageOperation = useCallback((task: () => Promise<void>) => {
    const run = storageQueueRef.current
      .catch(() => undefined)
      .then(task)
      .catch(() => undefined);
    storageQueueRef.current = run;
    return run;
  }, []);

  const persistCurrentGame = useCallback(async () => {
    const {
      isHydrated: hydrated,
      isSolvedFlag: solved,
      ...snapshot
    } = latestSaveStateRef.current;

    if (!hydrated) return;

    const operation = ++storageOperationRef.current;
    const elapsedSecondsSnapshot = elapsedSecondsRef.current;

    await enqueueGameStorageOperation(async () => {
      if (!snapshot.isGameStarted || solved) {
        await AsyncStorage.removeItem(GAME_STORAGE_KEY);
        if (operation === storageOperationRef.current) setHasSavedGame(false);
        return;
      }

      const saved: SavedGameState = {
        ...snapshot,
        elapsedSeconds: elapsedSecondsSnapshot,
        savedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(saved));

      if (operation === storageOperationRef.current) {
        setHasSavedGame(true);
      }
    });
  }, [enqueueGameStorageOperation]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => {
        const next = s + 1;
        elapsedSecondsRef.current = next;
        latestSaveStateRef.current.elapsedSeconds = next;
        return next;
      });
    }, 1000);
    setTimerActive(true);
  }, [stopTimer]);

  const pauseTimer = useCallback(() => {
    stopTimer();
    setTimerActive(false);
  }, [stopTimer]);

  const resumeTimer = useCallback(() => {
    if (!isGameStarted || isSolvedFlag) return;
    startTimer();
  }, [isGameStarted, isSolvedFlag, startTimer]);

  const pauseGame = useCallback(() => {
    pauseTimer();
    void persistCurrentGame();
  }, [pauseTimer, persistCurrentGame]);

  const resumeGame = useCallback(() => {
    resumeTimer();
  }, [resumeTimer]);

  const createMoveSnapshot = useCallback(
    (): MoveSnapshot => ({
      playerGrid: deepCopyGrid(playerGrid),
      userCandidates: cloneCandidates(userCandidates),
      hintedCells: cloneHintedCells(hintedCells),
      selectedCell: selectedCell ? { ...selectedCell } : null,
      selectedDigit,
    }),
    [hintedCells, playerGrid, selectedCell, selectedDigit, userCandidates]
  );

  const pushUndoSnapshot = useCallback(() => {
    const snapshot = createMoveSnapshot();
    setHistory((prev) => [...prev, snapshot]);
  }, [createMoveSnapshot]);

  const restoreSavedState = useCallback(
    (saved: SavedGameState) => {
      setModeState(saved.mode ?? 'zen');
      setNewGameModeState(saved.mode ?? 'zen');
      setDifficultyState(saved.difficulty ?? 'Moyen');
      setSettings({ ...defaultSettings, ...saved.settings });
      setPuzzle(saved.puzzle ?? createEmptyGrid());
      setSolution(saved.solution ?? createEmptyGrid());
      setInitial(saved.initial ?? createInitialGrid());
      setPlayerGrid(saved.playerGrid ?? createEmptyGrid());
      setUserCandidates(saved.userCandidates ?? createEmptyCandidates());
      setAutoCandidates(computeCandidates(saved.playerGrid ?? createEmptyGrid()));
      setSelectedCell(saved.selectedCell ?? null);
      setSelectedDigit(saved.selectedDigit ?? null);
      setInputModeState('digit');
      setCellColorsState(saved.cellColors ?? {});
      setThreads((saved.threads ?? []).map(normalizeThread));
      setHintedCells(cloneHintedCells(saved.hintedCells));
      setHistory([]);
      const savedElapsedSeconds = saved.elapsedSeconds ?? 0;
      elapsedSecondsRef.current = savedElapsedSeconds;
      setElapsedSeconds(savedElapsedSeconds);
      setIsSolvedFlag(false);
      setIsGameStarted(Boolean(saved.isGameStarted));
      setHasSavedGame(Boolean(saved.isGameStarted));
      pauseTimer();
    },
    [pauseTimer]
  );

  const loadSavedGame = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(GAME_STORAGE_KEY);
      if (!raw) {
        setHasSavedGame(false);
        return false;
      }
      const saved = parseSavedGame(raw);
      if (!saved) {
        const operation = ++storageOperationRef.current;
        await enqueueGameStorageOperation(async () => {
          await AsyncStorage.removeItem(GAME_STORAGE_KEY);
          if (operation === storageOperationRef.current) setHasSavedGame(false);
        });
        return false;
      }
      restoreSavedState(saved);
      return true;
    } catch {
      const operation = ++storageOperationRef.current;
      await enqueueGameStorageOperation(async () => {
        await AsyncStorage.removeItem(GAME_STORAGE_KEY);
        if (operation === storageOperationRef.current) setHasSavedGame(false);
      });
      return false;
    }
  }, [enqueueGameStorageOperation, restoreSavedState]);

  const clearSavedGame = useCallback(async () => {
    const operation = ++storageOperationRef.current;
    pauseTimer();
    setHasSavedGame(false);
    setPuzzle(createEmptyGrid());
    setSolution(createEmptyGrid());
    setInitial(createInitialGrid());
    setPlayerGrid(createEmptyGrid());
    setUserCandidates(createEmptyCandidates());
    setAutoCandidates(computeCandidates(createEmptyGrid()));
    setSelectedCell(null);
    setSelectedDigit(null);
    setInputModeState('digit');
    setCellColorsState({});
    setThreads([]);
    setHintedCells({});
    setHistory([]);
    elapsedSecondsRef.current = 0;
    setElapsedSeconds(0);
    setIsSolvedFlag(false);
    setIsGameStarted(false);
    await enqueueGameStorageOperation(async () => {
      await AsyncStorage.removeItem(GAME_STORAGE_KEY);
      if (operation === storageOperationRef.current) setHasSavedGame(false);
    });
  }, [enqueueGameStorageOperation, pauseTimer]);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const [settingsRaw, gameRaw] = await Promise.all([
          AsyncStorage.getItem(SETTINGS_STORAGE_KEY),
          AsyncStorage.getItem(GAME_STORAGE_KEY),
        ]);

        if (cancelled) return;

        if (gameRaw) {
          const saved = parseSavedGame(gameRaw);

          if (saved) {
            restoreSavedState(saved);
          } else {
            await AsyncStorage.removeItem(GAME_STORAGE_KEY);
            setHasSavedGame(false);
          }
        } else if (settingsRaw) {
          setSettings({ ...defaultSettings, ...(JSON.parse(settingsRaw) as Settings) });
          setHasSavedGame(false);
        }
      } catch {
        if (!cancelled) {
          setHasSavedGame(false);
          void AsyncStorage.removeItem(GAME_STORAGE_KEY).catch(() => undefined);
        }
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [restoreSavedState]);

  useEffect(() => {
    if (!isHydrated) return;
    void AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)).catch(
      () => undefined
    );
  }, [isHydrated, settings]);

  useEffect(() => {
    if (!isHydrated) return;
    void persistCurrentGame();
  }, [
    isHydrated,
    mode,
    difficulty,
    settings,
    puzzle,
    solution,
    initial,
    playerGrid,
    userCandidates,
    cellColors,
    threads,
    selectedCell,
    selectedDigit,
    hintedCells,
    isGameStarted,
    isSolvedFlag,
    persistCurrentGame,
  ]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        wasTimerActiveBeforeBackground.current = timerActive;
        pauseTimer();
        void persistCurrentGame();
      } else if (
        state === 'active' &&
        wasTimerActiveBeforeBackground.current &&
        isGameStarted &&
        !isSolvedFlag
      ) {
        wasTimerActiveBeforeBackground.current = false;
        startTimer();
      }
    });

    return () => sub.remove();
  }, [isGameStarted, isSolvedFlag, pauseTimer, persistCurrentGame, startTimer, timerActive]);

  useEffect(
    () => () => {
      void persistCurrentGame();
      stopTimer();
    },
    [persistCurrentGame, stopTimer]
  );

  const startNewGame = useCallback(() => {
    storageOperationRef.current += 1;
    const { puzzle: p, solution: s, initial: ini } = generatePuzzle(difficulty);
    const playerG = deepCopyGrid(p);
    setModeState(newGameMode);
    setPuzzle(p);
    setSolution(s);
    setInitial(ini);
    setPlayerGrid(playerG);
    setUserCandidates(createEmptyCandidates());
    setAutoCandidates(computeCandidates(playerG));
    setSelectedCell(null);
    setSelectedDigit(null);
    setInputModeState('digit');
    setCellColorsState({});
    setThreads([]);
    setHintedCells({});
    setHistory([]);
    elapsedSecondsRef.current = 0;
    setElapsedSeconds(0);
    setIsSolvedFlag(false);
    setIsGameStarted(true);
    setHasSavedGame(true);
    startTimer();
    triggerHaptic('impact');
  }, [difficulty, newGameMode, startTimer]);

  const setMode = useCallback((m: AppMode) => {
    setModeState(m);
    setInputModeState('digit');
    triggerHaptic('selection');
  }, []);

  const setNewGameMode = useCallback((m: AppMode) => {
    setNewGameModeState(m);
    triggerHaptic('selection');
  }, []);

  const setDifficulty = useCallback((d: Difficulty) => {
    setDifficultyState(d);
    triggerHaptic('selection');
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const selectCell = useCallback(
    (row: number, col: number) => {
      setSelectedCell({ row, col });
      const val = playerGrid[row][col];
      setSelectedDigit(val ?? null);
      triggerHaptic('selection');
    },
    [playerGrid]
  );

  const placeDigit = useCallback(
    (digit: number) => {
      if (!selectedCell) return;
      const { row, col } = selectedCell;
      if (initial[row][col]) return;

      pushUndoSnapshot();
      const newGrid = deepCopyGrid(playerGrid);
      newGrid[row][col] = digit;
      setPlayerGrid(newGrid);
      setSelectedDigit(digit);

      const newCand = userCandidates.map((r) => r.map((c) => [...c]));
      newCand[row][col] = [];
      setUserCandidates(newCand);
      setHintedCells((prev) => {
        const key = getCellKey(row, col);
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setAutoCandidates(computeCandidates(newGrid));
      triggerHaptic('impact');

      if (isSolved(newGrid)) {
        setIsSolvedFlag(true);
        pauseTimer();
        triggerHaptic('success');
      }
    },
    [selectedCell, initial, pushUndoSnapshot, playerGrid, userCandidates, pauseTimer]
  );

  const eraseCell = useCallback(() => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    if (initial[row][col]) return;
    const key = getCellKey(row, col);
    const wasHinted = Boolean(hintedCells[key]);
    if (playerGrid[row][col] === null && userCandidates[row][col].length === 0 && !wasHinted) {
      return;
    }

    pushUndoSnapshot();
    const newGrid = deepCopyGrid(playerGrid);
    newGrid[row][col] = null;
    setPlayerGrid(newGrid);
    setSelectedDigit(null);

    const newCand = userCandidates.map((r) => r.map((c) => [...c]));
    if (!wasHinted) newCand[row][col] = [];
    setUserCandidates(newCand);
    if (wasHinted) {
      setHintedCells((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    setAutoCandidates(computeCandidates(newGrid));
    triggerHaptic('selection');
  }, [selectedCell, initial, hintedCells, playerGrid, pushUndoSnapshot, userCandidates]);

  const undoLastMove = useCallback(() => {
    const last = history[history.length - 1];
    if (!last) return;

    setPlayerGrid(deepCopyGrid(last.playerGrid));
    setUserCandidates(cloneCandidates(last.userCandidates));
    setHintedCells(cloneHintedCells(last.hintedCells));
    setSelectedCell(last.selectedCell ? { ...last.selectedCell } : null);
    setSelectedDigit(last.selectedDigit);
    setAutoCandidates(computeCandidates(last.playerGrid));
    setIsSolvedFlag(false);
    setHistory((prev) => prev.slice(0, -1));
    triggerHaptic('selection');
  }, [history]);

  const toggleCandidate = useCallback(
    (digit: number) => {
      if (!selectedCell) return;
      const { row, col } = selectedCell;
      if (initial[row][col] || playerGrid[row][col] !== null) return;

      pushUndoSnapshot();
      const newCand = userCandidates.map((r) => r.map((c) => [...c]));
      const cell = newCand[row][col];
      const idx = cell.indexOf(digit);
      if (idx >= 0) cell.splice(idx, 1);
      else cell.push(digit);
      setUserCandidates(newCand);
      triggerHaptic('selection');
    },
    [selectedCell, initial, playerGrid, pushUndoSnapshot, userCandidates]
  );

  const setInputMode = useCallback((m: InputMode) => {
    setInputModeState(m);
    triggerHaptic('selection');
  }, []);

  const setCellColor = useCallback((row: number, col: number, color: string) => {
    const key = `${row}-${col}`;
    setCellColorsState((prev) => {
      if (!color || prev[key] === color) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: color };
    });
    triggerHaptic('selection');
  }, []);

  const saveThread = useCallback(() => {
    const snap: ThreadSnapshot = {
      grid: deepCopyGrid(playerGrid),
      candidates: userCandidates.map((r) => r.map((c) => [...c])),
      hintedCells: cloneHintedCells(hintedCells),
      label: `Thread ${threads.length + 1}`,
    };
    setThreads((prev) => [...prev, snap]);
    triggerHaptic('success');
  }, [playerGrid, userCandidates, hintedCells, threads.length]);

  const restoreThread = useCallback(
    (index: number) => {
      const snap = threads[index];
      if (!snap) return;
      setPlayerGrid(deepCopyGrid(snap.grid));
      setUserCandidates(snap.candidates.map((r) => r.map((c) => [...c])));
      setAutoCandidates(computeCandidates(snap.grid));
      setHintedCells(cloneHintedCells(snap.hintedCells));
      setHistory([]);
      setIsSolvedFlag(false);
      triggerHaptic('impact');
    },
    [threads]
  );

  const deleteThread = useCallback((index: number) => {
    setThreads((prev) => prev.filter((_, i) => i !== index));
    triggerHaptic('selection');
  }, []);

  const handlePotentialSolve = useCallback(
    (grid: Grid) => {
      if (isSolved(grid)) {
        setIsSolvedFlag(true);
        pauseTimer();
        triggerHaptic('success');
        return;
      }

      triggerHaptic('impact');
    },
    [pauseTimer]
  );

  const getHint = useCallback(() => {
    if (!selectedCell) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (!initial[r][c] && (playerGrid[r][c] === null || hasConflict(playerGrid, r, c))) {
            pushUndoSnapshot();
            setSelectedCell({ row: r, col: c });
            const newGrid = deepCopyGrid(playerGrid);
            newGrid[r][c] = solution[r][c];
            setPlayerGrid(newGrid);
            setHintedCells((prev) => ({ ...prev, [getCellKey(r, c)]: true }));
            setAutoCandidates(computeCandidates(newGrid));
            handlePotentialSolve(newGrid);
            return;
          }
        }
      }
      return;
    }

    const { row, col } = selectedCell;
    if (initial[row][col]) return;
    pushUndoSnapshot();
    const newGrid = deepCopyGrid(playerGrid);
    newGrid[row][col] = solution[row][col];
    setPlayerGrid(newGrid);
    setHintedCells((prev) => ({ ...prev, [getCellKey(row, col)]: true }));
    setAutoCandidates(computeCandidates(newGrid));
    handlePotentialSolve(newGrid);
  }, [selectedCell, initial, playerGrid, pushUndoSnapshot, solution, handlePotentialSolve]);

  const canUndo = history.length > 0;

  const value: GameContextValue = {
    mode,
    newGameMode,
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
    history,
    canUndo,
    elapsedSeconds,
    timerActive,
    isSolvedFlag,
    isGameStarted,
    hasSavedGame,
    isHydrated,
    setMode,
    setNewGameMode,
    setDifficulty,
    updateSettings,
    startNewGame,
    selectCell,
    placeDigit,
    eraseCell,
    undoLastMove,
    toggleCandidate,
    setInputMode,
    setCellColor,
    saveThread,
    restoreThread,
    deleteThread,
    getHint,
    pauseTimer,
    resumeTimer,
    pauseGame,
    resumeGame,
    loadSavedGame,
    clearSavedGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
