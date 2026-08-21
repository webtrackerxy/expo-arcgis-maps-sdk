import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureArcgis, type ArcgisError } from 'expo-arcgis-maps-sdk';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AboutModal } from './components/AboutModal';
import { CategoriesScreen } from './components/CategoriesScreen';
import { CategoryListScreen } from './components/CategoryListScreen';
import { FavoritesScreen } from './components/FavoritesScreen';
import { SampleInfoModal } from './components/SampleInfoModal';
import { SampleMenu } from './components/SampleMenu';
import {
  CATEGORIES,
  SCREENS,
  screensForCategory,
  type CategoryKey,
  type ScreenKey,
} from './components/screens';
import { SAMPLE_META } from './components/screens/generated/sampleMeta';

const REPO_URL = 'https://github.com/webtrackerxy/expo-arcgis-maps-sdk';
/** ArcGIS Swift API reference base — the module wraps these SDK classes. */
const ESRI_API_BASE = 'https://developers.arcgis.com/swift/api-reference/documentation/arcgis';
/** AsyncStorage key for the set of favorited sample keys. */
const FAVORITES_STORAGE_KEY = 'expo-arcgis-maps-sdk.favorites';

/**
 * Example host for `expo-arcgis-maps-sdk`. Loads a stored ArcGIS API key (or the
 * `.env` default), configures ArcGIS with it, then browses the test screens the
 * way the ArcGIS Maps SDK for Swift samples app does: a Categories grid → a
 * category's sample list → the sample itself. The API key can be entered from
 * the About screen (ⓘ) and is persisted to AsyncStorage across restarts.
 */
const ENV_API_KEY = process.env.EXPO_PUBLIC_ARCGIS_API_KEY ?? null;
/** AsyncStorage key under which the user-entered ArcGIS API key is stored. */
const API_KEY_STORAGE_KEY = 'expo-arcgis-maps-sdk.apiKey';

type Nav =
  | { view: 'categories' }
  | { view: 'favorites' }
  | { view: 'category'; category: CategoryKey }
  | { view: 'sample'; category: CategoryKey; screen: ScreenKey };

