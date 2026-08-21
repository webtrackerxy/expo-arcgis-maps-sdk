import * as React from 'react';

import { ArcgisSdkError } from './errors';
import type { ArcgisMapViewProps, ArcgisMapViewRef } from './types/view';

const WEB_UNSUPPORTED = () =>
  new ArcgisSdkError('E_UNSUPPORTED', 'ArcGIS maps are not supported on web.');

/**
 * Web is not a supported target for v0.1. Mounting reports a stable
 * `E_UNSUPPORTED` error via `onMapError` and renders nothing, so a shared
 * codebase degrades gracefully instead of crashing the bundle.
 */
function ArcgisMapViewComponent(
  props: ArcgisMapViewProps,
  ref: React.ForwardedRef<ArcgisMapViewRef>
) {
  const { onMapError } = props;

  React.useEffect(() => {
    onMapError?.({ nativeEvent: WEB_UNSUPPORTED().toArcgisError() });
  }, [onMapError]);

  React.useImperativeHandle(
    ref,
    (): ArcgisMapViewRef => ({
      async setViewpoint() {
        throw WEB_UNSUPPORTED();
      },
      async identify() {
        throw WEB_UNSUPPORTED();
      },
      async showPopup() {
        throw WEB_UNSUPPORTED();
      },
      async showFeatureForm() {
        throw WEB_UNSUPPORTED();
      },
      async evaluateArcade() {
        throw WEB_UNSUPPORTED();
      },
      async startGeometryEditor() {
        throw WEB_UNSUPPORTED();
      },
      async stopGeometryEditor() {
        throw WEB_UNSUPPORTED();
      },
      async startNavigation() {
        throw WEB_UNSUPPORTED();
      },
      async stopNavigation() {
        throw WEB_UNSUPPORTED();
      },
      async queryFeatures() {
        throw WEB_UNSUPPORTED();
      },
      async selectFeatures() {
        throw WEB_UNSUPPORTED();
      },
      async clearSelection() {
        throw WEB_UNSUPPORTED();
      },
      async controlKmlTour() {
        throw WEB_UNSUPPORTED();
      },
      async queryFeatureExtent() {
        throw WEB_UNSUPPORTED();
      },
      async queryRelatedFeatures() {
        throw WEB_UNSUPPORTED();
      },
      async queryStatistics() {
        throw WEB_UNSUPPORTED();
      },
      async applyEdits() {
        throw WEB_UNSUPPORTED();
      },
      async exportImage() {
        throw WEB_UNSUPPORTED();
      },
    }),
    []
  );

  return null;
}

export const ArcgisMapView = React.forwardRef<ArcgisMapViewRef, ArcgisMapViewProps>(
  ArcgisMapViewComponent
);
ArcgisMapView.displayName = 'ArcgisMapView';
