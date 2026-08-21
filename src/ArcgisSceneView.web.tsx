import * as React from 'react';

import { ArcgisSdkError } from './errors';
import type { ArcgisSceneViewProps, ArcgisSceneViewRef } from './types/scene';

const WEB_UNSUPPORTED = () =>
  new ArcgisSdkError('E_UNSUPPORTED', 'ArcGIS scenes are not supported on web.');

/**
 * Web is not a supported target. Mounting reports a stable `E_UNSUPPORTED` error
 * via `onSceneError` and renders nothing.
 */
function ArcgisSceneViewComponent(
  props: ArcgisSceneViewProps,
  ref: React.ForwardedRef<ArcgisSceneViewRef>
) {
  const { onSceneError } = props;

  React.useEffect(() => {
    onSceneError?.({ nativeEvent: WEB_UNSUPPORTED().toArcgisError() });
  }, [onSceneError]);

  React.useImperativeHandle(
    ref,
    (): ArcgisSceneViewRef => ({
      async setCamera() {
        throw WEB_UNSUPPORTED();
      },
      async getSurfaceElevation() {
        throw WEB_UNSUPPORTED();
      },
      async selectSceneFeatures() {
        throw WEB_UNSUPPORTED();
      },
      async clearSceneSelection() {
        throw WEB_UNSUPPORTED();
      },
    }),
    []
  );

  return null;
}

export const ArcgisSceneView = React.forwardRef<ArcgisSceneViewRef, ArcgisSceneViewProps>(
  ArcgisSceneViewComponent
);
ArcgisSceneView.displayName = 'ArcgisSceneView';
