import {
  ArcgisMapView,
  type ArcgisMapViewRef,
  type ExportImageResult,
} from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Button, Image, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { SANTA_MONICA, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/** Exports the current map view via the ref's `exportImage` and previews it. */
export function ScreenshotScreen({ ready }: ScreenProps) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [shot, setShot] = useState<ExportImageResult | null>(null);
  const [status, setStatus] = useState('Pan/zoom, then take a screenshot.');

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.bar}>
        <Button
          title="Take screenshot"
          onPress={() => {
            setStatus('Exporting…');
            mapRef.current
              ?.exportImage()
              .then((result) => {
                setShot(result);
                setStatus(`Exported ${result.width}×${result.height}px`);
              })
              .catch((error: { code?: string; message?: string }) => {
                setShot(null);
                setStatus(`${error.code ?? 'Error'}: ${error.message ?? 'export failed'}`);
              });
          }}
        />
        <Text style={styles.status} numberOfLines={2}>
          {status}
        </Text>
      </View>
      <View style={screenStyles.fill}>
        <ArcgisMapView
          ref={mapRef}
          style={screenStyles.fill}
          map={{
            basemap: 'arcGISTopographic',
            initialViewpoint: { center: SANTA_MONICA, scale: 200_000 },
          }}
        />
        {shot ? (
          <Image
            source={{ uri: shot.uri }}
            style={styles.preview}
            resizeMode="cover"
            accessibilityLabel="Exported map image"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  status: { flex: 1, fontSize: 13, color: '#374151' },
  // Floated over the map's top-right so it stays visible above any dev overlay.
  preview: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 120,
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#fff',
  },
});
