import { requireNativeView } from 'expo';
import * as React from 'react';

import { toArcgisError, type ArcgisError } from './errors';
import type { GeographicPoint } from './types/common';
import type { ApplyEditsOptions, ApplyEditsResult } from './types/edit';
import type { ArcgisGeometry } from './types/geometry';
import type {
  ArcadeEvaluationOptions,
  ArcadeEvaluationResult,
  FeatureFormInfo,
  IdentifyOptions,
  IdentifyResult,
  PopupInfo,
} from './types/identify';
import type { KmlTourOptions } from './types/layer';
import type { ArcgisMapSource } from './types/map';
import type {
  FeatureQueryOptions,
  FeatureQueryResult,
  QueryExtentOptions,
  QueryExtentResult,
  QueryStatisticsOptions,
  RelatedFeaturesOptions,
  SelectFeaturesOptions,
  StatisticsRow,
} from './types/query';
import type { ExportImageResult } from './types/screenshot';
import type { ArcgisMapViewProps, ArcgisMapViewRef, GeometryEditorOptions } from './types/view';
import type { Viewpoint, ViewpointAnimationOptions } from './types/viewpoint';
import {
  validateApplyEditsOptions,
  validateArcadeEvaluationOptions,
  validateFeatureQueryOptions,
  validateGeographicPoint,
  validateGeometryEditorOptions,
  validateIdentifyOptions,
  validateKmlTourOptions,
  validateMapSource,
  validateQueryExtentOptions,
  validateQueryStatisticsOptions,
  validateRelatedFeaturesOptions,
  validateSelectFeaturesOptions,
  validateViewpoint,
  validateViewpointAnimationOptions,
} from './validation';

/**
 * Props actually sent to the native view. The public {@link ArcgisMapViewProps}
 * `map` is validated/normalized before it becomes `map` here.
 */
type NativeProps = Omit<ArcgisMapViewProps, 'map'> & { map: ArcgisMapSource };

/**
 * Imperative methods implemented by the native view (Expo view functions). The
 * JS wrapper validates input, then forwards to these.
 */
type NativeViewHandle = {
  setViewpoint: (viewpoint: Viewpoint, options: ViewpointAnimationOptions) => Promise<void>;
  identify: (options: IdentifyOptions) => Promise<IdentifyResult[]>;
  showPopup: (options: IdentifyOptions) => Promise<PopupInfo[]>;
  showFeatureForm: (options: IdentifyOptions) => Promise<FeatureFormInfo[]>;
  evaluateArcade: (options: ArcadeEvaluationOptions) => Promise<ArcadeEvaluationResult[]>;
  queryFeatures: (options: FeatureQueryOptions) => Promise<FeatureQueryResult[]>;
  selectFeatures: (options: SelectFeaturesOptions) => Promise<number>;
  clearSelection: (layerId: string) => Promise<void>;
  controlKmlTour: (options: KmlTourOptions) => Promise<void>;
  queryFeatureExtent: (options: QueryExtentOptions) => Promise<QueryExtentResult>;
  queryRelatedFeatures: (options: RelatedFeaturesOptions) => Promise<FeatureQueryResult[]>;
  queryStatistics: (options: QueryStatisticsOptions) => Promise<StatisticsRow[]>;
  applyEdits: (options: ApplyEditsOptions) => Promise<ApplyEditsResult>;
  exportImage: () => Promise<ExportImageResult>;
  startGeometryEditor: (options: GeometryEditorOptions) => Promise<void>;
  stopGeometryEditor: () => Promise<ArcgisGeometry | null>;
  startNavigation: (options: { stops: GeographicPoint[]; reroute?: boolean }) => Promise<void>;
  stopNavigation: () => Promise<void>;
};

// The native view accepts a ref exposing the imperative view functions; model
// that here so callers get typed access without an `any`.
const NativeView = requireNativeView<NativeProps>('ExpoArcgisMapsSdk') as React.ComponentType<
  NativeProps & { ref?: React.Ref<NativeViewHandle> }
>;

/**
 * Renders a native ArcGIS 2D map.
 *
 * Declarative state lives in props (see {@link ArcgisMapViewProps}); one-time
 * actions live on the ref (see {@link ArcgisMapViewRef}). Invalid `map` props
 * are reported through `onMapError` with a stable `E_INVALID_ARGUMENT` error
 * rather than throwing during render.
 */
