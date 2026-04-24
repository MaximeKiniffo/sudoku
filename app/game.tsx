import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGame } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { SPACING, BORDER_RADIUS } from '@/utils/constants';
import SudokuGrid from '@/components/SudokuGrid';
import NumberPad from '@/components/NumberPad';
import Timer from '@/components/Timer';
import ExpertToolbar from '@/components/ExpertToolbar';
import ModeToggle from '@/components/ModeToggle';

export default function GameScreen() {
  const router = useRouter();
  const {
    mode,
    settings,
    isSolvedFlag,
    elapsedSeconds,
    eraseCell,
    startNewGame,
    isGameStarted,
  } = useGame();

  const dark = settings.theme === 'dark';
  const bg = dark ? Colors.backgroundDark : Colors.background;
  const text = dark ? Colors.white : Colors.accent;

  // If someone navigates here without starting a game
  useEffect(() => {
    if (!isGameStarted) {
      startNewGame();
    }
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Text style={[styles.backText, { color: Colors.secondary }]}>‹ Accueil</Text>
        </TouchableOpacity>

        <Timer />

        <View style={styles.headerRight}>
          <ModeToggle compact />
          <TouchableOpacity onPress={() => router.push('/settings')} hitSlop={12}>
            <Text style={{ color: Colors.secondary, fontSize: 20 }}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid */}
      <View style={styles.gridWrapper}>
        <SudokuGrid />
      </View>

      {/* Expert toolbar (above number pad, mode=expert) */}
      {mode === 'expert' && (
        <View style={styles.expertToolbarWrapper}>
          <ExpertToolbar />
        </View>
      )}

      {/* Number pad */}
      <View style={styles.numberPadWrapper}>
        <View style={styles.eraseRow}>
          <TouchableOpacity onPress={eraseCell} style={styles.eraseBtn}>
            <Text style={[styles.eraseText, { color: Colors.secondary }]}>⌫</Text>
          </TouchableOpacity>
        </View>
        <NumberPad />
      </View>

      {/* Win modal */}
      <Modal visible={isSolvedFlag} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: dark ? Colors.cardBackgroundDark : Colors.cardBackground }]}>
            <Text style={[styles.modalEmoji]}>🎉</Text>
            <Text style={[styles.modalTitle, { color: text }]}>Bravo !</Text>
            <Text style={[styles.modalTime, { color: Colors.secondary }]}>
              Temps : {formatTime(elapsedSeconds)}
            </Text>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: Colors.accent }]}
              onPress={() => { startNewGame(); }}
            >
              <Text style={styles.modalBtnText}>Nouvelle partie</Text>
            </TouchableOpacity>
            <Pressable onPress={() => router.back()} style={styles.modalSecondary}>
              <Text style={[styles.modalSecondaryText, { color: Colors.secondary }]}>Retour à l'accueil</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  },
  backBtn: { paddingVertical: SPACING.xs },
  backText: { fontSize: 16 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  gridWrapper: {
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  expertToolbarWrapper: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  numberPadWrapper: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  eraseRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: SPACING.xs,
    paddingRight: SPACING.xs,
  },
  eraseBtn: { padding: SPACING.xs },
  eraseText: { fontSize: 24 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '78%',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  modalEmoji: { fontSize: 48, marginBottom: SPACING.sm },
  modalTitle: { fontSize: 28, fontWeight: '700', marginBottom: SPACING.xs },
  modalTime: { fontSize: 16, marginBottom: SPACING.lg },
  modalBtn: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  modalSecondary: { padding: SPACING.sm },
  modalSecondaryText: { fontSize: 14 },
});
