/**
 * The "About" screen, opened from the Categories header's ⓘ button — modeled on
 * the official ArcGIS Maps SDK Samples app. Shows app / SDK info and links, plus
 * an "Enter API Key" row that prompts for an ArcGIS API key. The key is applied
 * via `configureArcgis` and persisted by the host so it survives app restarts.
 */
import { useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const APP_VERSION = '0.1.0';
const SDK_VERSION = '300.0.0';
const REPO_URL = 'https://github.com/webtrackerxy/expo-arcgis-maps-sdk';
const ESRI_COMMUNITY_URL = 'https://community.esri.com/';
const DEVELOPERS_URL = 'https://developers.arcgis.com/documentation/';

type AboutModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Whether an API key is currently configured (drives the status line). */
  hasApiKey: boolean;
  /** Persist + apply a new API key. */
  onSaveApiKey: (key: string) => void;
  /** Clear the stored key (revert to the `.env` default, if any). */
  onResetApiKey: () => void;
};

/** A row that looks like an iOS grouped-list action. */
function LinkRow({ label, onPress, last }: { label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, last && styles.rowLast, pressed && styles.pressed]}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

/** A static "label — value" info row. */
function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function AboutModal({
  visible,
  onClose,
  hasApiKey,
  onSaveApiKey,
  onResetApiKey,
}: AboutModalProps) {
  const [promptVisible, setPromptVisible] = useState(false);
  const [draftKey, setDraftKey] = useState('');
  // iOS presents a `pageSheet` card below the status bar; Android renders the
  // modal full-screen, so inset the header/content past the system bars.
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'android' ? insets.top : 0;
  const bottomInset = Platform.OS === 'android' ? insets.bottom : 0;

  function openPrompt() {
    setDraftKey('');
    setPromptVisible(true);
  }
  function submit() {
    const key = draftKey.trim();
    if (key.length === 0) return;
    onSaveApiKey(key);
    setPromptVisible(false);
  }
  function reset() {
    onResetApiKey();
    setPromptVisible(false);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingBottom: bottomInset }]}>
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <View style={styles.headerSide} />
          <Text style={styles.headerTitle}>About</Text>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Done"
            style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <View style={styles.logo}>
              <Text style={styles.logoGlyph}>🗺️</Text>
            </View>
            <Text style={styles.appName}>expo-arcgis-maps-sdk</Text>
            <Text style={styles.copyright}>
              Community-maintained ArcGIS Maps SDK bindings for Expo.
            </Text>
          </View>

          <View style={styles.group}>
            <InfoRow label="Version" value={APP_VERSION} />
            <InfoRow label="ArcGIS SDK" value={SDK_VERSION} last />
          </View>

          <Text style={styles.groupHeader}>Links</Text>
          <View style={styles.group}>
            <LinkRow label="Documentation" onPress={() => Linking.openURL(DEVELOPERS_URL)} />
            <LinkRow label="Esri Community" onPress={() => Linking.openURL(ESRI_COMMUNITY_URL)} />
            <LinkRow label="GitHub Repository" onPress={() => Linking.openURL(REPO_URL)} last />
          </View>

          <Text style={styles.groupHeader}>API key</Text>
          <View style={styles.group}>
            <LinkRow label="Enter API Key" onPress={openPrompt} last={!hasApiKey} />
            {hasApiKey ? (
              <LinkRow label="Reset API Key" onPress={onResetApiKey} last />
            ) : null}
          </View>
          <Text style={styles.footnote}>
            {hasApiKey
              ? 'An API key is set. It is stored on-device and reused when the app restarts.'
              : 'No API key set. Enter one to load basemaps and access location services.'}
          </Text>
        </ScrollView>
      </View>

      {/* API-key entry prompt (custom modal, like the official app). */}
      <Modal visible={promptVisible} transparent animationType="fade" onRequestClose={() => setPromptVisible(false)}>
        <View style={styles.promptBackdrop}>
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>Enter API Key</Text>
            <TextInput
              style={styles.promptInput}
              placeholder="Enter API Key Here"
              placeholderTextColor="#9aa0a6"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              value={draftKey}
              onChangeText={setDraftKey}
              onSubmitEditing={submit}
            />
            <Pressable
              onPress={submit}
              disabled={draftKey.trim().length === 0}
              style={({ pressed }) => [styles.promptBtn, pressed && styles.pressed]}>
              <Text style={[styles.promptBtnText, draftKey.trim().length === 0 && styles.disabledText]}>
                Submit
              </Text>
            </Pressable>
            <Pressable
              onPress={reset}
              style={({ pressed }) => [styles.promptBtn, pressed && styles.pressed]}>
              <Text style={styles.promptBtnStrong}>Reset</Text>
            </Pressable>
            <Pressable
              onPress={() => setPromptVisible(false)}
              style={({ pressed }) => [styles.promptBtn, pressed && styles.pressed]}>
              <Text style={styles.promptBtnStrong}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerSide: { width: 64 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  doneButton: {
    width: 64,
    alignItems: 'flex-end',
  },
  doneText: { fontSize: 17, fontWeight: '600', color: '#111827' },
  scroll: { paddingBottom: 40 },
  hero: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 24, gap: 6 },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: '#2f7d6e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  logoGlyph: { fontSize: 42 },
  appName: { fontSize: 20, fontWeight: '700', color: '#111827' },
  copyright: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  groupHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 22,
    marginBottom: 6,
    marginHorizontal: 20,
  },
  group: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e7e4',
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 16, color: '#111827' },
  rowValue: { fontSize: 16, color: '#6b7280' },
  linkText: { fontSize: 16, color: '#2f7d6e', fontWeight: '500' },
  footnote: { fontSize: 12, color: '#8b968f', marginHorizontal: 20, marginTop: 8 },
  pressed: { opacity: 0.6 },

  promptBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  promptCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#f7f7f9',
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  promptTitle: { fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center' },
  promptInput: {
    backgroundColor: '#e9e9ee',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  promptBtn: {
    backgroundColor: '#e9e9ee',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  promptBtnText: { fontSize: 16, color: '#8e8e93', fontWeight: '600' },
  promptBtnStrong: { fontSize: 16, color: '#111827', fontWeight: '600' },
  disabledText: { color: '#c4c4c9' },
});
