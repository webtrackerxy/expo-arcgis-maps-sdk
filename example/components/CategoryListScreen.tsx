import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { CategoryEntry, ScreenEntry, ScreenKey } from './screens';
import { SCREEN_DESCRIPTIONS } from './screens/descriptions';

type CategoryListScreenProps = {
  category: CategoryEntry;
  screens: ScreenEntry[];
  onSelectScreen: (key: ScreenKey) => void;
  onBack: () => void;
};

/**
 * The samples within a category — an inset-grouped list mirroring the Swift
 * app's per-category `List` of `SampleLink` rows (title, info button, chevron).
 * Categories we haven't implemented yet show an empty state.
 */
export function CategoryListScreen({
  category,
  screens,
  onSelectScreen,
  onBack,
}: CategoryListScreenProps) {
  // Rows show their description by default; the ⓘ button collapses/expands it,
  // mirroring the official app (filled ⓘ = description shown).
  const [collapsed, setCollapsed] = useState<Set<ScreenKey>>(new Set());
  const toggle = (key: ScreenKey) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

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
        <Text style={styles.title} numberOfLines={1}>
          {category.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {screens.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No samples in this category yet.</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {screens.map((screen, index) => {
              const description = SCREEN_DESCRIPTIONS[screen.key];
              const showDescription = !!description && !collapsed.has(screen.key);
              return (
                <Pressable
                  key={screen.key}
                  onPress={() => onSelectScreen(screen.key)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.row,
                    index < screens.length - 1 && styles.rowDivider,
                    pressed && styles.rowPressed,
                  ]}>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowText}>{screen.title}</Text>
                    {showDescription ? (
                      <Text style={styles.rowSubtitle}>{description}</Text>
                    ) : null}
                  </View>
                  <View style={styles.rowRight}>
                    {description ? (
                      <Pressable
                        hitSlop={10}
                        accessibilityLabel={
                          showDescription
                            ? `Hide description for ${screen.title}`
                            : `Show description for ${screen.title}`
                        }
                        onPress={() => toggle(screen.key)}
                        style={({ pressed }) => [
                          styles.infoCircle,
                          showDescription && styles.infoCircleFilled,
                          pressed && styles.pressed,
                        ]}>
                        <Text style={[styles.infoI, showDescription && styles.infoIFilled]}>i</Text>
                      </Pressable>
                    ) : null}
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </Pressable>
              );
            })}
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
  pressed: { opacity: 0.6 },
  title: { flex: 1, fontSize: 28, fontWeight: '800', color: '#111827' },
  scroll: { paddingHorizontal: 16, paddingBottom: 220 },
  listCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#d1d1d6' },
  rowPressed: { backgroundColor: '#f0f0f5' },
  rowMain: { flex: 1, paddingRight: 12, gap: 3 },
  rowText: { fontSize: 17, color: '#111827' },
  rowSubtitle: { fontSize: 13, lineHeight: 18, color: '#6b7280' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCircleFilled: { backgroundColor: '#7c3aed' },
  infoI: { fontSize: 14, fontWeight: '700', fontStyle: 'italic', color: '#7c3aed' },
  infoIFilled: { color: '#fff' },
  chevron: { fontSize: 22, color: '#c7c7cc' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: { fontSize: 15, color: '#6b7280', textAlign: 'center' },
});
