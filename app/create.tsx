import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { SPACING, BORDER_RADIUS, MIN_TOUCH_TARGET } from '@/utils/constants';
import {
  Grid,
  createEmptyGrid,
  deepCopyGrid,
  getConflictCellKeys,
  getFilledCellCount,
  validateCustomPuzzle,
} from '@/utils/sudoku';
import EditableSudokuGrid from '@/components/EditableSudokuGrid';
import CreatorNumberPad from '@/components/CreatorNumberPad';

type CellPosition = { row: number; col: number };
type Feedback = { tone: 'error' | 'info'; message: string };

export default function CreateScreen() {
  const router = useRouter();
  const { settings, startCustomGame, isHydrated, newGameMode } = useGame();
  const [grid, setGrid] = useState<Grid>(() => createEmptyGrid());
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const dark = settings.theme === 'dark';
  const bg = dark ? Colors.backgroundDark : Colors.background;
  const text = dark ? Colors.textPrimaryDark : Colors.textPrimary;
  const subText = dark ? Colors.textSecondaryDark : Colors.textSecondary;
  const surface = dark ? Colors.surfaceDark : Colors.surface;
  const card = dark ? Colors.cardBackgroundDark : Colors.cardBackground;
  const border = dark ? Colors.borderDark : Colors.border;
  const conflictCells = useMemo(() => getConflictCellKeys(grid), [grid]);
  const filledCount = useMemo(() => getFilledCellCount(grid), [grid]);
  const selectedDigit =
    selectedCell != null ? grid[selectedCell.row][selectedCell.col] : null;
  const visibleFeedback =
    feedback ??
    (conflictCells.size > 0
      ? {
          tone: 'error' as const,
          message: 'Conflit detecte dans une ligne, colonne ou bloc.',
        }
      : null);

  const handleSelect = (row: number, col: number) => {
    setSelectedCell({ row, col });
    setFeedback(null);
  };

  const handleDigit = (digit: number) => {
    if (!selectedCell) {
      setFeedback({
        tone: 'error',
        message: 'Selectionne une case avant de placer un chiffre.',
      });
      return;
    }

    setGrid((prev) => {
      const next = deepCopyGrid(prev);
      next[selectedCell.row][selectedCell.col] = digit;
      return next;
    });
    setFeedback(null);
  };

  const handleErase = () => {
    if (!selectedCell) {
      setFeedback({
        tone: 'error',
        message: 'Selectionne une case a effacer.',
      });
      return;
    }

    setGrid((prev) => {
      const next = deepCopyGrid(prev);
      next[selectedCell.row][selectedCell.col] = null;
      return next;
    });
    setFeedback(null);
  };

  const handleReset = () => {
    setGrid(createEmptyGrid());
    setSelectedCell(null);
    setFeedback(null);
  };

  const handlePlay = () => {
    if (!isHydrated) {
      setFeedback({
        tone: 'info',
        message: 'Chargement de la sauvegarde locale...',
      });
      return;
    }

    const result = validateCustomPuzzle(grid);
    if (!result.ok) {
      setFeedback({ tone: 'error', message: result.message });
      return;
    }

    startCustomGame(result.puzzle, result.solution);
    router.replace('/game');
  };

  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={[styles.safe, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Retour a l'accueil"
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={20} color={subText} />
          <Text style={[styles.backText, { color: subText }]}>Accueil</Text>
        </Pressable>

        <Text style={[styles.headerTitle, { color: text }]}>Creer un sudoku</Text>

        <Pressable
          onPress={handleReset}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Vider la grille"
          style={styles.iconBtn}
        >
          <Ionicons name="refresh-outline" size={22} color={subText} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <View style={[styles.statusCard, { backgroundColor: card, borderColor: border }]}>
          <View style={styles.statusTopRow}>
            <View style={styles.statusItem}>
              <Text style={[styles.statusValue, { color: text }]}>{filledCount}/81</Text>
              <Text style={[styles.statusLabel, { color: subText }]}>Indices</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: border }]} />
            <View style={styles.statusItem}>
              <Text
                style={[
                  styles.statusValue,
                  { color: conflictCells.size > 0 ? Colors.danger : text },
                ]}
              >
                {conflictCells.size}
              </Text>
              <Text style={[styles.statusLabel, { color: subText }]}>Conflits</Text>
            </View>
            <View style={[styles.modePill, { backgroundColor: surface }]}>
              <Ionicons
                name={newGameMode === 'zen' ? 'leaf-outline' : 'construct-outline'}
                size={14}
                color={dark ? Colors.playerDigitDark : Colors.accent}
              />
              <Text style={[styles.modePillText, { color: text }]}>
                {newGameMode === 'zen' ? 'Zen' : 'Expert'}
              </Text>
            </View>
          </View>

          {visibleFeedback && (
            <View
              style={[
                styles.feedback,
                {
                  backgroundColor:
                    visibleFeedback.tone === 'error'
                      ? dark
                        ? Colors.dangerSurfaceDark
                        : Colors.dangerSurface
                      : surface,
                },
              ]}
            >
              <Ionicons
                name={
                  visibleFeedback.tone === 'error'
                    ? 'alert-circle-outline'
                    : 'information-circle-outline'
                }
                size={17}
                color={visibleFeedback.tone === 'error' ? Colors.danger : subText}
              />
              <Text
                style={[
                  styles.feedbackText,
                  {
                    color:
                      visibleFeedback.tone === 'error' ? Colors.danger : subText,
                  },
                ]}
              >
                {visibleFeedback.message}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.gridWrapper}>
          <EditableSudokuGrid
            grid={grid}
            selectedCell={selectedCell}
            conflictCells={conflictCells}
            dark={dark}
            onSelect={handleSelect}
          />
        </View>

        <View style={styles.padWrapper}>
          <CreatorNumberPad
            selectedDigit={selectedDigit}
            dark={dark}
            onDigit={handleDigit}
            onErase={handleErase}
          />
        </View>

        <Pressable
          onPress={handlePlay}
          accessibilityRole="button"
          accessibilityLabel="Jouer cette grille"
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: Colors.accent,
              opacity: pressed ? 0.78 : 1,
            },
          ]}
        >
          <Ionicons name="play-outline" size={21} color={Colors.white} />
          <Text style={styles.primaryButtonText}>Jouer cette grille</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  backBtn: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: 82,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  iconBtn: {
    minWidth: 82,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  statusTopRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  statusItem: {
    minWidth: 62,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  modePill: {
    minHeight: 36,
    marginLeft: 'auto',
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  modePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  feedback: {
    minHeight: 40,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  gridWrapper: {
    alignItems: 'center',
  },
  padWrapper: {
    width: '100%',
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
});
