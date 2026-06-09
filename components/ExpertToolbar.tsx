import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useGame } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { SPACING, BORDER_RADIUS, MIN_TOUCH_TARGET } from '@/utils/constants';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const CELL_COLORS = [
  { key: 'Jaune', color: '#FDE68A' },
  { key: 'Vert', color: '#BBF7D0' },
  { key: 'Rouge', color: '#FCA5A5' },
  { key: 'Violet', color: '#C4B5FD' },
  { key: 'Cyan', color: '#A5F3FC' },
];

export default function ExpertToolbar() {
  const {
    saveThread,
    restoreThread,
    deleteThread,
    threads,
    getHint,
    setCellColor,
    selectedCell,
    settings,
  } = useGame();

  const [showThreads, setShowThreads] = useState(false);
  const [showColors, setShowColors] = useState(false);

  const dark = settings.theme === 'dark';
  const bg = dark ? Colors.surfaceDark : Colors.surface;
  const text = dark ? Colors.textPrimaryDark : Colors.textPrimary;
  const subText = dark ? Colors.textSecondaryDark : Colors.textSecondary;

  const handleColor = (color: string) => {
    if (selectedCell) {
      setCellColor(selectedCell.row, selectedCell.col, color);
    }
    setShowColors(false);
  };

  return (
    <>
      <View style={[styles.toolbar, { backgroundColor: bg }]}>
        <ToolBtn
          label="Threads"
          icon="git-branch-outline"
          active={threads.length > 0}
          onPress={() => setShowThreads(true)}
          dark={dark}
        />

        <ToolBtn
          label="Indice"
          icon="bulb-outline"
          active={false}
          onPress={getHint}
          dark={dark}
        />

        <ToolBtn
          label="Couleur"
          icon="color-palette-outline"
          active={showColors}
          onPress={() => setShowColors((v) => !v)}
          dark={dark}
        />
      </View>

      {showColors && (
        <View style={[styles.colorPicker, { backgroundColor: bg }]}>
          {CELL_COLORS.map(({ key, color }) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={`Couleur ${key}`}
              style={[styles.colorDot, { backgroundColor: color }]}
              onPress={() => handleColor(color)}
            />
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retirer la couleur"
            style={[
              styles.colorDot,
              styles.colorClear,
              { backgroundColor: dark ? Colors.cardBackgroundDark : Colors.cardBackground },
            ]}
            onPress={() => handleColor('')}
          >
            <Ionicons name="close" size={16} color={subText} />
          </Pressable>
        </View>
      )}

      <Modal visible={showThreads} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowThreads(false)}>
          <View
            style={[
              styles.threadSheet,
              { backgroundColor: dark ? Colors.cardBackgroundDark : Colors.cardBackground },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.sheetTitleRow}>
              <Text style={[styles.threadTitle, { color: text }]}>Threads</Text>
              <Pressable
                onPress={() => setShowThreads(false)}
                accessibilityRole="button"
                accessibilityLabel="Fermer les threads"
                hitSlop={12}
              >
                <Ionicons name="close" size={22} color={subText} />
              </Pressable>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.saveBtn, { backgroundColor: Colors.accent }]}
              onPress={() => {
                saveThread();
              }}
            >
              <Ionicons name="bookmark-outline" size={18} color={Colors.white} />
              <Text style={styles.saveBtnText}>Sauvegarder cet état</Text>
            </TouchableOpacity>

            {threads.length === 0 ? (
              <Text style={[styles.emptyText, { color: subText }]}>Aucun thread sauvegardé</Text>
            ) : (
              <FlatList
                data={threads}
                keyExtractor={(_, i) => String(i)}
                renderItem={({ item, index }) => (
                  <View
                    style={[
                      styles.threadRow,
                      { borderColor: dark ? Colors.surfaceDark : Colors.border },
                    ]}
                  >
                    <Text style={[styles.threadLabel, { color: text }]}>{item.label}</Text>
                    <View style={styles.threadBtns}>
                      <TouchableOpacity
                        onPress={() => {
                          restoreThread(index);
                          setShowThreads(false);
                        }}
                        accessibilityRole="button"
                        style={[styles.threadBtn, { backgroundColor: Colors.accent }]}
                      >
                        <Text style={styles.threadBtnText}>Restaurer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deleteThread(index)}
                        accessibilityRole="button"
                        accessibilityLabel={`Supprimer ${item.label}`}
                        style={[styles.threadIconBtn, { backgroundColor: Colors.danger }]}
                      >
                        <Ionicons name="trash-outline" size={16} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function ToolBtn({
  label,
  icon,
  active,
  onPress,
  dark,
}: {
  label: string;
  icon: IconName;
  active: boolean;
  onPress: () => void;
  dark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.toolBtn,
        {
          backgroundColor: active
            ? Colors.accent
            : dark
              ? Colors.cardBackgroundDark
              : Colors.cardBackground,
          borderColor: active ? Colors.accent : dark ? Colors.borderDark : Colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? Colors.white : dark ? Colors.textSecondaryDark : Colors.textSecondary}
      />
      <Text
        style={[
          styles.toolLabel,
          { color: active ? Colors.white : dark ? Colors.textSecondaryDark : Colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
  },
  toolBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    paddingVertical: 0,
    borderRadius: BORDER_RADIUS.md,
    gap: 2,
  },
  toolLabel: { fontSize: 11, fontWeight: '800' },
  colorPicker: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    marginTop: SPACING.xs,
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  colorClear: {
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  threadSheet: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '62%',
  },
  sheetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  threadTitle: { fontSize: 20, fontWeight: '800' },
  saveBtn: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  saveBtnText: { color: Colors.white, fontWeight: '800' },
  emptyText: { textAlign: 'center', marginTop: SPACING.lg },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  threadLabel: { fontSize: 15, fontWeight: '600' },
  threadBtns: { flexDirection: 'row', gap: SPACING.sm },
  threadBtn: {
    minHeight: 36,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
  },
  threadIconBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  threadBtnText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
});
