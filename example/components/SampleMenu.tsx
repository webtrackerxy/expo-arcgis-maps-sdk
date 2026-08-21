/**
 * The "⋯" popover menu shown from a sample's top bar — View Info, external
 * links, and Favorite — mirroring the official ArcGIS Maps SDK Samples app.
 */
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type SampleMenuProps = {
  visible: boolean;
  onClose: () => void;
  onViewInfo: () => void;
  onViewEsri: () => void;
  onViewGitHub: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
};

/** One menu row: a leading glyph + label. */
function MenuRow({ glyph, label, onPress }: { glyph: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <Text style={styles.glyph}>{glyph}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

export function SampleMenu({
  visible,
  onClose,
  onViewInfo,
  onViewEsri,
  onViewGitHub,
  onToggleFavorite,
  isFavorite,
}: SampleMenuProps) {
  const run = (action: () => void) => () => {
    onClose();
    action();
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Tap outside to dismiss. */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.menu}>
          <MenuRow glyph="ⓘ" label="View Info" onPress={run(onViewInfo)} />
          <MenuRow glyph="🔗" label="View on Esri Developer" onPress={run(onViewEsri)} />
          <MenuRow glyph="🔗" label="View on GitHub" onPress={run(onViewGitHub)} />
          <View style={styles.divider} />
          <MenuRow
            glyph={isFavorite ? '★' : '☆'}
            label={isFavorite ? 'Unfavorite' : 'Favorite'}
            onPress={run(onToggleFavorite)}
          />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  menu: {
    position: 'absolute',
    top: 56,
    right: 12,
    minWidth: 230,
    backgroundColor: 'rgba(250,250,252,0.98)',
    borderRadius: 14,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowPressed: { backgroundColor: 'rgba(0,0,0,0.06)' },
  glyph: { fontSize: 17, width: 22, textAlign: 'center', color: '#1c1c1e' },
  label: { fontSize: 16, color: '#1c1c1e' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#d1d1d6', marginVertical: 4 },
});
