import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useGame } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { SPACING, BORDER_RADIUS, MIN_TOUCH_TARGET } from '@/utils/constants';
import ModeToggle from '@/components/ModeToggle';

export default function SettingsScreen() {
  const router = useRouter();
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
  const bg = dark ? Colors.cardBackgroundDark : Colors.cardBackground;
  const text = dark ? Colors.textPrimaryDark : Colors.textPrimary;
  const subText = dark ? Colors.textSecondaryDark : Colors.textSecondary;
  const rowBorder = dark ? Colors.surfaceDark : Colors.border;
  const hasActiveGame = isGameStarted || hasSavedGame;

  const handleClearSavedGame = async () => {
    await clearSavedGame();
    router.dismissTo('/');
  };

  const confirmClearSavedGame = () => {
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' &&
        window.confirm('La partie en cours sera supprimée de cet appareil.');

      if (confirmed) {
        void handleClearSavedGame();
      }

      return;
    }

    Alert.alert(
      'Effacer la partie sauvegardée',
      'La partie en cours sera supprimée de cet appareil.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: () => {
            void handleClearSavedGame();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: dark ? Colors.backgroundDark : Colors.background }]}>
      <View style={[styles.sheet, { backgroundColor: bg }]}>
        <View style={styles.handle} />

        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: text }]}>Réglages</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Fermer les réglages"
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={24} color={subText} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
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
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({ label, color }: { label: string; color: string }) {
  return <Text style={[styles.sectionTitle, { color }]}>{label.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  sheet: {
    flex: 1,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: { fontSize: 24, fontWeight: '800' },
  closeBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
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
});
