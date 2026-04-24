import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList, TouchableOpacity } from 'react-native';
import { useGame } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';
import { SPACING, BORDER_RADIUS } from '@/utils/constants';

const CELL_COLORS = [
  { key: 'yellow', color: '#FFE082' },
  { key: 'green', color: '#A5D6A7' },
  { key: 'red', color: '#EF9A9A' },
  { key: 'purple', color: '#CE93D8' },
  { key: 'cyan', color: '#80DEEA' },
];

export default function ExpertToolbar() {
  const {
    inputMode,
    setInputMode,
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
  const text = dark ? Colors.white : Colors.accent;

  const handleColor = (color: string) => {
    if (selectedCell) {
      setCellColor(selectedCell.row, selectedCell.col, color);
    }
    setShowColors(false);
  };

  return (
    <>
      <View style={[styles.toolbar, { backgroundColor: bg }]}>
        {/* Notes toggle */}
        <ToolBtn
          label="Notes"
          icon="✏️"
          active={inputMode === 'candidate'}
          onPress={() => setInputMode(inputMode === 'candidate' ? 'digit' : 'candidate')}
          dark={dark}
        />

        {/* Thread */}
        <ToolBtn
          label="Thread"
          icon="📌"
          active={threads.length > 0}
          onPress={() => setShowThreads(true)}
          dark={dark}
        />

        {/* Hint */}
        <ToolBtn
          label="Indice"
          icon="💡"
          active={false}
          onPress={getHint}
          dark={dark}
        />

        {/* Color */}
        <ToolBtn
          label="Couleur"
          icon="🎨"
          active={showColors}
          onPress={() => setShowColors((v) => !v)}
          dark={dark}
        />
      </View>

      {/* Color picker inline */}
      {showColors && (
        <View style={[styles.colorPicker, { backgroundColor: bg }]}>
          {CELL_COLORS.map(({ key, color }) => (
            <Pressable
              key={key}
              style={[styles.colorDot, { backgroundColor: color }]}
              onPress={() => handleColor(color)}
            />
          ))}
          <Pressable
            style={[styles.colorDot, styles.colorClear]}
            onPress={() => handleColor('')}
          >
            <Text style={styles.colorClearText}>✕</Text>
          </Pressable>
        </View>
      )}

      {/* Thread modal */}
      <Modal visible={showThreads} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowThreads(false)}>
          <View style={[styles.threadSheet, { backgroundColor: dark ? Colors.cardBackgroundDark : Colors.cardBackground }]}>
            <Text style={[styles.threadTitle, { color: text }]}>Threads</Text>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: Colors.accent }]}
              onPress={() => { saveThread(); }}
            >
              <Text style={styles.saveBtnText}>+ Sauvegarder l'état actuel</Text>
            </TouchableOpacity>

            {threads.length === 0 ? (
              <Text style={[styles.emptyText, { color: Colors.secondary }]}>Aucun thread sauvegardé</Text>
            ) : (
              <FlatList
                data={threads}
                keyExtractor={(_, i) => String(i)}
                renderItem={({ item, index }) => (
                  <View style={[styles.threadRow, { borderColor: dark ? Colors.surfaceDark : Colors.border }]}>
                    <Text style={[styles.threadLabel, { color: text }]}>{item.label}</Text>
                    <View style={styles.threadBtns}>
                      <TouchableOpacity
                        onPress={() => { restoreThread(index); setShowThreads(false); }}
                        style={[styles.threadBtn, { backgroundColor: Colors.accent }]}
                      >
                        <Text style={styles.threadBtnText}>Restaurer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deleteThread(index)}
                        style={[styles.threadBtn, { backgroundColor: Colors.errorText }]}
                      >
                        <Text style={styles.threadBtnText}>✕</Text>
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
  icon: string;
  active: boolean;
  onPress: () => void;
  dark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolBtn,
        {
          backgroundColor: active
            ? Colors.accent
            : dark
            ? Colors.cardBackgroundDark
            : Colors.cardBackground,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text style={styles.toolIcon}>{icon}</Text>
      <Text style={[styles.toolLabel, { color: active ? Colors.white : Colors.secondary }]}>
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
    padding: SPACING.sm,
  },
  toolBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: 2,
  },
  toolIcon: { fontSize: 18 },
  toolLabel: { fontSize: 10, fontWeight: '600' },
  colorPicker: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    marginTop: SPACING.xs,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorClear: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorClearText: { fontSize: 14, color: Colors.secondary },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  threadSheet: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '60%',
  },
  threadTitle: { fontSize: 18, fontWeight: '700', marginBottom: SPACING.md },
  saveBtn: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  saveBtnText: { color: Colors.white, fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: SPACING.lg },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  threadLabel: { fontSize: 15, fontWeight: '500' },
  threadBtns: { flexDirection: 'row', gap: SPACING.sm },
  threadBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  threadBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
});
