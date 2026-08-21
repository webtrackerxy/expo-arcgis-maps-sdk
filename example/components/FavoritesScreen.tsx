/**
 * The Favorites list — the samples the user starred (from a sample's ⋯ menu),
 * in a user-controlled order. Each row opens the sample; the ▲ / ▼ controls
 * reorder it and ★ removes it.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SCREENS, type ScreenKey } from './screens';
import { SCREEN_DESCRIPTIONS } from './screens/descriptions';

type FavoritesScreenProps = {
  favorites: ScreenKey[];
  onBack: () => void;
  onSelectScreen: (key: ScreenKey) => void;
  onMove: (key: ScreenKey, direction: -1 | 1) => void;
  onUnfavorite: (key: ScreenKey) => void;
};

export function FavoritesScreen({
  favorites,
  onBack,
  onSelectScreen,
  onMove,
  onUnfavorite,
}: FavoritesScreenProps) {
  const titleFor = (key: ScreenKey) => SCREENS.find((s) => s.key === key)?.title ?? key;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityLabel="Back to categories"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Favorites</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {favorites.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No favorites yet. Open a sample, tap ⋯, then “Favorite”.
            </Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {favorites.map((key, index) => (
              <Pressable
                key={key}
                onPress={() => onSelectScreen(key)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.row,
                  index < favorites.length - 1 && styles.rowDivider,
                  pressed && styles.rowPressed,
                ]}>
                <View style={styles.rowMain}>
                  <Text style={styles.rowText}>{titleFor(key)}</Text>
                  {SCREEN_DESCRIPTIONS[key] ? (
                    <Text style={styles.rowSubtitle} numberOfLines={2}>
                      {SCREEN_DESCRIPTIONS[key]}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.rowRight}>
                  <Pressable
                    hitSlop={8}
                    disabled={index === 0}
                    onPress={() => onMove(key, -1)}
                    accessibilityLabel={`Move ${titleFor(key)} up`}
                    style={({ pressed }) => [styles.arrowBtn, pressed && styles.pressed]}>
                    <Text style={[styles.arrow, index === 0 && styles.arrowDisabled]}>▲</Text>
                  </Pressable>
                  <Pressable
                    hitSlop={8}
                    disabled={index === favorites.length - 1}
                    onPress={() => onMove(key, 1)}
                    accessibilityLabel={`Move ${titleFor(key)} down`}
                    style={({ pressed }) => [styles.arrowBtn, pressed && styles.pressed]}>
                    <Text
                      style={[styles.arrow, index === favorites.length - 1 && styles.arrowDisabled]}>
                      ▼
                    </Text>
                  </Pressable>
                  <Pressable
                    hitSlop={8}
                    onPress={() => onUnfavorite(key)}
                    accessibilityLabel={`Remove ${titleFor(key)} from favorites`}
                    style={({ pressed }) => [styles.starBtn, pressed && styles.pressed]}>
                    <Text style={styles.star}>★</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f2f7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  backChevron: { fontSize: 26, lineHeight: 28, color: '#3c3c43', marginTop: -2 },
  pressed: { opacity: 0.5 },
  title: { flex: 1, fontSize: 28, fontWeight: '800', color: '#111827' },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  listCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#d1d1d6' },
  rowPressed: { backgroundColor: '#f0f0f5' },
  rowMain: { flex: 1, paddingRight: 12, gap: 3 },
  rowText: { fontSize: 17, color: '#111827' },
  rowSubtitle: { fontSize: 13, lineHeight: 18, color: '#6b7280' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  arrowBtn: { padding: 2 },
  arrow: { fontSize: 15, color: '#7c3aed' },
  arrowDisabled: { color: '#c7c7cc' },
  starBtn: { padding: 2 },
  star: { fontSize: 18, color: '#f5a623' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#6b7280', textAlign: 'center' },
});
