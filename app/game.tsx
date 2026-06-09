import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    mistakeCount,
    hintCount,
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
  const card = dark ? Colors.cardBackgroundDark : Colors.cardBackground;
  const border = dark ? Colors.borderDark : Colors.border;
  const modeLabel = mode === 'zen' ? 'Zen' : 'Expert';
  const isPaused = isGameStarted && !isSolvedFlag && !timerActive;
  const pauseAccent = dark ? Colors.playerDigitDark : Colors.accent;
  const formattedElapsed = formatElapsedTime(elapsedSeconds);
  const celebrationScale = useRef(new Animated.Value(1)).current;
  const mistakePulse = useRef(new Animated.Value(1)).current;
  const previousMistakeCount = useRef(mistakeCount);

  useEffect(() => {
    if (isGameStarted && !isSolvedFlag) resumeGame();
  }, [isGameStarted, isSolvedFlag, resumeGame]);

  useEffect(() => {
    return () => pauseGame();
  }, [pauseGame]);

  useEffect(() => {
    if (!isSolvedFlag) {
      celebrationScale.stopAnimation();
      celebrationScale.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(celebrationScale, {
          toValue: 1.18,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationScale, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [celebrationScale, isSolvedFlag]);

  useEffect(() => {
    if (mistakeCount <= previousMistakeCount.current) {
      previousMistakeCount.current = mistakeCount;
      return;
    }

    mistakePulse.stopAnimation();
    mistakePulse.setValue(1);
    Animated.sequence([
      Animated.timing(mistakePulse, {
        toValue: 1.08,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(mistakePulse, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
    previousMistakeCount.current = mistakeCount;
  }, [mistakeCount, mistakePulse]);

  const handleShareScore = useCallback(() => {
    void Share.share({
      message: [
        `J’ai terminé un Sudoku en mode ${modeLabel}, difficulté ${difficulty}.`,
        `Temps : ${formattedElapsed}`,
        `Erreurs : ${mistakeCount}`,
        `Indices utilisés : ${hintCount}`,
      ].join('\n'),
    }).catch(() => undefined);
  }, [difficulty, formattedElapsed, hintCount, mistakeCount, modeLabel]);

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
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={[styles.safe, { backgroundColor: bg }]}>
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
          <View
            style={[
              styles.timerPill,
              {
                backgroundColor: dark ? Colors.surfaceDark : Colors.surface,
                borderColor: isPaused ? pauseAccent : 'transparent',
              },
            ]}
            accessibilityRole="text"
          >
            <Timer />
            {isPaused && (
              <Text style={[styles.pauseStatus, { color: pauseAccent }]}>
                En pause
              </Text>
            )}
          </View>
          <Pressable
            onPress={timerActive ? pauseGame : resumeGame}
            accessibilityRole="button"
            accessibilityLabel={
              timerActive ? 'Mettre la partie en pause' : 'Reprendre la partie'
            }
            style={[
              styles.pauseBtn,
              {
                backgroundColor: timerActive
                  ? Colors.accent
                  : dark
                    ? Colors.surfaceDark
                    : Colors.surface,
                borderColor: timerActive ? Colors.accent : pauseAccent,
              },
            ]}
          >
            <Ionicons
              name={timerActive ? 'pause' : 'play'}
              size={20}
              color={timerActive ? Colors.white : pauseAccent}
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
        contentContainerStyle={[styles.content, mode === 'expert' && styles.expertContent]}
      >
        <View
          style={[
            styles.progressBlock,
            mode === 'expert' && styles.expertProgressBlock,
            { backgroundColor: card, borderColor: border },
          ]}
        >
          <View style={styles.progressTextRow}>
            <Text style={[styles.progressLabel, { color: subText }]}>Progression</Text>
            <Text style={[styles.progressValue, { color: text }]}>
              {stats.filled}/81 · {stats.percent}%
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: dark ? Colors.surfaceDark : Colors.surface }]}>
            <View style={[styles.progressFill, { width: `${stats.percent}%` }]} />
          </View>
          <View style={styles.statusRow}>
            <Animated.View
              style={[
                styles.mistakeBadge,
                {
                  backgroundColor:
                    mistakeCount > 0
                      ? dark
                        ? Colors.dangerSurfaceDark
                        : Colors.dangerSurface
                      : dark
                        ? Colors.surfaceDark
                        : Colors.surface,
                  transform: [{ scale: mistakePulse }],
                },
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={15}
                color={mistakeCount > 0 ? Colors.danger : subText}
              />
              <Text
                style={[
                  styles.mistakeBadgeText,
                  { color: mistakeCount > 0 ? Colors.danger : subText },
                ]}
              >
                Erreurs {mistakeCount}
              </Text>
            </Animated.View>
            {settings.showErrors && stats.errors > 0 && (
              <View style={styles.errorStatus}>
                <Ionicons name="alert-circle" size={15} color={Colors.danger} />
                <Text style={styles.errorStatusText}>
                  {stats.errors} conflit{stats.errors > 1 ? 's' : ''} à corriger
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.gridWrapper, mode === 'expert' && styles.expertGridWrapper]}>
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

        <View style={[styles.numberPadWrapper, mode === 'expert' && styles.expertNumberPadWrapper]}>
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
            <Animated.View
              style={[
                styles.modalIconWrap,
                {
                  backgroundColor: Colors.successSurface,
                  transform: [{ scale: celebrationScale }],
                },
              ]}
            >
              <Ionicons name="trophy-outline" size={40} color={Colors.success} />
            </Animated.View>
            <Text style={[styles.modalTitle, { color: text }]}>Bravo, grille terminée !</Text>
            <Text style={[styles.modalSubtitle, { color: subText }]}>
              Mode {modeLabel} · {difficulty}
            </Text>

            <View style={styles.modalStats}>
              <Stat
                icon="speedometer-outline"
                label="Difficulté"
                value={difficulty}
                dark={dark}
              />
              <Stat icon="time-outline" label="Temps" value={formattedElapsed} dark={dark} />
              <Stat
                icon="alert-circle-outline"
                label="Erreurs"
                value={String(mistakeCount)}
                dark={dark}
              />
              <Stat
                icon="bulb-outline"
                label="Indices"
                value={String(hintCount)}
                dark={dark}
              />
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
            <TouchableOpacity
              style={[
                styles.modalShareBtn,
                { borderColor: dark ? Colors.borderDark : Colors.border },
              ]}
              onPress={handleShareScore}
              accessibilityRole="button"
              accessibilityLabel="Partager mon score"
            >
              <Ionicons
                name="share-social-outline"
                size={18}
                color={dark ? Colors.textPrimaryDark : Colors.textPrimary}
              />
              <Text style={[styles.modalShareText, { color: text }]}>
                Partager mon score
              </Text>
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

function Stat({
  icon,
  label,
  value,
  dark,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  dark: boolean;
}) {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: dark ? Colors.surfaceDark : Colors.surface },
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={dark ? Colors.playerDigitDark : Colors.accent}
      />
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
  timerPill: {
    minWidth: 76,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  pauseStatus: {
    marginTop: -1,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  pauseBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
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
  expertContent: {
    paddingBottom: SPACING.sm,
  },
  progressBlock: {
    marginHorizontal: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  expertProgressBlock: {
    marginBottom: SPACING.xs,
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  mistakeBadge: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
  },
  mistakeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
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
  expertGridWrapper: {
    marginVertical: SPACING.xs,
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
  expertNumberPadWrapper: {
    paddingBottom: SPACING.sm,
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
    flexWrap: 'wrap',
    width: '100%',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 92,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
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
  modalShareBtn: {
    width: '100%',
    minHeight: 50,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  modalShareText: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalSecondary: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  modalSecondaryText: { fontSize: 14, fontWeight: '800' },
});