function AppContent() {
  const [nav, setNav] = useState<Nav>({ view: 'categories' });
  const [configured, setConfigured] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  // Favorites are ordered so the Favorites list can be reordered.
  const [favorites, setFavorites] = useState<ScreenKey[]>([]);
  // The active API key, and whether it has been loaded from storage yet.
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyLoaded, setKeyLoaded] = useState(false);

  // Load the stored key on startup, falling back to the `.env` default.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(API_KEY_STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        setApiKey(stored ?? ENV_API_KEY);
        setKeyLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setApiKey(ENV_API_KEY);
        setKeyLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // (Re)configure ArcGIS whenever the key changes.
  useEffect(() => {
    if (!keyLoaded) return;
    setConfigured(false);
    if (!apiKey) {
      setConfigError('No API key. Tap ⓘ → “Enter API Key” to load basemaps.');
      return;
    }
    setConfigError(null);
    let active = true;
    configureArcgis({ apiKey })
      .then(() => active && setConfigured(true))
      .catch((error: ArcgisError) => active && setConfigError(`${error.code}: ${error.message}`));
    return () => {
      active = false;
    };
  }, [apiKey, keyLoaded]);

  async function saveApiKey(key: string) {
    await AsyncStorage.setItem(API_KEY_STORAGE_KEY, key);
    setApiKey(key);
  }

  async function resetApiKey() {
    await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey(ENV_API_KEY);
  }

  // Load favorites once on startup.
  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_STORAGE_KEY)
      .then((stored) => {
        if (stored) setFavorites(JSON.parse(stored) as ScreenKey[]);
      })
      .catch(() => undefined);
  }, []);

  const persistFavorites = (next: ScreenKey[]) => {
    AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
    return next;
  };

  function toggleFavorite(key: ScreenKey) {
    setFavorites((prev) =>
      persistFavorites(prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])
    );
  }

  function moveFavorite(key: ScreenKey, direction: -1 | 1) {
    setFavorites((prev) => {
      const i = prev.indexOf(key);
      const j = i + direction;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return persistFavorites(next);
    });
  }

  const currentSampleKey = nav.view === 'sample' ? nav.screen : null;

  function openGitHub(key: ScreenKey) {
    const file = SAMPLE_META[key]?.file;
    if (file) Linking.openURL(`${REPO_URL}/blob/main/example/components/screens/${file}`);
  }

  function openEsri(key: ScreenKey) {
    const api = SAMPLE_META[key]?.relevantApi;
    Linking.openURL(api ? `${ESRI_API_BASE}/${api.toLowerCase()}` : `${ESRI_API_BASE}`);
  }

  let content: ReactNode;

  if (nav.view === 'categories') {
    content = (
      <CategoriesScreen
        warning={configError}
        onSelectCategory={(category) => setNav({ view: 'category', category })}
        onInfo={() => setAboutVisible(true)}
        favoritesCount={favorites.length}
        onFavorites={() => setNav({ view: 'favorites' })}
      />
    );
  } else if (nav.view === 'favorites') {
    content = (
      <FavoritesScreen
        favorites={favorites}
        onBack={() => setNav({ view: 'categories' })}
        onSelectScreen={(screen) => {
          const category = SCREENS.find((s) => s.key === screen)?.category ?? 'all';
          setNav({ view: 'sample', category, screen });
        }}
        onMove={moveFavorite}
        onUnfavorite={(key) => toggleFavorite(key)}
      />
    );
  } else if (nav.view === 'category') {
    const category = CATEGORIES.find((c) => c.key === nav.category) ?? CATEGORIES[0];
    content = (
      <CategoryListScreen
        category={category}
        screens={screensForCategory(nav.category)}
        onBack={() => setNav({ view: 'categories' })}
        onSelectScreen={(screen) => setNav({ view: 'sample', category: nav.category, screen })}
      />
    );
  } else {
    const entry = SCREENS.find((s) => s.key === nav.screen) ?? SCREENS[0];
    const Screen = entry.Component;
    content = (
      <View style={styles.sampleRoot}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => setNav({ view: 'category', category: nav.category })}
            hitSlop={12}
            accessibilityLabel="Back to list"
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {entry.title}
          </Text>
          <Pressable
            onPress={() => setMenuVisible(true)}
            hitSlop={12}
            accessibilityLabel="More options"
            style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}>
            <Text style={styles.moreDots}>⋯</Text>
          </Pressable>
        </View>
        {configError ? <Text style={styles.warn}>{configError}</Text> : null}
        <View style={styles.stage}>
          <Screen ready={configured} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {content}
      <AboutModal
        visible={aboutVisible}
        onClose={() => setAboutVisible(false)}
        hasApiKey={apiKey !== null && apiKey.length > 0}
        onSaveApiKey={saveApiKey}
        onResetApiKey={resetApiKey}
      />
      {currentSampleKey ? (
        <>
          <SampleMenu
            visible={menuVisible}
            onClose={() => setMenuVisible(false)}
            onViewInfo={() => setInfoVisible(true)}
            onViewEsri={() => openEsri(currentSampleKey)}
            onViewGitHub={() => openGitHub(currentSampleKey)}
            onToggleFavorite={() => toggleFavorite(currentSampleKey)}
            isFavorite={favorites.includes(currentSampleKey)}
          />
          <SampleInfoModal
            visible={infoVisible}
            onClose={() => setInfoVisible(false)}
            screenKey={currentSampleKey}
          />
        </>
      ) : null}
    </SafeAreaView>
  );
}

/**
 * Root export. `SafeAreaProvider` supplies the real window insets so the
 * `SafeAreaView` below insets correctly on both the iOS notch and the Android
 * status/navigation bars — including Android edge-to-edge, where
 * `StatusBar.currentHeight` is unreliable.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  sampleRoot: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
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
  moreButton: {
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
  moreDots: { fontSize: 20, lineHeight: 22, color: '#3c3c43', marginTop: -4 },
  pressed: { opacity: 0.6 },
  title: { flex: 1, fontSize: 18, fontWeight: '600', color: '#111827' },
  stage: { flex: 1, margin: 12, backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' },
  warn: { paddingHorizontal: 16, color: '#a15c00' },
});
