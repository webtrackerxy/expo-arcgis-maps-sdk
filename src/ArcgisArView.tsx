import { requireNativeView } from 'expo';
import * as React from 'react';

import { toArcgisError, type ArcgisError } from './errors';
import type { ArcgisArViewProps, ArcgisArViewRef } from './types/arView';
import type { ArcgisSceneSource, Camera } from './types/scene';
import { validateArViewProps } from './validation';

/** The AR-shaped props sent to the native view, after validation. */
type NativeProps = Omit<ArcgisArViewProps, 'scene'> & { scene: ArcgisSceneSource };

/** Imperative methods implemented by the native AR view. */
type NativeViewHandle = {
  getCurrentCamera: () => Promise<Camera>;
};

// The module's default view is the 2D map, so the AR view is requested by its
// explicit native class name.
const NativeView = requireNativeView<NativeProps>(
  'ExpoArcgisMapsSdk',
  'ExpoArcgisArView'
) as React.ComponentType<NativeProps & { ref?: React.Ref<NativeViewHandle> }>;

/**
 * Renders an ArcGIS 3D scene in augmented reality.
 *
 * `mode` selects the experience — `worldScale` (walk-around 1:1), `tabletop` (a
 * model on a surface), or `flyover` (motion-driven fly-through). Scene content is
 * declared through `scene` exactly like {@link ArcgisSceneView}; AR-specific
 * options are the remaining props. Invalid props are reported through `onArError`
 * (or `onSceneError` for a bad `scene`) rather than throwing during render.
 *
 * AR requires a capable device; probe with {@link import('./arSupport').isArSupported}
 * before mounting. On an incapable device the view emits `onArError` with
 * `E_UNSUPPORTED`.
 */
function ArcgisArViewComponent(props: ArcgisArViewProps, ref: React.ForwardedRef<ArcgisArViewRef>) {
  const { onArError, onSceneError, ...rest } = props;
  const nativeRef = React.useRef<NativeViewHandle | null>(null);

  const normalized = React.useMemo<
    { ok: true; scene: ArcgisSceneSource } | { ok: false; error: ArcgisError }
  >(() => {
    try {
      // Validate every AR prop (throws → onArError); only `scene` is normalized
      // and replaced — the remaining props pass through unchanged via `...rest`.
      return { ok: true, scene: validateArViewProps(props).scene };
    } catch (error) {
      return { ok: false, error: toArcgisError(error, 'E_INVALID_ARGUMENT') };
    }
    // Re-validate whenever a validated prop changes.
  }, [
    props.scene,
    props.mode,
    props.trackingMode,
    props.anchor,
    props.translationFactor,
    props.initialCamera,
    props.clippingDistanceMeters,
    props.calibrationVisible,
  ]);

  React.useEffect(() => {
    if (!normalized.ok) {
      onArError?.({ nativeEvent: normalized.error });
    }
  }, [normalized, onArError]);

  React.useImperativeHandle(
    ref,
    (): ArcgisArViewRef => ({
      async getCurrentCamera() {
        try {
          return await requireHandle(nativeRef.current).getCurrentCamera();
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
    <NativeView
      {...rest}
      scene={normalized.scene}
      onArError={onArError}
      onSceneError={onSceneError}
      ref={nativeRef}
    />
  );
}

/** Throws a stable error when the native handle is unavailable. */
function requireHandle(handle: NativeViewHandle | null): NativeViewHandle {
  if (handle === null) {
    throw toArcgisError(
      { code: 'E_NATIVE_FAILURE', message: 'The AR view is not mounted.' },
      'E_NATIVE_FAILURE'
    );
  }
  return handle;
}

/** Native ArcGIS augmented-reality view. See {@link ArcgisArViewProps}. */
export const ArcgisArView = React.forwardRef<ArcgisArViewRef, ArcgisArViewProps>(
  ArcgisArViewComponent
);
ArcgisArView.displayName = 'ArcgisArView';
