import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useGame } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { SPACING, BORDER_RADIUS, MIN_TOUCH_TARGET } from '@/utils/constants';
import ModeToggle from '@/components/ModeToggle';

export default function SettingsScreen() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const {
    settings,
    updateSettings,
    hasSavedGame,
    mode,
    newGameMode,
    isGameStarted,
    setNewGameMode,
    clearSavedGame,
  } = useGame();
  const dark = settings.theme === 'dark';
  const pageBg = dark ? Colors.backgroundDark : Colors.background;
  const bg = dark ? Colors.cardBackgroundDark : Colors.cardBackground;
  const text = dark ? Colors.textPrimaryDark : Colors.textPrimary;
  const subText = dark ? Colors.textSecondaryDark : Colors.textSecondary;
  const rowBorder = dark ? Colors.surfaceDark : Colors.border;
  const hasActiveGame = isGameStarted || hasSavedGame;

  const handleClearSavedGame = async () => {
    setShowDeleteModal(false);
    await clearSavedGame();
    router.dismissTo('/');
  };

  const confirmClearSavedGame = () => {
    if (!hasActiveGame) return;
    setShowDeleteModal(true);
  };

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={[styles.safe, { backgroundColor: pageBg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { backgroundColor: bg }]}
      >
          <SectionTitle label="Jeu" color={subText} />
          <View style={[styles.modeRow, { borderColor: rowBorder }]}>
            <View style={styles.rowLabelBlock}>
              <Text style={[styles.rowLabel, { color: text }]}>Mode de jeu</Text>
              <Text style={[styles.rowSub, { color: subText }]}>
                {hasActiveGame
                  ? `La partie à continuer reste en mode ${mode === 'zen' ? 'Zen' : 'Expert'}.`
                  : 'Zen pour les indices et assistances, Expert pour les notes et outils.'}
              </Text>
            </View>
            <View style={styles.modeToggleWrap}>
              <ModeToggle
                value={newGameMode}
                onChange={setNewGameMode}
                helperText={hasActiveGame ? 'Ce choix s’applique à la prochaine nouvelle partie' : undefined}
              />
            </View>
          </View>

          <View style={[styles.row, { borderColor: rowBorder }]}>
            <View style={styles.rowLabelBlock}>
              <Text style={[styles.rowLabel, { color: text }]}>Surligner les erreurs</Text>
              <Text style={[styles.rowSub, { color: subText }]}>Conflits visibles sur la grille</Text>
            </View>
            <Switch
              value={settings.showErrors}
              onValueChange={(v) => updateSettings({ showErrors: v })}
              trackColor={{ true: Colors.accent, false: Colors.border }}
              thumbColor={Colors.white}
              accessibilityLabel="Surligner les erreurs"
            />
          </View>

          <SectionTitle label="Affichage" color={subText} />
          <View style={[styles.row, { borderColor: rowBorder }]}>
            <Text style={[styles.rowLabel, { color: text }]}>Thème sombre</Text>
            <Switch
              value={dark}
              onValueChange={(v) => updateSettings({ theme: v ? 'dark' : 'light' })}
              trackColor={{ true: Colors.accent, false: Colors.border }}
              thumbColor={Colors.white}
              accessibilityLabel="Thème sombre"
            />
          </View>

          <SectionTitle label="Accessibilité" color={subText} />
          <View style={[styles.sliderBlock, { borderColor: rowBorder }]}>
            <View style={styles.sliderLabelRow}>
              <Text style={[styles.rowLabel, { color: text }]}>Taille des notes</Text>
              <Text style={[styles.sliderValue, { color: dark ? Colors.playerDigitDark : Colors.playerDigit }]}>
                {settings.candidateSize}px
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={7}
              maximumValue={14}
              step={1}
              value={settings.candidateSize}
              onValueChange={(v) => updateSettings({ candidateSize: Math.round(v) })}
              minimumTrackTintColor={Colors.accent}
              maximumTrackTintColor={dark ? Colors.surfaceDark : Colors.border}
              thumbTintColor={Colors.accent}
              accessibilityLabel="Taille des notes"
            />
            <View style={styles.sliderTicks}>
              <Text style={[styles.sliderTick, { color: subText }]}>A</Text>
              <Text style={[styles.sliderTickLg, { color: subText }]}>A</Text>
            </View>
          </View>

          <SectionTitle label="Données" color={subText} />
          <TouchableOpacity
            onPress={confirmClearSavedGame}
            disabled={!hasActiveGame}
            accessibilityRole="button"
            accessibilityState={{ disabled: !hasActiveGame }}
            style={[
              styles.dangerRow,
              {
                borderColor: rowBorder,
                opacity: hasActiveGame ? 1 : 0.45,
              },
            ]}
          >
            <View style={styles.dangerIcon}>
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            </View>
            <View style={styles.rowLabelBlock}>
              <Text style={[styles.rowLabel, { color: hasActiveGame ? Colors.danger : subText }]}>
                Effacer la partie sauvegardée
              </Text>
              <Text style={[styles.rowSub, { color: subText }]}>
                Supprime la progression locale actuelle.
              </Text>
            </View>
          </TouchableOpacity>
      </ScrollView>

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.deleteModalCard,
              { backgroundColor: dark ? Colors.cardBackgroundDark : Colors.cardBackground },
            ]}
          >
            <View
              style={[
                styles.deleteModalIcon,
                { backgroundColor: dark ? Colors.dangerSurfaceDark : Colors.dangerSurface },
              ]}
            >
              <Ionicons name="trash-outline" size={28} color={Colors.danger} />
            </View>
            <Text style={[styles.deleteModalTitle, { color: text }]}>
              Supprimer la partie ?
            </Text>
            <Text style={[styles.deleteModalText, { color: subText }]}>
              La progression actuelle sera supprimée de cet appareil. Cette action est définitive.
            </Text>

            <TouchableOpacity
              onPress={() => {
                void handleClearSavedGame();
              }}
              accessibilityRole="button"
              accessibilityLabel="Confirmer la suppression de la partie"
              style={[styles.deleteModalDangerBtn, { backgroundColor: Colors.danger }]}
            >
              <Text style={styles.deleteModalDangerText}>Supprimer la partie</Text>
            </TouchableOpacity>

            <Pressable
              onPress={() => setShowDeleteModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Annuler la suppression"
              style={styles.deleteModalCancelBtn}
            >
              <Text style={[styles.deleteModalCancelText, { color: subText }]}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionTitle({ label, color }: { label: string; color: string }) {
  return <Text style={[styles.sectionTitle, { color }]}>{label.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  row: {
    minHeight: 58,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.md,
  },
  modeRow: {
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  modeToggleWrap: {
    marginTop: SPACING.sm,
  },
  rowLabel: { fontSize: 16, fontWeight: '700' },
  rowLabelBlock: { flex: 1 },
  rowSub: { fontSize: 12, marginTop: 3, fontWeight: '600' },
  sliderBlock: {
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sliderValue: { fontSize: 14, fontWeight: '800' },
  slider: { marginHorizontal: -SPACING.sm },
  sliderTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  sliderTick: { fontSize: 12 },
  sliderTickLg: { fontSize: 18, fontWeight: '700' },
  dangerRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dangerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dangerSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  deleteModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  deleteModalText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  deleteModalDangerBtn: {
    width: '100%',
    minHeight: 52,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  deleteModalDangerText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  deleteModalCancelBtn: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  deleteModalCancelText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
