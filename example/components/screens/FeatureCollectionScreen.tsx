import { ArcgisMapView } from 'expo-arcgis-maps-sdk';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// A public ArcGIS portal item whose data is a feature collection.
const FEATURE_COLLECTION_ITEM = '32798dfad17942858d5eef82ee802f0b';

/**
 * Add a feature collection layer from a portal item ("Add feature collection
 * layer from portal item"): the portal item's feature-collection data is drawn
 * client-side as a `featureCollection` operational layer.
 */
export function FeatureCollectionScreen({ ready }: ScreenProps) {
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <ArcgisMapView
      style={screenStyles.fill}
      map={{
        basemap: 'arcGISOceans',
        initialViewpoint: { center: { latitude: 32.62, longitude: -101.34 }, scale: 60_000_000 },
        layers: [{ id: 'fc', type: 'featureCollection', portalItemId: FEATURE_COLLECTION_ITEM }],
      }}
    />
  );
}
