import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CATEGORY_ART } from './categoryAssets';
import { CATEGORIES, type CategoryKey } from './screens';

type CategoriesScreenProps = {
  /** Optional configuration warning (e.g. missing API key). */
  warning?: string | null;
  onSelectCategory: (key: CategoryKey) => void;
  onInfo: () => void;
  /** Number of favorited samples (shows a Favorites button when > 0). */
  favoritesCount: number;
  onFavorites: () => void;
};

const H_PADDING = 16;
const COLUMN_GAP = 16;

/**
 * The landing screen — a two-column grid of square category cards. Each card is
 * an original gradient with a white icon disc and the category name (see
 * `categoryAssets` for the per-category gradient + glyph). The icon disc is
 * ~0.29× and the glyph ~0.17× the card width.
 */
export function CategoriesScreen({
  warning,
  onSelectCategory,
  onInfo,
  favoritesCount,
  onFavorites,
}: CategoriesScreenProps) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - H_PADDING * 2 - COLUMN_GAP) / 2;
  const cardHeight = cardWidth; // Esri thumbnails are square.
  const discSize = cardWidth * 0.29;
  const iconSize = cardWidth * 0.17;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Categories</Text>
        <View style={styles.headerButtons}>
          {favoritesCount > 0 ? (
            <Pressable
              onPress={onFavorites}
              hitSlop={12}
              accessibilityLabel={`Favorites (${favoritesCount})`}
              style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}>
              <Text style={styles.starButtonText}>★</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onInfo}
            hitSlop={12}
            accessibilityLabel="About this app"
            style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}>
            <Text style={styles.infoButtonText}>i</Text>
          </Pressable>
        </View>
      </View>

      {warning ? <Text style={styles.warn}>{warning}</Text> : null}

      <View style={styles.grid}>
        {CATEGORIES.map((category) => (
          <Pressable
            key={category.key}
            onPress={() => onSelectCategory(category.key)}
            accessibilityRole="button"
            accessibilityLabel={category.title}
            style={({ pressed }) => [
              styles.card,
              { width: cardWidth, height: cardHeight },
              pressed && styles.cardPressed,
            ]}>
            <LinearGradient
              colors={CATEGORY_ART[category.key].colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardFill}>
              <View
                style={[
                  styles.iconDisc,
                  { width: discSize, height: discSize, borderRadius: discSize / 2 },
                ]}>
                <MaterialCommunityIcons
                  name={CATEGORY_ART[category.key].icon}
                  size={iconSize}
                  color="#fff"
                />
              </View>
              <Text style={[styles.cardLabel, { bottom: cardHeight * 0.1 }]} numberOfLines={2}>
                {category.title}
              </Text>
            </LinearGradient>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f2f7' },
  content: { paddingHorizontal: H_PADDING, paddingTop: 12, paddingBottom: 32 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontSize: 34, fontWeight: '800', color: '#111827' },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  starButtonText: { fontSize: 18, color: '#f5a623' },
  infoButton: {
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
  infoButtonText: { fontSize: 18, fontWeight: '700', fontStyle: 'italic', color: '#3c3c43' },
  pressed: { opacity: 0.6 },
  warn: { color: '#a15c00', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { borderRadius: 15, overflow: 'hidden', marginBottom: COLUMN_GAP },
  cardPressed: { opacity: 0.85 },
  cardFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconDisc: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    position: 'absolute',
    left: 10,
    right: 10,
    textAlign: 'center',
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
