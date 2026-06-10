import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGame } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { SPACING, BORDER_RADIUS, MIN_TOUCH_TARGET } from '@/utils/constants';
import DifficultyPicker from '@/components/DifficultyPicker';
import ModeToggle from '@/components/ModeToggle';

export default function HomeScreen() {
  const router = useRouter();
  const {
    mode,
    newGameMode,
    difficulty,
    setDifficulty,
    setNewGameMode,
    startNewGame,
    settings,
    hasSavedGame,
    isGameStarted,
    isHydrated,
    loadSavedGame,
  } = useGame();
  const dark = settings.theme === 'dark';
  const bg = dark ? Colors.backgroundDark : Colors.background;
  const text = dark ? Colors.textPrimaryDark : Colors.textPrimary;
  const subText = dark ? Colors.textSecondaryDark : Colors.textSecondary;
  const surface = dark ? Colors.surfaceDark : Colors.surface;
  const card = dark ? Colors.cardBackgroundDark : Colors.cardBackground;
  const border = dark ? Colors.borderDark : Colors.border;
  const hasActiveGame = isGameStarted || hasSavedGame;

  const handleNewGame = () => {
    if (!isHydrated) return;
    startNewGame();
    router.push('/game');
  };

  const handleCreateCustom = () => {
    if (!isHydrated) return;
    router.push('/create');
  };

  const handleContinue = async () => {
    const ready = isGameStarted || (await loadSavedGame());
    if (!ready) return;
    router.push('/game');
  };

  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={[styles.safe, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <View style={[styles.appMark, { backgroundColor: Colors.accentSoft }]}>
          <Ionicons
            name="grid-outline"
            size={20}
            color={dark ? Colors.playerDigitDark : Colors.accent}
          />
        </View>
        <Pressable
          style={[
            styles.settingsBtn,
            { backgroundColor: surface, borderColor: border },
          ]}
          onPress={() => router.push('/settings')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Ouvrir les paramètres"
        >
          <Ionicons name="settings-outline" size={24} color={subText} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.bodyScroll}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <View style={[styles.kicker, { backgroundColor: surface }]}>
            <Ionicons
              name="sparkles-outline"
              size={14}
              color={dark ? Colors.playerDigitDark : Colors.accent}
            />
            <Text style={[styles.kickerText, { color: subText }]}>À toi de jouer</Text>
          </View>
          <Text style={[styles.title, { color: text }]}>Sudoku</Text>
          <Text style={[styles.subtitle, { color: subText }]}>
            Nouvelle partie : {newGameMode === 'zen' ? 'Mode Zen' : 'Mode Expert'}
          </Text>
        </View>

        <View style={styles.modeBlock}>
          <Text style={[styles.blockLabel, { color: subText }]}>Mode de jeu</Text>
          <ModeToggle
            showDescription
            value={newGameMode}
            onChange={setNewGameMode}
            helperText={hasActiveGame ? `La partie à continuer reste en mode ${mode === 'zen' ? 'Zen' : 'Expert'}` : undefined}
          />
        </View>

        <View style={styles.difficultyBlock}>
          <Text style={[styles.blockLabel, { color: subText }]}>Difficulté</Text>
          <DifficultyPicker
            difficulties={['Facile', 'Moyen', 'Difficile', 'Expert']}
            selected={difficulty}
            onSelect={setDifficulty}
            dark={dark}
          />
          <Text style={[styles.modeHint, { color: subText }]}>
            Zen : indices et assistances. Expert : notes, threads, couleurs.
          </Text>
        </View>

        <View style={styles.actions}>
          {hasSavedGame && (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: isHydrated ? Colors.accent : Colors.border },
              ]}
              onPress={handleContinue}
              activeOpacity={0.85}
              disabled={!isHydrated}
              accessibilityRole="button"
            >
              <Ionicons name="play-skip-forward-outline" size={20} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Continuer</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              hasSavedGame ? styles.secondaryButton : styles.primaryButton,
              hasSavedGame
                ? {
                    borderColor: border,
                    backgroundColor: card,
                  }
                : { backgroundColor: Colors.accent },
              !isHydrated && { opacity: 0.55 },
            ]}
            onPress={handleNewGame}
            activeOpacity={0.85}
            disabled={!isHydrated}
            accessibilityRole="button"
            accessibilityState={{ disabled: !isHydrated }}
          >
            <Ionicons
              name={hasSavedGame ? 'add-circle-outline' : 'play-outline'}
              size={20}
              color={hasSavedGame ? text : Colors.white}
            />
            <Text
              style={[
                hasSavedGame ? styles.secondaryButtonText : styles.primaryButtonText,
                hasSavedGame && { color: text },
              ]}
            >
              Nouvelle partie
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.createButton,
              {
                borderColor: border,
                backgroundColor: card,
                opacity: isHydrated ? 1 : 0.55,
              },
            ]}
            onPress={handleCreateCustom}
            activeOpacity={0.85}
            disabled={!isHydrated}
            accessibilityRole="button"
            accessibilityState={{ disabled: !isHydrated }}
            accessibilityLabel="Créer un sudoku"
          >
            <Ionicons
              name="grid-outline"
              size={19}
              color={dark ? Colors.textPrimaryDark : Colors.textPrimary}
            />
            <Text style={[styles.createButtonText, { color: text }]}>
              Créer un sudoku
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  settingsBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appMark: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: {
    flex: 1,
  },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.xl,
  },
  titleContainer: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  kicker: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
  },
  kickerText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
  },
  modeBlock: {
    width: '100%',
    gap: SPACING.sm,
  },
  difficultyBlock: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  modeHint: {
    maxWidth: 320,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'center',
  },
  blockLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    alignSelf: 'center',
  },
  actions: {
    width: '100%',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    minHeight: 54,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  createButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
