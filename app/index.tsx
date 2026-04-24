import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGame } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { DIFFICULTIES, SPACING, BORDER_RADIUS } from '@/utils/constants';
import DifficultyPicker from '@/components/DifficultyPicker';
import ModeToggle from '@/components/ModeToggle';

export default function HomeScreen() {
  const router = useRouter();
  const { mode, difficulty, setDifficulty, startNewGame, settings } = useGame();
  const dark = settings.theme === 'dark';
  const bg = dark ? Colors.backgroundDark : Colors.background;
  const text = dark ? Colors.white : Colors.accent;

  const handlePlay = () => {
    startNewGame();
    router.push('/game');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <View style={styles.headerRight}>
          <ModeToggle />
          <Pressable
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
            hitSlop={12}
          >
            <Text style={[styles.settingsIcon, { color: Colors.secondary }]}>⚙</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: text }]}>Sudoku</Text>
          <Text style={[styles.subtitle, { color: Colors.secondary }]}>
            {mode === 'zen' ? 'Mode Zen' : 'Mode Expert'}
          </Text>
        </View>

        <DifficultyPicker
          difficulties={[...DIFFICULTIES]}
          selected={difficulty}
          onSelect={setDifficulty}
          dark={dark}
        />

        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: Colors.accent }]}
          onPress={handlePlay}
          activeOpacity={0.85}
        >
          <Text style={styles.playButtonText}>Jouer</Text>
        </TouchableOpacity>
      </View>
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
  headerLeft: { flex: 1 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  settingsBtn: { padding: SPACING.xs },
  settingsIcon: { fontSize: 22 },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xl,
  },
  titleContainer: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  playButton: {
    width: '80%',
    paddingVertical: SPACING.md + 4,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  playButtonText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