function ArcgisMapViewComponent(
  props: ArcgisMapViewProps,
  ref: React.ForwardedRef<ArcgisMapViewRef>
) {
  const { map, onMapError, ...rest } = props;
  const nativeRef = React.useRef<NativeViewHandle | null>(null);

  // Normalize declarative props once per change. On failure we keep the last
  // valid map (or none) and surface the problem via onMapError below.
  const normalized = React.useMemo<
    { ok: true; value: ArcgisMapSource } | { ok: false; error: ArcgisError }
  >(() => {
    try {
      return { ok: true, value: validateMapSource(map) };
    } catch (error) {
      return { ok: false, error: toArcgisError(error, 'E_INVALID_ARGUMENT') };
    }
  }, [map]);

  React.useEffect(() => {
    if (!normalized.ok) {
      onMapError?.({ nativeEvent: normalized.error });
    }
  }, [normalized, onMapError]);

  React.useImperativeHandle(
    ref,
    (): ArcgisMapViewRef => ({
      async setViewpoint(viewpoint, options) {
        const validated = validateViewpoint(viewpoint);
        const animation = validateViewpointAnimationOptions(options);
        try {
          await requireHandle(nativeRef.current).setViewpoint(validated, animation);
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async identify(options) {
        const validated = validateIdentifyOptions(options);
        try {
          return await requireHandle(nativeRef.current).identify(validated);
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async showPopup(options) {
        const validated = validateIdentifyOptions(options);
        try {
          return await requireHandle(nativeRef.current).showPopup(validated);
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async showFeatureForm(options) {
        const validated = validateIdentifyOptions(options);
        try {
          return await requireHandle(nativeRef.current).showFeatureForm(validated);
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async evaluateArcade(options) {
        const validated = validateArcadeEvaluationOptions(options);
        try {
          return await requireHandle(nativeRef.current).evaluateArcade(validated);
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async queryFeatures(options) {
        const validated = validateFeatureQueryOptions(options);
        try {
          return await requireHandle(nativeRef.current).queryFeatures(validated);
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async selectFeatures(options) {
        const validated = validateSelectFeaturesOptions(options);
        try {
          return await requireHandle(nativeRef.current).selectFeatures(validated);
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async clearSelection(layerId) {
        if (typeof layerId !== 'string' || layerId.length === 0) {
          throw toArcgisError(
            { code: 'E_INVALID_ARGUMENT', message: 'clearSelection requires a layer id.' },
            'E_INVALID_ARGUMENT'
          );
        }
        try {
          await requireHandle(nativeRef.current).clearSelection(layerId);
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async controlKmlTour(options) {
        const validated = validateKmlTourOptions(options);
        try {
          await requireHandle(nativeRef.current).controlKmlTour(validated);
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async queryFeatureExtent(options) {
        const validated = validateQueryExtentOptions(options);
        try {
          return await requireHandle(nativeRef.current).queryFeatureExtent(validated);
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async queryRelatedFeatures(options) {
        const validated = validateRelatedFeaturesOptions(options);
        try {
          return await requireHandle(nativeRef.current).queryRelatedFeatures(validated);
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async queryStatistics(options) {
        const validated = validateQueryStatisticsOptions(options);
        try {
          return await requireHandle(nativeRef.current).queryStatistics(validated);
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async applyEdits(options) {
        const validated = validateApplyEditsOptions(options);
        try {
          return await requireHandle(nativeRef.current).applyEdits(validated);
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async exportImage() {
        try {
          return await requireHandle(nativeRef.current).exportImage();
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async startGeometryEditor(options) {
        const validated = validateGeometryEditorOptions(options);
        try {
          await requireHandle(nativeRef.current).startGeometryEditor(validated);
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async stopGeometryEditor() {
        try {
          return await requireHandle(nativeRef.current).stopGeometryEditor();
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async startNavigation(stops, options) {
        if (!Array.isArray(stops) || stops.length < 2) {
          throw toArcgisError(
            { code: 'E_INVALID_ARGUMENT', message: 'startNavigation requires at least two stops.' },
            'E_INVALID_ARGUMENT'
          );
        }
        const validated = stops.map(validateGeographicPoint);
        try {
          await requireHandle(nativeRef.current).startNavigation({
            stops: validated,
            reroute: options?.reroute ?? false,
          });
        } catch (error) {
          throw toArcgisError(error);
        }
      },
      async stopNavigation() {
        try {
          await requireHandle(nativeRef.current).stopNavigation();
        } catch (error) {
          throw toArcgisError(error);
        }
      },
    }),
    []
  );

  if (!normalized.ok) {
    // Nothing valid to render; the error was reported via onMapError.
    return null;
  }

  return <NativeView {...rest} map={normalized.value} onMapError={onMapError} ref={nativeRef} />;
}

/** Throws a stable error when the native handle is unavailable. */
function requireHandle(handle: NativeViewHandle | null): NativeViewHandle {
  if (handle === null) {
    throw toArcgisError(
      { code: 'E_NATIVE_FAILURE', message: 'The map view is not mounted.' },
      'E_NATIVE_FAILURE'
    );
  }
  return handle;
}

/**
 * Native ArcGIS 2D map view. See {@link ArcgisMapViewProps} and
 * {@link ArcgisMapViewRef}.
 */
export const ArcgisMapView = React.forwardRef<ArcgisMapViewRef, ArcgisMapViewProps>(
  ArcgisMapViewComponent
);
ArcgisMapView.displayName = 'ArcgisMapView';
