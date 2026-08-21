/**
 * The "View Info" sheet for a sample — an Info / Code segmented view mirroring
 * the official ArcGIS Maps SDK Samples app. Info renders the sample's README
 * (adapted from the official sample); Code shows this app's React-Native source
 * for the screen, syntax-highlighted.
 */
import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CodeHighlight } from './CodeHighlight';
import { SAMPLE_INFO } from './screens/generated/sampleInfo';
import { SAMPLE_META } from './screens/generated/sampleMeta';
import { SAMPLE_SOURCES } from './screens/generated/sampleSources';

type SampleInfoModalProps = {
  visible: boolean;
  onClose: () => void;
  /** The sample's screen key, used to look up its info + source. */
  screenKey: string | null;
};

export function SampleInfoModal({ visible, onClose, screenKey }: SampleInfoModalProps) {
  const [tab, setTab] = useState<'info' | 'code'>('info');
  // iOS presents this as a `pageSheet` card that already clears the status bar.
  // Android renders the modal full-screen (edge-to-edge on API 35+), so the
  // header must inset itself below the status bar / above the navigation bar.
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'android' ? insets.top : 0;
  const bottomInset = Platform.OS === 'android' ? insets.bottom : 0;
  const info = screenKey ? (SAMPLE_INFO[screenKey] ?? '') : '';
  const source = screenKey ? (SAMPLE_SOURCES[screenKey] ?? '') : '';
  const file = screenKey ? SAMPLE_META[screenKey]?.file : undefined;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.container, { paddingBottom: bottomInset }]}>
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <View style={styles.segment}>
            <Pressable
              onPress={() => setTab('info')}
              style={[styles.segmentBtn, tab === 'info' && styles.segmentBtnOn]}>
              <Text style={[styles.segmentText, tab === 'info' && styles.segmentTextOn]}>Info</Text>
            </Pressable>
            <Pressable
              onPress={() => setTab('code')}
              style={[styles.segmentBtn, tab === 'code' && styles.segmentBtnOn]}>
              <Text style={[styles.segmentText, tab === 'code' && styles.segmentTextOn]}>Code</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Done"
            style={({ pressed }) => [styles.done, pressed && styles.pressed]}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>

        {tab === 'info' ? (
          <ScrollView contentContainerStyle={styles.infoScroll}>
            <Markdown style={markdownStyles}>{info}</Markdown>
          </ScrollView>
        ) : (
          <View style={styles.codeWrap}>
            <ScrollView contentContainerStyle={styles.codeScroll}>
              <ScrollView horizontal contentContainerStyle={styles.codeInner}>
                <CodeHighlight source={source} />
              </ScrollView>
            </ScrollView>
            {file ? (
              <View style={styles.filePill}>
                <Text style={styles.filePillText}>{file}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#e9e9ee',
    borderRadius: 9,
    padding: 2,
  },
  segmentBtn: { paddingVertical: 6, paddingHorizontal: 22, borderRadius: 7 },
  segmentBtnOn: { backgroundColor: '#fff' },
  segmentText: { fontSize: 15, fontWeight: '600', color: '#3c3c43' },
  segmentTextOn: { color: '#111827' },
  done: { paddingHorizontal: 4 },
  doneText: { fontSize: 17, fontWeight: '600', color: '#111827' },
  pressed: { opacity: 0.6 },

  infoScroll: { padding: 20, paddingBottom: 48 },
  codeWrap: { flex: 1 },
  codeScroll: { paddingVertical: 8 },
  codeInner: { paddingHorizontal: 12 },
  filePill: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  filePillText: { fontSize: 15, fontWeight: '600', color: '#111827' },
});

// Markdown theme tuned to the light sheet (mirrors the official Info look).
const markdownStyles = StyleSheet.create({
  body: { color: '#1c1c1e', fontSize: 16, lineHeight: 23 },
  // Headings need an explicit lineHeight >= fontSize, otherwise they inherit the
  // body lineHeight (23) and the tall bold glyphs get clipped at the top.
  heading1: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
    marginBottom: 10,
  },
  heading2: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '700',
    color: '#111827',
    marginTop: 22,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 4,
  },
  hr: { backgroundColor: '#e2e7e4', height: StyleSheet.hairlineWidth, marginVertical: 10 },
  paragraph: { marginTop: 6, marginBottom: 6 },
  // eslint-disable-next-line react-native/no-color-literals
  code_inline: {
    backgroundColor: '#eef2f0',
    color: '#1c1c1e',
    fontFamily: 'Menlo',
    fontSize: 14,
    borderRadius: 4,
  },
  code_block: { backgroundColor: '#f6f8fa', borderRadius: 8, padding: 12, fontFamily: 'Menlo' },
  fence: { backgroundColor: '#f6f8fa', borderRadius: 8, padding: 12, fontFamily: 'Menlo' },
  link: { color: '#2f7d6e', textDecorationLine: 'underline' },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
});
