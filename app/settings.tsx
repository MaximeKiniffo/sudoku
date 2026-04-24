import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useGame } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { SPACING, BORDER_RADIUS } from '@/utils/constants';
import ModeToggle from '@/components/ModeToggle';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useGame();
  const dark = settings.theme === 'dark';
  const bg = dark ? Colors.cardBackgroundDark : Colors.cardBackground;
  const text = dark ? Colors.white : Colors.accent;
  const subText = Colors.secondary;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: dark ? Colors.backgroundDark : Colors.background }]}>
      <View style={[styles.sheet, { backgroundColor: bg }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: text }]}>Réglages</Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Text style={[styles.closeBtn, { color: Colors.secondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Mode */}
          <SectionTitle label="Mode de jeu" dark={dark} />
          <View style={[styles.row, { borderColor: dark ? Colors.surfaceDark : Colors.border }]}>
            <Text style={[styles.rowLabel, { color: text }]}>Mode Zen / Expert</Text>
            <ModeToggle />
          </View>

          {/* Theme */}
          <SectionTitle label="Apparence" dark={dark} />
          <View style={[styles.row, { borderColor: dark ? Colors.surfaceDark : Colors.border }]}>
            <Text style={[styles.rowLabel, { color: text }]}>Thème sombre</Text>
            <Switch
              value={dark}
              onValueChange={(v) => updateSettings({ theme: v ? 'dark' : 'light' })}
              trackColor={{ true: Colors.accent, false: Colors.border }}
              thumbColor={Colors.white}
            />
          </View>

          {/* Errors */}
          <SectionTitle label="Gameplay" dark={dark} />
          <View style={[styles.row, { borderColor: dark ? Colors.surfaceDark : Colors.border }]}>
            <View style={styles.rowLabelBlock}>
              <Text style={[styles.rowLabel, { color: text }]}>Surligner les erreurs</Text>
              <Text style={[styles.rowSub, { color: subText }]}>Doublons en rouge</Text>
            </View>
            <Switch
              value={settings.showErrors}
              onValueChange={(v) => updateSettings({ showErrors: v })}
              trackColor={{ true: Colors.accent, false: Colors.border }}
              thumbColor={Colors.white}
            />
          </View>

          {/* Candidate size */}
          <SectionTitle label="Accessibilité" dark={dark} />
          <View style={[styles.sliderBlock, { borderColor: dark ? Colors.surfaceDark : Colors.border }]}>
            <View style={styles.sliderLabelRow}>
              <Text style={[styles.rowLabel, { color: text }]}>Taille des candidats</Text>
              <Text style={[styles.sliderValue, { color: Colors.playerDigit }]}>
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
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.accent}
            />
            <View style={styles.sliderTicks}>
              <Text style={[styles.sliderTick, { color: subText }]}>A</Text>
              <Text style={[styles.sliderTickLg, { color: subText }]}>A</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({ label, dark }: { label: string; dark: boolean }) {
  return (
    <Text style={[styles.sectionTitle, { color: dark ? Colors.secondary : Colors.secondary }]}>
      {label.toUpperCase()}
    </Text>
  );
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
  title: { fontSize: 22, fontWeight: '700' },
  closeBtn: { fontSize: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: 16, fontWeight: '500' },
  rowLabelBlock: { flex: 1 },
  rowSub: { fontSize: 12, marginTop: 2 },
  sliderBlock: {
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sliderValue: { fontSize: 14, fontWeight: '600' },
  slider: { marginHorizontal: -SPACING.sm },
  sliderTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  sliderTick: { fontSize: 12 },
  sliderTickLg: { fontSize: 18, fontWeight: '600' },
});
