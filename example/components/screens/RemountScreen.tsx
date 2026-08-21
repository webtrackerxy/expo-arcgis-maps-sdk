import { ArcgisMapView } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { LONDON, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/** Toggles the map on/off to exercise mount/unmount/remount safety. */
export function RemountScreen({ ready }: ScreenProps) {
  const [mounted, setMounted] = useState(true);
  const [mountCount, setMountCount] = useState(1);

  return (
    <View style={screenStyles.fill}>
      <Button
        title={mounted ? 'Unmount map' : 'Mount map'}
        onPress={() => {
          if (!mounted) {
            setMountCount((n) => n + 1);
          }
          setMounted((m) => !m);
        }}
      />
      <Text style={screenStyles.status}>Mounts: {mountCount}</Text>
      <View style={screenStyles.fill}>
        {mounted && ready ? (
          <ArcgisMapView
            style={screenStyles.fill}
            map={{ basemap: 'arcGISLightGray', initialViewpoint: { center: LONDON, scale: 50_000 } }}
          />
        ) : (
          <Centered text={mounted ? 'Waiting for configuration…' : 'Map unmounted'} />
        )}
      </View>
    </View>
  );
}
