import { requireNativeView } from 'expo';
import * as React from 'react';

import { toArcgisError, type ArcgisError } from './errors';
import type { GeographicPoint } from './types/common';
import type { IdentifyOptions } from './types/identify';
import type {
  ArcgisSceneSource,
  ArcgisSceneViewProps,
  ArcgisSceneViewRef,
  Camera,
} from './types/scene';
import type { ViewpointAnimationOptions } from './types/viewpoint';
import {
  validateCamera,
  validateGeographicPoint,
  validateIdentifyOptions,
  validateSceneSource,
  validateViewpointAnimationOptions,
} from './validation';

/** Props actually sent to the native view (after `scene` is validated). */
type NativeProps = Omit<ArcgisSceneViewProps, 'scene'> & { scene: ArcgisSceneSource };

/** Imperative methods implemented by the native scene view. */
type NativeViewHandle = {
  setCamera: (camera: Camera, options: ViewpointAnimationOptions) => Promise<void>;
  getSurfaceElevation: (point: GeographicPoint) => Promise<number>;
  selectSceneFeatures: (options: IdentifyOptions) => Promise<number>;
  clearSceneSelection: () => Promise<void>;
};

// This module registers two views; the map view is the module default, so the
// scene view must be requested by its explicit view name (the native class name).
const NativeView = requireNativeView<NativeProps>(
  'ExpoArcgisMapsSdk',
  'ExpoArcgisSceneView'
) as React.ComponentType<NativeProps & { ref?: React.Ref<NativeViewHandle> }>;

/**
 * Renders a native ArcGIS 3D scene.
 *
 * This is the initial 3D foundation: basemap, world elevation, scene layers, and
 * an initial/imperative camera. Declarative state lives in the `scene` prop;
 * camera moves live on the ref. Invalid `scene` props are reported through
 * `onSceneError` rather than throwing during render.
 */
function ArcgisSceneViewComponent(
  props: ArcgisSceneViewProps,
  ref: React.ForwardedRef<ArcgisSceneViewRef>
) {
  const { scene, onSceneError, ...rest } = props;
  const nativeRef = React.useRef<NativeViewHandle | null>(null);

  const normalized = React.useMemo<
    { ok: true; value: ArcgisSceneSource } | { ok: false; error: ArcgisError }
  >(() => {
    try {
      return { ok: true, value: validateSceneSource(scene) };
    } catch (error) {
      return { ok: false, error: toArcgisError(error, 'E_INVALID_ARGUMENT') };
    }
  }, [scene]);

  React.useEffect(() => {
    if (!normalized.ok) {
      onSceneError?.({ nativeEvent: normalized.error });
    }
  }, [normalized, onSceneError]);

  React.useImperativeHandle(
    ref,
    (): ArcgisSceneViewRef => ({
      async setCamera(camera, options) {
        const validated = validateCamera(camera);
        const animation = validateViewpointAnimationOptions(options);
        try {
          await requireHandle(nativeRef.current).setCamera(validated, animation);
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async getSurfaceElevation(point) {
        const validated = validateGeographicPoint(point);
        try {
          return await requireHandle(nativeRef.current).getSurfaceElevation(validated);
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async selectSceneFeatures(options) {
        const validated = validateIdentifyOptions(options);
        try {
          return await requireHandle(nativeRef.current).selectSceneFeatures(validated);
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async clearSceneSelection() {
        try {
          await requireHandle(nativeRef.current).clearSceneSelection();
        } catch (error) {
          throw toArcgisError(error);
        }
      },
    }),
    []
  );

  if (!normalized.ok) {
    return null;
  }

  return (
    <NativeView {...rest} scene={normalized.value} onSceneError={onSceneError} ref={nativeRef} />
  );
}

/** Throws a stable error when the native handle is unavailable. */
function requireHandle(handle: NativeViewHandle | null): NativeViewHandle {
  if (handle === null) {
    throw toArcgisError(
      { code: 'E_NATIVE_FAILURE', message: 'The scene view is not mounted.' },
      'E_NATIVE_FAILURE'
    );
  }
  return handle;
}

/** Native ArcGIS 3D scene view. See {@link ArcgisSceneViewProps}. */
export const ArcgisSceneView = React.forwardRef<ArcgisSceneViewRef, ArcgisSceneViewProps>(
  ArcgisSceneViewComponent
);
ArcgisSceneView.displayName = 'ArcgisSceneView';
