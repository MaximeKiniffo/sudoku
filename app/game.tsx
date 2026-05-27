import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGame } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { SPACING, BORDER_RADIUS, MIN_TOUCH_TARGET } from '@/utils/constants';
import { hasConflict } from '@/utils/sudoku';
import { formatElapsedTime } from '@/utils/time';
import SudokuGrid from '@/components/SudokuGrid';
import NumberPad from '@/components/NumberPad';
import Timer from '@/components/Timer';
import ExpertToolbar from '@/components/ExpertToolbar';

export default function GameScreen() {
  const router = useRouter();
  const {
    mode,
    difficulty,
    settings,
    isSolvedFlag,
    elapsedSeconds,
    startNewGame,
    isGameStarted,
    playerGrid,
    pauseGame,
    resumeGame,
    timerActive,
    getHint,
  } = useGame();

  const dark = settings.theme === 'dark';
  const bg = dark ? Colors.backgroundDark : Colors.background;
  const text = dark ? Colors.textPrimaryDark : Colors.textPrimary;
  const subText = dark ? Colors.textSecondaryDark : Colors.textSecondary;
  const modeLabel = mode === 'zen' ? 'Zen' : 'Expert';

  useEffect(() => {
    if (isGameStarted && !isSolvedFlag) resumeGame();
  }, [isGameStarted, isSolvedFlag, resumeGame]);

  useEffect(() => {
    return () => pauseGame();
  }, [pauseGame]);

  const stats = useMemo(() => {
    let filled = 0;
    let errors = 0;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (playerGrid[row][col] !== null) {
          filled += 1;
          if (hasConflict(playerGrid, row, col)) errors += 1;
        }
      }
    }

    return {
      filled,
      errors,
      percent: Math.round((filled / 81) * 100),
    };
  }, [playerGrid]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Retour à l'accueil"
        >
          <Ionicons name="chevron-back" size={20} color={subText} />
          <Text style={[styles.backText, { color: subText }]}>Accueil</Text>
        </TouchableOpacity>

        <View style={styles.timerCluster}>
          <Timer />
          <Pressable
            onPress={timerActive ? pauseGame : resumeGame}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={timerActive ? 'Mettre le timer en pause' : 'Reprendre le timer'}
            style={[
              styles.pauseBtn,
              { backgroundColor: dark ? Colors.surfaceDark : Colors.surface },
            ]}
          >
            <Ionicons
              name={timerActive ? 'pause-outline' : 'play-outline'}
              size={18}
              color={subText}
            />
          </Pressable>
        </View>

        <View style={styles.headerRight}>
          <View
            style={[
              styles.modeBadge,
              { backgroundColor: dark ? Colors.surfaceDark : Colors.surface },
            ]}
            accessibilityRole="text"
          >
            <Ionicons
              name={mode === 'zen' ? 'leaf-outline' : 'construct-outline'}
              size={14}
              color={dark ? Colors.textPrimaryDark : Colors.textPrimary}
            />
            <Text style={[styles.modeBadgeText, { color: text }]}>Mode {modeLabel}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir les paramètres"
            style={styles.iconBtn}
          >
            <Ionicons name="settings-outline" size={22} color={subText} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.progressBlock}>
          <View style={styles.progressTextRow}>
            <Text style={[styles.progressLabel, { color: subText }]}>Progression</Text>
            <Text style={[styles.progressValue, { color: text }]}>
              {stats.filled}/81 · {stats.percent}%
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: dark ? Colors.surfaceDark : Colors.surface }]}>
            <View style={[styles.progressFill, { width: `${stats.percent}%` }]} />
          </View>
          {settings.showErrors && stats.errors > 0 && (
            <View style={styles.errorStatus}>
              <Ionicons name="alert-circle" size={15} color={Colors.danger} />
              <Text style={styles.errorStatusText}>
                {stats.errors} conflit{stats.errors > 1 ? 's' : ''} à corriger
              </Text>
            </View>
          )}
        </View>

        <View style={styles.gridWrapper}>
          <SudokuGrid />
        </View>

        {mode === 'expert' && (
          <View style={styles.expertToolbarWrapper}>
            <ExpertToolbar />
          </View>
        )}

        {mode === 'zen' && (
          <View style={styles.zenHintWrapper}>
            <TouchableOpacity
              onPress={getHint}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Indice"
              style={[
                styles.zenHintButton,
                { backgroundColor: dark ? Colors.surfaceDark : Colors.surface },
              ]}
            >
              <Ionicons name="bulb-outline" size={18} color={Colors.accent} />
              <Text style={[styles.zenHintText, { color: text }]}>Indice</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.numberPadWrapper}>
          <NumberPad />
        </View>
      </ScrollView>

      <Modal visible={isSolvedFlag} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: dark ? Colors.cardBackgroundDark : Colors.cardBackground },
            ]}
          >
            <View style={[styles.modalIconWrap, { backgroundColor: Colors.successSurface }]}>
              <Ionicons name="trophy-outline" size={42} color={Colors.success} />
            </View>
            <Text style={[styles.modalTitle, { color: text }]}>Bravo, grille terminée !</Text>
            <Text style={[styles.modalSubtitle, { color: subText }]}>
              Mode {modeLabel} · {difficulty}
            </Text>

            <View style={styles.modalStats}>
              <Stat label="Temps" value={formatElapsedTime(elapsedSeconds)} dark={dark} />
              <Stat label="Erreurs" value={String(stats.errors)} dark={dark} />
            </View>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: Colors.accent }]}
              onPress={() => {
                startNewGame();
              }}
              accessibilityRole="button"
            >
              <Text style={styles.modalBtnText}>Nouvelle partie</Text>
            </TouchableOpacity>
            <Pressable
              onPress={() => router.back()}
              style={styles.modalSecondary}
              accessibilityRole="button"
            >
              <Text style={[styles.modalSecondaryText, { color: subText }]}>
                Retour accueil
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ label, value, dark }: { label: string; value: string; dark: boolean }) {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: dark ? Colors.surfaceDark : Colors.surface },
      ]}
    >
      <Text style={[styles.statValue, { color: dark ? Colors.textPrimaryDark : Colors.textPrimary }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: dark ? Colors.textSecondaryDark : Colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  backBtn: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 15, fontWeight: '700' },
  timerCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pauseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  modeBadge: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.sm,
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  iconBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: SPACING.lg,
  },
  progressBlock: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  errorStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  errorStatusText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  gridWrapper: {
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  expertToolbarWrapper: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  zenHintWrapper: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  zenHintButton: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  zenHintText: {
    fontSize: 14,
    fontWeight: '800',
  },
  numberPadWrapper: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '86%',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  modalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: SPACING.lg,
  },
  modalStats: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
  },
  modalBtn: {
    width: '100%',
    minHeight: 52,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  modalBtnText: { color: Colors.white, fontSize: 16, fontWeight: '800' },
  modalSecondary: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  modalSecondaryText: { fontSize: 14, fontWeight: '800' },
});
