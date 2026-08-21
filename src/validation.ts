/**
 * Pure input validation and normalisation.
 *
 * These functions are the single boundary that turns loosely-typed caller input
 * into validated DTOs before anything is sent to native. They never touch the
 * native module, so they are trivially unit-testable. On invalid input they
 * throw an {@link ArcgisSdkError} with code `E_INVALID_ARGUMENT`.
 */

import { ArcgisSdkError } from './errors';
import type { ArcgisArViewProps, ArTrackingMode, ArViewMode } from './types/arView';
import type { AuthenticateOptions } from './types/auth';
import { BASEMAP_WORLDVIEWS, isBasemapStyle } from './types/basemap';
import type { BasemapStyleParameters } from './types/basemap';
import type { ClusteringOptions } from './types/cluster';
import { isArcgisColor } from './types/color';
import type { GeographicPoint } from './types/common';
import type { ConfigureArcgisOptions } from './types/config';
import type { ApplyEditsOptions, FeatureEdit } from './types/edit';
import type { GenerateGeodatabaseOptions, SyncGeodatabaseOptions } from './types/geodatabase';
import type { ArcgisGeometry } from './types/geometry';
import type { GeoprocessingInput, GeoprocessingJobOptions } from './types/geoprocessing';
import type { GraphicSource } from './types/graphics';
import type { ArcadeEvaluationOptions, IdentifyOptions } from './types/identify';
import type { CreateKmlFileOptions } from './types/kml';
import type { LabelDefinition, LabelPlacement } from './types/label';
import type {
  ArcgisLayerSource,
  ArcgisNonGroupLayerSource,
  DynamicEntityLayerSource,
  EncLayerSource,
  FeatureCollectionField,
  FeatureCollectionQueryLayerSource,
  BlendRasterRenderer,
  KmlTourOptions,
  RasterMosaicRule,
  RgbRasterRenderer,
  StretchRasterRenderer,
} from './types/layer';
import type { ArcgisMapSource, FeatureLayerSource, MapGeotrigger } from './types/map';
import type {
  ExportVectorTilesOptions,
  GeographicEnvelope,
  OfflineMapJobOptions,
} from './types/offline';
import type {
  FeatureQueryOptions,
  QueryExtentOptions,
  QueryStatisticsOptions,
  RelatedFeaturesOptions,
  SelectFeaturesOptions,
  StatisticDefinition,
  StatisticType,
} from './types/query';
import type { ArcgisRenderer, ScaledSymbol } from './types/renderer';
import type {
  ArcgisSceneSource,
  Camera,
  ElevationSource,
  SceneAnalysis,
  SceneExtrusion,
  SceneGraphicsOverlay,
  SceneImageOverlay,
  SceneLayerPolygonFilter,
  SceneLayerSource,
  WebSceneLayerLabels,
} from './types/scene';
import type { ArcgisSymbol, DistanceSymbolRange, MultilayerStrokeLayer } from './types/symbol';
import type {
  GetUtilityAssociationsOptions,
  TraceUtilityNetworkOptions,
  UtilityFeatureSelector,
  ValidateUtilityNetworkTopologyOptions,
} from './types/utilityNetwork';
import type { GeometryEditorOptions } from './types/view';
import type { Viewpoint, ViewpointAnimationOptions } from './types/viewpoint';

function invalid(message: string, details?: Record<string, unknown>): never {
  throw new ArcgisSdkError('E_INVALID_ARGUMENT', message, details);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Validate global configuration options. Returns a normalized copy. */
export function validateConfigureOptions(options: ConfigureArcgisOptions): ConfigureArcgisOptions {
  if (typeof options !== 'object' || options === null) {
    invalid('configureArcgis requires an options object.');
  }
  const { apiKey } = options;
  if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    // Never echo the key value, even when it is the problem.
    invalid('configureArcgis requires a non-empty "apiKey" string.');
  }
  return { apiKey };
}

/** Validate a geographic point and return a normalized copy. */
export function validateGeographicPoint(point: GeographicPoint): GeographicPoint {
  if (typeof point !== 'object' || point === null) {
    invalid('A geographic point object is required.');
  }
  if (!isFiniteNumber(point.latitude) || point.latitude < -90 || point.latitude > 90) {
    invalid('latitude must be a finite number between -90 and 90.', { latitude: point.latitude });
  }
  if (!isFiniteNumber(point.longitude) || point.longitude < -180 || point.longitude > 180) {
    invalid('longitude must be a finite number between -180 and 180.', {
      longitude: point.longitude,
    });
  }
  const normalized: GeographicPoint = { latitude: point.latitude, longitude: point.longitude };
  if (point.altitude !== undefined) {
    if (!isFiniteNumber(point.altitude)) {
      invalid('altitude, when provided, must be a finite number (meters).');
    }
    normalized.altitude = point.altitude;
  }
  if (point.spatialReference !== undefined) {
    if (!isFiniteNumber(point.spatialReference.wkid)) {
      invalid('spatialReference.wkid must be a number.');
    }
    normalized.spatialReference = point.spatialReference;
  }
  return normalized;
}

/** Validate a viewpoint and return a normalized copy. */
export function validateViewpoint(viewpoint: Viewpoint): Viewpoint {
  if (typeof viewpoint !== 'object' || viewpoint === null) {
    invalid('A viewpoint object is required.');
  }
  const normalized: Viewpoint = { center: validateGeographicPoint(viewpoint.center) };
  if (viewpoint.scale !== undefined) {
    if (!isFiniteNumber(viewpoint.scale) || viewpoint.scale <= 0) {
      invalid('viewpoint.scale must be a positive number.', { scale: viewpoint.scale });
    }
    normalized.scale = viewpoint.scale;
  }
  if (viewpoint.rotation !== undefined) {
    if (!isFiniteNumber(viewpoint.rotation)) {
      invalid('viewpoint.rotation must be a finite number (degrees).');
    }
    normalized.rotation = viewpoint.rotation;
  }
  return normalized;
}

/** Validate viewpoint animation options and return a normalized copy. */
export function validateViewpointAnimationOptions(
  options: ViewpointAnimationOptions = {}
): ViewpointAnimationOptions {
  if (options.durationMs === undefined) {
    return {};
  }
  if (!isFiniteNumber(options.durationMs) || options.durationMs < 0) {
    invalid('durationMs must be a non-negative number of milliseconds.', {
      durationMs: options.durationMs,
    });
  }
  return { durationMs: options.durationMs };
}

function nonEmptyString(value: unknown, message: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    invalid(message);
  }
  return value as string;
}

function validateLayer(layer: ArcgisLayerSource, seenIds: Set<string>): ArcgisLayerSource {
  if (typeof layer !== 'object' || layer === null) {
    invalid('Each layer must be an object.');
  }
  const id = nonEmptyString(layer.id, 'Each layer requires a non-empty string "id".');
  if (seenIds.has(id)) {
    invalid(`Duplicate layer id "${id}". Layer ids must be unique.`, { id });
  }
  seenIds.add(id);

  // Common fields.
  const common: { id: string; visible?: boolean; opacity?: number } = { id };
  if (layer.visible !== undefined) {
    if (typeof layer.visible !== 'boolean') {
      invalid(`Layer "${id}" visible must be a boolean.`, { id });
    }
    common.visible = layer.visible;
  }
  if (layer.opacity !== undefined) {
    if (!isFiniteNumber(layer.opacity) || layer.opacity < 0 || layer.opacity > 1) {
      invalid(`Layer "${id}" opacity must be between 0 and 1.`, { id });
    }
    common.opacity = layer.opacity;
  }

  const ctx = `Layer "${id}"`;
  switch (layer.type) {
    case 'tiled':
      return {
        ...common,
        type: 'tiled',
        url: nonEmptyString(layer.url, `${ctx} requires a "url".`),
      };
    case 'vectorTiled':
      return {
        ...common,
        type: 'vectorTiled',
        url: nonEmptyString(layer.url, `${ctx} requires a "url".`),
      };
    case 'mapImage': {
      const result: ArcgisLayerSource = {
        ...common,
        type: 'mapImage',
        url: nonEmptyString(layer.url, `${ctx} requires a "url".`),
      };
      if (layer.sublayerVisibility !== undefined) {
        if (!Array.isArray(layer.sublayerVisibility)) {
          invalid(`${ctx} sublayerVisibility must be an array.`);
        }
        result.sublayerVisibility = layer.sublayerVisibility.map((s) => {
          if (!Number.isInteger(s.sublayerId) || typeof s.visible !== 'boolean') {
            invalid(`${ctx} sublayerVisibility needs integer "sublayerId" and boolean "visible".`);
          }
          return { sublayerId: s.sublayerId, visible: s.visible };
        });
      }
      if (layer.sublayerRenderers !== undefined) {
        if (!Array.isArray(layer.sublayerRenderers)) {
          invalid(`${ctx} sublayerRenderers must be an array.`);
        }
        result.sublayerRenderers = layer.sublayerRenderers.map((s) => {
          if (!Number.isInteger(s.sublayerId)) {
            invalid(`${ctx} sublayerRenderers needs an integer "sublayerId".`);
          }
          return {
            sublayerId: s.sublayerId,
            renderer: validateRenderer(s.renderer, `${ctx} sublayer ${s.sublayerId}`),
          };
        });
      }
      return result;
    }
    case 'openStreetMap':
      return { ...common, type: 'openStreetMap' };
    case 'webTiled': {
      const result: ArcgisLayerSource = {
        ...common,
        type: 'webTiled',
        urlTemplate: nonEmptyString(layer.urlTemplate, `${ctx} requires a "urlTemplate".`),
      };
      if (layer.subDomains !== undefined) {
        if (
          !Array.isArray(layer.subDomains) ||
          layer.subDomains.some((s) => typeof s !== 'string')
        ) {
          invalid(`${ctx} subDomains must be an array of strings.`);
        }
        result.subDomains = layer.subDomains;
      }
      return result;
    }
    case 'wms': {
      if (!Array.isArray(layer.layerNames) || layer.layerNames.length === 0) {
        invalid(`${ctx} requires a non-empty "layerNames" array.`);
      }
      const result: ArcgisLayerSource = {
        ...common,
        type: 'wms',
        url: nonEmptyString(layer.url, `${ctx} requires a "url".`),
        layerNames: layer.layerNames.map((n) =>
          nonEmptyString(n, `${ctx} layerNames must be non-empty strings.`)
        ),
      };
      if (layer.styleName !== undefined) {
        result.styleName = nonEmptyString(
          layer.styleName,
          `${ctx} styleName must be a non-empty string.`
        );
      }
      return result;
    }
    case 'wfs': {
      const result: ArcgisLayerSource = {
        ...common,
        type: 'wfs',
        url: nonEmptyString(layer.url, `${ctx} requires a "url".`),
        tableName: nonEmptyString(layer.tableName, `${ctx} requires a "tableName".`),
      };
      if (layer.xmlQuery !== undefined) {
        result.xmlQuery = nonEmptyString(
          layer.xmlQuery,
          `${ctx} xmlQuery must be a non-empty string.`
        );
      }
      return result;
    }
    case 'ogcFeature': {
      const result: ArcgisLayerSource = {
        ...common,
        type: 'ogcFeature',
        url: nonEmptyString(layer.url, `${ctx} requires a "url".`),
        collectionId: nonEmptyString(layer.collectionId, `${ctx} requires a "collectionId".`),
      };
      if (layer.cqlFilter !== undefined) {
        if (typeof layer.cqlFilter !== 'string') {
          invalid(`${ctx} cqlFilter must be a string.`);
        }
        result.cqlFilter = layer.cqlFilter;
      }
      return result;
    }
    case 'wmts':
      return {
        ...common,
        type: 'wmts',
        url: nonEmptyString(layer.url, `${ctx} requires a "url".`),
        layerId: nonEmptyString(layer.layerId, `${ctx} requires a "layerId".`),
      };
    case 'featureCollection':
      return {
        ...common,
        type: 'featureCollection',
        portalItemId: nonEmptyString(layer.portalItemId, `${ctx} requires a "portalItemId".`),
      };
    case 'featureCollectionFromTable': {
      if (!Array.isArray(layer.fields) || layer.fields.length === 0) {
        invalid(`${ctx} requires a non-empty "fields" array.`);
      }
      if (!Array.isArray(layer.features)) {
        invalid(`${ctx} requires a "features" array.`);
      }
      const fields: FeatureCollectionField[] = layer.fields.map((f) => ({
        name: nonEmptyString(f.name, `${ctx} field requires a "name".`),
        type: f.type === 'integer' || f.type === 'double' ? f.type : 'text',
      }));
      const features = layer.features.map((f) => ({
        point: validateGeographicPoint(f.point),
        attributes: f.attributes ?? {},
      }));
      return { ...common, type: 'featureCollectionFromTable', fields, features };
    }
    case 'kml': {
      const result: ArcgisLayerSource = {
        ...common,
        type: 'kml',
        url: nonEmptyString(layer.url, `${ctx} requires a "url".`),
      };
      if (layer.groundOverlayOpacity !== undefined) {
        if (
          !isFiniteNumber(layer.groundOverlayOpacity) ||
          layer.groundOverlayOpacity < 0 ||
          layer.groundOverlayOpacity > 1
        ) {
          invalid(`${ctx} groundOverlayOpacity must be between 0 and 1.`);
        }
        result.groundOverlayOpacity = layer.groundOverlayOpacity;
      }
      return result;
    }
    case 'raster': {
      if (!layer.url && !layer.path) {
        invalid(`${ctx} requires a "url" (image service) or a "path" (local file).`);
      }
      const result: ArcgisLayerSource = {
        ...common,
        type: 'raster',
        ...(layer.url !== undefined ? { url: nonEmptyString(layer.url, `${ctx} url`) } : {}),
        ...(layer.path !== undefined ? { path: nonEmptyString(layer.path, `${ctx} path`) } : {}),
      };
      if (layer.rasterFunction !== undefined) {
        result.rasterFunction = nonEmptyString(
          layer.rasterFunction,
          `${ctx} rasterFunction must be a non-empty JSON string.`
        );
      }
      if (layer.renderingRule !== undefined) {
        if (!layer.url) {
          invalid(`${ctx} renderingRule requires a "url" (image service).`);
        }
        result.renderingRule = nonEmptyString(
          layer.renderingRule,
          `${ctx} renderingRule must be a non-empty rule name.`
        );
      }
      if (layer.hillshade !== undefined) {
        const h = layer.hillshade;
        for (const [k, v] of Object.entries(h)) {
          if (v !== undefined && !isFiniteNumber(v)) {
            invalid(`${ctx} hillshade.${k} must be a finite number.`);
          }
        }
        result.hillshade = h;
      }
      const checkStretch = (s: Record<string, unknown>) => {
        const stretchTypes = ['minMax', 'percentClip', 'standardDeviation'];
        if (!stretchTypes.includes(String(s.type))) {
          invalid(`${ctx} stretch.type must be one of ${stretchTypes.join(', ')}.`);
        }
        for (const [k, v] of Object.entries(s)) {
          if (k !== 'type' && !isFiniteNumber(v)) {
            invalid(`${ctx} stretch.${k} must be a finite number.`);
          }
        }
      };
      if (layer.stretch !== undefined) {
        checkStretch(layer.stretch as Record<string, unknown>);
        result.stretch = layer.stretch;
      }
      if (layer.rgb !== undefined) {
        const rgb = layer.rgb as { stretch?: unknown; bandIndices?: unknown };
        const normalized: RgbRasterRenderer = {};
        if (rgb.stretch !== undefined) {
          checkStretch(rgb.stretch as Record<string, unknown>);
          normalized.stretch = rgb.stretch as StretchRasterRenderer;
        }
        if (rgb.bandIndices !== undefined) {
          const b = rgb.bandIndices;
          if (
            !Array.isArray(b) ||
            b.length !== 3 ||
            !b.every((n) => Number.isInteger(n) && n >= 0)
          ) {
            invalid(`${ctx} rgb.bandIndices must be three non-negative integers.`);
          }
          normalized.bandIndices = b as [number, number, number];
        }
        result.rgb = normalized;
      }
      if (layer.colormap !== undefined) {
        const cm = layer.colormap as { colors?: unknown };
        if (
          !Array.isArray(cm.colors) ||
          cm.colors.length === 0 ||
          !cm.colors.every((c) => isArcgisColor(c))
        ) {
          invalid(`${ctx} colormap.colors must be a non-empty array of hex colours.`);
        }
        result.colormap = { colors: cm.colors as string[] };
      }
      if (layer.blend !== undefined) {
        const blend = layer.blend as Record<string, unknown>;
        if (!blend.elevationPath && !blend.elevationUrl) {
          invalid(`${ctx} blend requires an "elevationPath" or "elevationUrl".`);
        }
        const normalized: BlendRasterRenderer = {};
        if (blend.elevationPath !== undefined) {
          normalized.elevationPath = nonEmptyString(
            blend.elevationPath,
            `${ctx} blend.elevationPath`
          );
        }
        if (blend.elevationUrl !== undefined) {
          normalized.elevationUrl = nonEmptyString(blend.elevationUrl, `${ctx} blend.elevationUrl`);
        }
        for (const k of ['altitudeDegrees', 'azimuthDegrees', 'zFactor'] as const) {
          if (blend[k] !== undefined) {
            if (!isFiniteNumber(blend[k])) {
              invalid(`${ctx} blend.${k} must be a finite number.`);
            }
            normalized[k] = blend[k] as number;
          }
        }
        if (blend.colorRamp !== undefined) {
          if (!['elevation', 'demScreen', 'demLight'].includes(String(blend.colorRamp))) {
            invalid(`${ctx} blend.colorRamp must be one of 'elevation', 'demScreen', 'demLight'.`);
          }
          normalized.colorRamp = blend.colorRamp as BlendRasterRenderer['colorRamp'];
        }
        result.blend = normalized;
      }
      if (layer.mosaicRule !== undefined) {
        if (!layer.url) {
          invalid(`${ctx} mosaicRule requires a "url" (image service).`);
        }
        const rule = layer.mosaicRule as Record<string, unknown>;
        const normalized: RasterMosaicRule = {};
        if (rule.method !== undefined) {
          const methods = [
            'objectID',
            'center',
            'northwest',
            'nadir',
            'viewpoint',
            'attribute',
            'seamline',
          ];
          if (!methods.includes(String(rule.method))) {
            invalid(`${ctx} mosaicRule.method must be one of ${methods.join(', ')}.`);
          }
          normalized.method = rule.method as RasterMosaicRule['method'];
        }
        if (rule.operation !== undefined) {
          const ops = ['first', 'last', 'min', 'max', 'mean', 'blend', 'sum'];
          if (!ops.includes(String(rule.operation))) {
            invalid(`${ctx} mosaicRule.operation must be one of ${ops.join(', ')}.`);
          }
          normalized.operation = rule.operation as RasterMosaicRule['operation'];
        }
        if (rule.ascending !== undefined) {
          if (typeof rule.ascending !== 'boolean') {
            invalid(`${ctx} mosaicRule.ascending must be a boolean.`);
          }
          normalized.ascending = rule.ascending;
        }
        if (rule.sortField !== undefined) {
          normalized.sortField = nonEmptyString(rule.sortField, `${ctx} mosaicRule.sortField`);
        }
        if (rule.sortValue !== undefined) {
          normalized.sortValue = nonEmptyString(rule.sortValue, `${ctx} mosaicRule.sortValue`);
        }
        result.mosaicRule = normalized;
      }
      return result;
    }
    case 'shapefile': {
      const result: ArcgisLayerSource = {
        ...common,
        type: 'shapefile',
        path: nonEmptyString(layer.path, `${ctx} requires a "path".`),
      };
      if (layer.renderer !== undefined) {
        result.renderer = validateRenderer(layer.renderer, ctx);
      }
      return result;
    }
    case 'enc': {
      const result: EncLayerSource = {
        ...common,
        type: 'enc',
        path: nonEmptyString(layer.path, `${ctx} requires a "path" (ENC exchange set catalog).`),
      };
      if (layer.resourcePath !== undefined) {
        result.resourcePath = nonEmptyString(
          layer.resourcePath,
          `${ctx} resourcePath must be a non-empty string.`
        );
      }
      if (layer.sencPath !== undefined) {
        result.sencPath = nonEmptyString(
          layer.sencPath,
          `${ctx} sencPath must be a non-empty string.`
        );
      }
      return result;
    }
    case 'geoPackage': {
      const result: ArcgisLayerSource = {
        ...common,
        type: 'geoPackage',
        path: nonEmptyString(layer.path, `${ctx} requires a "path".`),
      };
      if (layer.tableIndex !== undefined) {
        if (!Number.isInteger(layer.tableIndex) || layer.tableIndex < 0) {
          invalid(`${ctx} tableIndex must be a non-negative integer.`);
        }
        result.tableIndex = layer.tableIndex;
      }
      return result;
    }
    case 'annotation': {
      const result: ArcgisLayerSource = {
        ...common,
        type: 'annotation',
        url: nonEmptyString(layer.url, `${ctx} requires a "url".`),
      };
      if (layer.sublayerVisibility !== undefined) {
        if (!Array.isArray(layer.sublayerVisibility)) {
          invalid(`${ctx} sublayerVisibility must be an array of { name, visible }.`);
        }
        result.sublayerVisibility = layer.sublayerVisibility.map((entry) => {
          if (typeof entry !== 'object' || entry === null || typeof entry.visible !== 'boolean') {
            invalid(`${ctx} each sublayerVisibility entry needs a "name" and boolean "visible".`);
          }
          return {
            name: nonEmptyString(entry.name, `${ctx} sublayerVisibility entry requires a "name".`),
            visible: entry.visible,
          };
        });
      }
      return result;
    }
    case 'dimension':
    case 'subtypeFeature':
      return {
        ...common,
        type: layer.type,
        url: nonEmptyString(layer.url, `${ctx} requires a "url".`),
      };
    case 'dynamicEntity': {
      const result: DynamicEntityLayerSource = { ...common, type: 'dynamicEntity' };
      if (layer.customFeed !== undefined) {
        const feed = layer.customFeed;
        if (typeof feed !== 'object' || feed === null) {
          invalid(`${ctx} "customFeed" must be an object.`);
        }
        const perSecond = feed.observationsPerSecond;
        if (perSecond !== undefined && (!isFiniteNumber(perSecond) || perSecond <= 0)) {
          invalid(`${ctx} "customFeed.observationsPerSecond" must be a positive number.`);
        }
        result.customFeed = {
          observationsPath: nonEmptyString(
            feed.observationsPath,
            `${ctx} "customFeed" requires an "observationsPath".`
          ),
          entityIdField: nonEmptyString(
            feed.entityIdField,
            `${ctx} "customFeed" requires an "entityIdField".`
          ),
          longitudeField: nonEmptyString(
            feed.longitudeField,
            `${ctx} "customFeed" requires a "longitudeField".`
          ),
          latitudeField: nonEmptyString(
            feed.latitudeField,
            `${ctx} "customFeed" requires a "latitudeField".`
          ),
          ...(perSecond !== undefined ? { observationsPerSecond: perSecond } : {}),
        };
      } else {
        result.url = nonEmptyString(
          layer.url,
          `${ctx} requires a "url" (stream service) or a "customFeed".`
        );
      }
      return result;
    }
    case 'featureCollectionFromQuery': {
      const result: FeatureCollectionQueryLayerSource = {
        ...common,
        type: 'featureCollectionFromQuery',
        url: nonEmptyString(layer.url, `${ctx} requires a "url".`),
      };
      if (layer.where !== undefined) {
        if (typeof layer.where !== 'string') {
          invalid(`${ctx} where must be a string.`);
        }
        result.where = layer.where;
      }
      return result;
    }
    case 'group': {
      if (!Array.isArray(layer.sublayers) || layer.sublayers.length === 0) {
        invalid(`${ctx} requires a non-empty "sublayers" array.`);
      }
      const sublayers = layer.sublayers.map((s) => {
        if ((s as { type?: unknown }).type === 'group') {
          invalid(`${ctx} sublayers cannot be groups (nested groups are not supported).`);
        }
        return validateLayer(s, seenIds);
      }) as ArcgisNonGroupLayerSource[];
      return { ...common, type: 'group', sublayers };
    }
    default:
      return invalid(
        `${ctx} unsupported layer type "${String((layer as { type?: unknown }).type)}".`
      );
  }
}

function validateFeatureLayer(layer: FeatureLayerSource, seenIds: Set<string>): FeatureLayerSource {
  if (typeof layer !== 'object' || layer === null) {
    invalid('Each feature layer must be an object.');
  }
  if (typeof layer.id !== 'string' || layer.id.length === 0) {
    invalid('Each feature layer requires a non-empty string "id".');
  }
  if (seenIds.has(layer.id)) {
    invalid(`Duplicate feature layer id "${layer.id}". Layer ids must be unique.`, {
      id: layer.id,
    });
  }
  seenIds.add(layer.id);
  if (typeof layer.url !== 'string' || layer.url.length === 0) {
    invalid(`Feature layer "${layer.id}" requires a non-empty "url".`, { id: layer.id });
  }
  const normalized: FeatureLayerSource = { id: layer.id, url: layer.url };
  if (layer.visible !== undefined) {
    if (typeof layer.visible !== 'boolean') {
      invalid(`Feature layer "${layer.id}" visible must be a boolean.`, { id: layer.id });
    }
    normalized.visible = layer.visible;
  }
  if (layer.opacity !== undefined) {
    if (!isFiniteNumber(layer.opacity) || layer.opacity < 0 || layer.opacity > 1) {
      invalid(`Feature layer "${layer.id}" opacity must be between 0 and 1.`, { id: layer.id });
    }
    normalized.opacity = layer.opacity;
  }
  if (layer.renderer !== undefined) {
    normalized.renderer = validateRenderer(layer.renderer, `Feature layer "${layer.id}"`);
  }
  if (layer.definitionExpression !== undefined) {
    if (typeof layer.definitionExpression !== 'string') {
      invalid(`Feature layer "${layer.id}" definitionExpression must be a string.`, {
        id: layer.id,
      });
    }
    normalized.definitionExpression = layer.definitionExpression;
  }
  if (layer.labels !== undefined) {
    if (!Array.isArray(layer.labels)) {
      invalid(`Feature layer "${layer.id}" labels must be an array.`, { id: layer.id });
    }
    normalized.labels = layer.labels.map((l) => validateLabel(l, `Feature layer "${layer.id}"`));
  }
  if (layer.clustering !== undefined) {
    normalized.clustering = validateClustering(layer.clustering, `Feature layer "${layer.id}"`);
  }
  return normalized;
}

function validateLabel(label: LabelDefinition, context: string): LabelDefinition {
  if (typeof label !== 'object' || label === null) {
    invalid(`${context} label must be an object.`);
  }
  if (typeof label.expression !== 'string' || label.expression.length === 0) {
    invalid(`${context} label requires a non-empty "expression".`);
  }
  const normalized: LabelDefinition = { expression: label.expression };
  if (label.arcade !== undefined) {
    if (typeof label.arcade !== 'boolean') {
      invalid(`${context} label.arcade must be a boolean.`);
    }
    normalized.arcade = label.arcade;
  }
  if (label.color !== undefined) {
    if (!isArcgisColor(label.color)) {
      invalid(`${context} label.color must be a hex color string.`);
    }
    normalized.color = label.color;
  }
  const size = validatePositive(label.size, `${context} label.size`);
  if (size !== undefined) {
    normalized.size = size;
  }
  if (label.haloColor !== undefined) {
    if (!isArcgisColor(label.haloColor)) {
      invalid(`${context} label.haloColor must be a hex color string.`);
    }
    normalized.haloColor = label.haloColor;
  }
  if (label.haloWidth !== undefined) {
    if (!isFiniteNumber(label.haloWidth) || label.haloWidth < 0) {
      invalid(`${context} label.haloWidth must be a non-negative number.`);
    }
    normalized.haloWidth = label.haloWidth;
  }
  if (label.placement !== undefined) {
    if (!LABEL_PLACEMENTS.includes(label.placement)) {
      invalid(`${context} label.placement must be one of: ${LABEL_PLACEMENTS.join(', ')}.`);
    }
    normalized.placement = label.placement;
  }
  return normalized;
}

const LABEL_PLACEMENTS: LabelPlacement[] = [
  'lineAboveAlong',
  'lineBelowAlong',
  'lineCenterAlong',
  'pointAboveCenter',
  'pointBelowCenter',
  'pointCenterCenter',
  'pointAboveRight',
  'polygonAlwaysHorizontal',
];

function validateClustering(clustering: ClusteringOptions, context: string): ClusteringOptions {
  if (typeof clustering !== 'object' || clustering === null) {
    invalid(`${context} clustering must be an object.`);
  }
  if (typeof clustering.enabled !== 'boolean') {
    invalid(`${context} clustering requires a boolean "enabled".`);
  }
  const normalized: ClusteringOptions = { enabled: clustering.enabled };
  const radius = validatePositive(clustering.radius, `${context} clustering.radius`);
  if (radius !== undefined) {
    normalized.radius = radius;
  }
  const maxSymbolSize = validatePositive(
    clustering.maxSymbolSize,
    `${context} clustering.maxSymbolSize`
  );
  if (maxSymbolSize !== undefined) {
    normalized.maxSymbolSize = maxSymbolSize;
  }
  if (clustering.color !== undefined) {
    if (!isArcgisColor(clustering.color)) {
      invalid(`${context} clustering.color must be a hex color string.`);
    }
    normalized.color = clustering.color;
  }
  return normalized;
}

/** Validate an {@link ArcgisGeometry} and return a normalized copy. */
export function validateArcgisGeometry(geometry: ArcgisGeometry): ArcgisGeometry {
  return validateGeometry(geometry);
}

function validateGeometry(geometry: ArcgisGeometry): ArcgisGeometry {
  if (typeof geometry !== 'object' || geometry === null) {
    invalid('A graphic requires a geometry object.');
  }
  switch (geometry.type) {
    case 'point':
      return { type: 'point', point: validateGeographicPoint(geometry.point) };
    case 'polyline': {
      if (!Array.isArray(geometry.path) || geometry.path.length < 2) {
        invalid('A polyline geometry requires a "path" of at least 2 points.');
      }
      return { type: 'polyline', path: geometry.path.map(validateGeographicPoint) };
    }
    case 'polygon': {
      if (!Array.isArray(geometry.ring) || geometry.ring.length < 3) {
        invalid('A polygon geometry requires a "ring" of at least 3 points.');
      }
      return { type: 'polygon', ring: geometry.ring.map(validateGeographicPoint) };
    }
    default:
      return invalid(
        `Unsupported geometry type "${String((geometry as { type?: unknown }).type)}".`
      );
  }
}

function validatePositive(value: number | undefined, name: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isFiniteNumber(value) || value <= 0) {
    invalid(`${name} must be a positive number.`, { [name]: value });
  }
  return value;
}

function validateStrokeLayers(layers: unknown, ctx: string): MultilayerStrokeLayer[] {
  if (!Array.isArray(layers) || layers.length === 0) {
    invalid(`${ctx} requires a non-empty "strokeLayers" array.`);
  }
  return layers.map((layer) => {
    if (!isArcgisColor((layer as MultilayerStrokeLayer).color)) {
      invalid(`${ctx} stroke layer color must be a hex color string.`);
    }
    const widthPoints = validatePositive(
      (layer as MultilayerStrokeLayer).widthPoints,
      `${ctx} stroke layer widthPoints`
    );
    if (widthPoints === undefined) {
      invalid(`${ctx} stroke layer requires a positive "widthPoints".`);
    }
    return { color: (layer as MultilayerStrokeLayer).color, widthPoints };
  });
}

function validateSymbol(symbol: ArcgisSymbol): ArcgisSymbol {
  if (typeof symbol !== 'object' || symbol === null) {
    invalid('A graphic requires a symbol object.');
  }
  if (symbol.type === 'multilayerPolyline') {
    return {
      type: 'multilayerPolyline',
      strokeLayers: validateStrokeLayers(symbol.strokeLayers, 'multilayerPolyline'),
    };
  }
  if (symbol.type === 'webStyle') {
    const symbolKey = nonEmptyString(symbol.symbolKey, 'webStyle symbol requires a "symbolKey".');
    const sources = [symbol.styleName, symbol.portalItemId, symbol.stylxPath].filter(
      (s) => typeof s === 'string' && s.length > 0
    );
    if (sources.length !== 1) {
      invalid(
        'webStyle symbol requires exactly one of "styleName", "portalItemId", or "stylxPath".'
      );
    }
    let symbolKeys: string[] | undefined;
    if (symbol.symbolKeys !== undefined) {
      if (
        !Array.isArray(symbol.symbolKeys) ||
        symbol.symbolKeys.length === 0 ||
        !symbol.symbolKeys.every((k) => typeof k === 'string' && k.length > 0)
      ) {
        invalid('webStyle symbol "symbolKeys" must be a non-empty array of non-empty strings.');
      }
      symbolKeys = symbol.symbolKeys;
    }
    return {
      type: 'webStyle',
      symbolKey,
      ...(symbolKeys !== undefined ? { symbolKeys } : {}),
      ...(symbol.styleName !== undefined ? { styleName: symbol.styleName } : {}),
      ...(symbol.portalItemId !== undefined ? { portalItemId: symbol.portalItemId } : {}),
      ...(symbol.stylxPath !== undefined ? { stylxPath: symbol.stylxPath } : {}),
    };
  }
  if (symbol.type === 'multilayerPolygon') {
    if (!isArcgisColor(symbol.fillColor)) {
      invalid('multilayerPolygon.fillColor must be a hex color string.');
    }
    return {
      type: 'multilayerPolygon',
      fillColor: symbol.fillColor,
      ...(symbol.strokeLayers !== undefined
        ? { strokeLayers: validateStrokeLayers(symbol.strokeLayers, 'multilayerPolygon') }
        : {}),
    };
  }
  if (symbol.type === 'distanceCompositeScene') {
    if (!Array.isArray(symbol.ranges) || symbol.ranges.length === 0) {
      invalid('distanceCompositeScene.ranges must be a non-empty array.');
    }
    const ranges: DistanceSymbolRange[] = symbol.ranges.map((r) => {
      if (typeof r !== 'object' || r === null) {
        invalid('Each distanceCompositeScene range must be an object.');
      }
      const inner = validateSymbol(r.symbol);
      if (inner.type !== 'simpleMarkerScene') {
        invalid("distanceCompositeScene range symbols must be 'simpleMarkerScene'.");
      }
      const range: DistanceSymbolRange = { symbol: inner };
      if (r.minDistance !== undefined) {
        if (!isFiniteNumber(r.minDistance) || r.minDistance < 0) {
          invalid('distanceCompositeScene range minDistance must be a non-negative number.');
        }
        range.minDistance = r.minDistance;
      }
      if (r.maxDistance !== undefined) {
        if (!isFiniteNumber(r.maxDistance) || r.maxDistance < 0) {
          invalid('distanceCompositeScene range maxDistance must be a non-negative number.');
        }
        range.maxDistance = r.maxDistance;
      }
      return range;
    });
    return { type: 'distanceCompositeScene', ranges };
  }
  if (!isArcgisColor(symbol.color)) {
    invalid('symbol.color must be a hex color string (#RRGGBB or #RRGGBBAA).');
  }
  switch (symbol.type) {
    case 'simpleMarker': {
      const size = validatePositive(symbol.size, 'symbol.size');
      return {
        type: 'simpleMarker',
        color: symbol.color,
        ...(size !== undefined ? { size } : {}),
        ...(symbol.style !== undefined ? { style: symbol.style } : {}),
      };
    }
    case 'simpleLine': {
      const width = validatePositive(symbol.width, 'symbol.width');
      return {
        type: 'simpleLine',
        color: symbol.color,
        ...(width !== undefined ? { width } : {}),
        ...(symbol.style !== undefined ? { style: symbol.style } : {}),
      };
    }
    case 'simpleFill': {
      const outline =
        symbol.outline !== undefined
          ? (validateSymbol(symbol.outline) as ArcgisSymbol & { type: 'simpleLine' })
          : undefined;
      if (outline !== undefined && outline.type !== 'simpleLine') {
        invalid('A simpleFill outline must be a simpleLine symbol.');
      }
      return {
        type: 'simpleFill',
        color: symbol.color,
        ...(symbol.style !== undefined ? { style: symbol.style } : {}),
        ...(outline !== undefined ? { outline } : {}),
      };
    }
    case 'simpleMarkerScene': {
      if (
        !['cone', 'cube', 'cylinder', 'diamond', 'sphere', 'tetrahedron'].includes(symbol.style)
      ) {
        invalid(
          "simpleMarkerScene.style must be one of 'cone', 'cube', 'cylinder', 'diamond', 'sphere', 'tetrahedron'."
        );
      }
      const height = validatePositive(symbol.height, 'symbol.height');
      const width = validatePositive(symbol.width, 'symbol.width');
      const depth = validatePositive(symbol.depth, 'symbol.depth');
      return {
        type: 'simpleMarkerScene',
        style: symbol.style,
        color: symbol.color,
        ...(height !== undefined ? { height } : {}),
        ...(width !== undefined ? { width } : {}),
        ...(depth !== undefined ? { depth } : {}),
      };
    }
    case 'meshFill': {
      if (!isArcgisColor(symbol.color)) {
        invalid('meshFill.color must be a hex color string.');
      }
      return { type: 'meshFill', color: symbol.color };
    }
    default:
      return invalid(`Unsupported symbol type "${String((symbol as { type?: unknown }).type)}".`);
  }
}

function validateScaledSymbols(value: unknown, context: string): ScaledSymbol[] {
  if (!Array.isArray(value) || value.length === 0) {
    invalid(`${context} alternateSymbols must be a non-empty array.`);
  }
  return value.map((entry) => {
    const scaled = entry as ScaledSymbol;
    const result: ScaledSymbol = { symbol: validateSymbol(scaled.symbol) };
    if (scaled.minScale !== undefined) {
      if (!isFiniteNumber(scaled.minScale) || scaled.minScale < 0) {
        invalid(`${context} alternate symbol minScale must be a non-negative number.`);
      }
      result.minScale = scaled.minScale;
    }
    if (scaled.maxScale !== undefined) {
      if (!isFiniteNumber(scaled.maxScale) || scaled.maxScale < 0) {
        invalid(`${context} alternate symbol maxScale must be a non-negative number.`);
      }
      result.maxScale = scaled.maxScale;
    }
    return result;
  });
}

function validateRenderer(renderer: ArcgisRenderer, context: string): ArcgisRenderer {
  if (typeof renderer !== 'object' || renderer === null) {
    invalid(`${context} renderer must be an object.`);
  }
  switch (renderer.type) {
    case 'simple':
      return { type: 'simple', symbol: validateSymbol(renderer.symbol) };
    case 'uniqueValue': {
      if (!Array.isArray(renderer.fields) || renderer.fields.length === 0) {
        invalid(`${context} uniqueValue renderer requires a non-empty "fields" array.`);
      }
      if (!Array.isArray(renderer.uniqueValues)) {
        invalid(`${context} uniqueValue renderer requires a "uniqueValues" array.`);
      }
      return {
        type: 'uniqueValue',
        fields: renderer.fields.map((f) => {
          if (typeof f !== 'string' || f.length === 0) {
            invalid(`${context} uniqueValue renderer "fields" must be non-empty strings.`);
          }
          return f;
        }),
        uniqueValues: renderer.uniqueValues.map((uv) => {
          if (!Array.isArray(uv.values) || uv.values.length === 0) {
            invalid(`${context} uniqueValue class requires a non-empty "values" array.`);
          }
          for (const v of uv.values) {
            if (typeof v !== 'string' && !isFiniteNumber(v)) {
              invalid(`${context} uniqueValue "values" must be strings or finite numbers.`);
            }
          }
          return {
            values: uv.values,
            symbol: validateSymbol(uv.symbol),
            ...(uv.label !== undefined ? { label: uv.label } : {}),
            ...(uv.alternateSymbols !== undefined
              ? { alternateSymbols: validateScaledSymbols(uv.alternateSymbols, context) }
              : {}),
          };
        }),
        ...(renderer.defaultSymbol !== undefined
          ? { defaultSymbol: validateSymbol(renderer.defaultSymbol) }
          : {}),
      };
    }
    case 'classBreaks': {
      if (typeof renderer.field !== 'string' || renderer.field.length === 0) {
        invalid(`${context} classBreaks renderer requires a non-empty "field".`);
      }
      if (!Array.isArray(renderer.classBreaks) || renderer.classBreaks.length === 0) {
        invalid(`${context} classBreaks renderer requires a non-empty "classBreaks" array.`);
      }
      return {
        type: 'classBreaks',
        field: renderer.field,
        classBreaks: renderer.classBreaks.map((cb) => {
          if (!isFiniteNumber(cb.maxValue)) {
            invalid(`${context} classBreak requires a finite "maxValue".`);
          }
          if (cb.minValue !== undefined && !isFiniteNumber(cb.minValue)) {
            invalid(`${context} classBreak "minValue" must be a finite number.`);
          }
          return {
            maxValue: cb.maxValue,
            ...(cb.minValue !== undefined ? { minValue: cb.minValue } : {}),
            symbol: validateSymbol(cb.symbol),
            ...(cb.label !== undefined ? { label: cb.label } : {}),
          };
        }),
        ...(renderer.defaultSymbol !== undefined
          ? { defaultSymbol: validateSymbol(renderer.defaultSymbol) }
          : {}),
      };
    }
    case 'dictionary': {
      const hasPortalItem =
        typeof renderer.portalItemId === 'string' && renderer.portalItemId.length > 0;
      const hasStylx = typeof renderer.stylxPath === 'string' && renderer.stylxPath.length > 0;
      if (hasPortalItem === hasStylx) {
        invalid(
          `${context} dictionary renderer requires exactly one of "portalItemId" or "stylxPath".`
        );
      }
      return {
        type: 'dictionary',
        ...(hasPortalItem ? { portalItemId: renderer.portalItemId } : {}),
        ...(hasStylx ? { stylxPath: renderer.stylxPath } : {}),
      };
    }
    default:
      return invalid(
        `${context} unsupported renderer type "${String((renderer as { type?: unknown }).type)}".`
      );
  }
}

/** Validates a graphic's attribute map: scalar (string/finite-number/boolean) values only. */
function validateAttributes(
  attributes: Record<string, string | number | boolean>,
  context: string
): Record<string, string | number | boolean> {
  if (typeof attributes !== 'object' || attributes === null || Array.isArray(attributes)) {
    invalid(`${context} attributes must be an object.`);
  }
  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === 'number') {
      if (!isFiniteNumber(value)) {
        invalid(`${context} attribute "${key}" must be a finite number.`);
      }
      result[key] = value;
    } else if (typeof value === 'string' || typeof value === 'boolean') {
      result[key] = value;
    } else {
      invalid(`${context} attribute "${key}" must be a string, finite number, or boolean.`);
    }
  }
  return result;
}

function validateGraphic(graphic: GraphicSource, seenIds: Set<string>): GraphicSource {
  if (typeof graphic !== 'object' || graphic === null) {
    invalid('Each graphic must be an object.');
  }
  if (typeof graphic.id !== 'string' || graphic.id.length === 0) {
    invalid('Each graphic requires a non-empty string "id".');
  }
  if (seenIds.has(graphic.id)) {
    invalid(`Duplicate graphic id "${graphic.id}". Graphic ids must be unique.`, {
      id: graphic.id,
    });
  }
  seenIds.add(graphic.id);
  const normalized: GraphicSource = {
    id: graphic.id,
    geometry: validateGeometry(graphic.geometry),
  };
  // A symbol is optional — omit it to let the overlay's shared renderer style it.
  if (graphic.symbol !== undefined) {
    normalized.symbol = validateSymbol(graphic.symbol);
  }
  if (graphic.attributes !== undefined) {
    normalized.attributes = validateAttributes(graphic.attributes, `Graphic "${graphic.id}"`);
  }
  return normalized;
}

/**
 * Validate a declarative map source and return a normalized copy.
 *
 * Enforces that `basemap` and `webMapItemId` are mutually exclusive, and that a
 * web map does not also declare `featureLayers`.
 */
export function validateMapSource(map: ArcgisMapSource): ArcgisMapSource {
  if (typeof map !== 'object' || map === null) {
    invalid('The "map" prop must be an object.');
  }

  const hasBasemap = map.basemap !== undefined;
  const hasWebMap = map.webMapItemId !== undefined;
  const hasMmpk = map.mobileMapPackagePath !== undefined;

  if ([hasBasemap, hasWebMap, hasMmpk].filter(Boolean).length > 1) {
    invalid('Provide only one of "basemap", "webMapItemId", or "mobileMapPackagePath".');
  }
  const definesOwnLayers = hasWebMap || hasMmpk;
  const source = hasMmpk ? 'a mobile map package' : 'a web map';
  if (definesOwnLayers && map.featureLayers !== undefined) {
    invalid(`"featureLayers" cannot be combined with ${source}; it defines its own layers.`);
  }
  if (definesOwnLayers && map.layers !== undefined) {
    invalid(`"layers" cannot be combined with ${source}; it defines its own layers.`);
  }

  const normalized: ArcgisMapSource = {};

  if (hasBasemap) {
    if (!isBasemapStyle(map.basemap)) {
      invalid(`Unsupported basemap "${String(map.basemap)}".`, { basemap: map.basemap });
    }
    normalized.basemap = map.basemap;
  }

  if (map.basemapLayer !== undefined) {
    const bl = map.basemapLayer;
    if (typeof bl !== 'object' || bl === null) {
      invalid('map.basemapLayer must be an object.');
    }
    if (bl.type !== 'tiled' && bl.type !== 'vectorTiled') {
      invalid('map.basemapLayer.type must be "tiled" or "vectorTiled".', { type: bl.type });
    }
    const hasUrl = typeof bl.url === 'string' && bl.url.length > 0;
    const hasItem = typeof bl.itemId === 'string' && bl.itemId.length > 0;
    if (hasUrl === hasItem) {
      invalid('map.basemapLayer requires exactly one of "url" or "itemId".');
    }
    normalized.basemapLayer = {
      type: bl.type,
      ...(hasUrl ? { url: bl.url } : {}),
      ...(hasItem ? { itemId: bl.itemId } : {}),
    };
  }

  if (map.basemapStyleParameters !== undefined) {
    const params = map.basemapStyleParameters;
    if (typeof params !== 'object' || params === null) {
      invalid('map.basemapStyleParameters must be an object.');
    }
    const normalizedParams: BasemapStyleParameters = {};
    if (params.worldview !== undefined) {
      if (!(BASEMAP_WORLDVIEWS as readonly string[]).includes(params.worldview)) {
        invalid(`Unsupported worldview "${String(params.worldview)}".`, {
          worldview: params.worldview,
        });
      }
      normalizedParams.worldview = params.worldview;
    }
    normalized.basemapStyleParameters = normalizedParams;
  }

  if (hasWebMap) {
    if (typeof map.webMapItemId !== 'string' || map.webMapItemId.length === 0) {
      invalid('"webMapItemId" must be a non-empty string.');
    }
    normalized.webMapItemId = map.webMapItemId;
  }

  if (hasMmpk) {
    normalized.mobileMapPackagePath = nonEmptyString(
      map.mobileMapPackagePath,
      '"mobileMapPackagePath" must be a non-empty string.'
    );
  }

  if (map.spatialReferenceWkid !== undefined) {
    if (!Number.isInteger(map.spatialReferenceWkid) || map.spatialReferenceWkid <= 0) {
      invalid('map.spatialReferenceWkid must be a positive integer WKID.', {
        spatialReferenceWkid: map.spatialReferenceWkid,
      });
    }
    normalized.spatialReferenceWkid = map.spatialReferenceWkid;
  }

  if (map.initialViewpoint !== undefined) {
    normalized.initialViewpoint = validateViewpoint(map.initialViewpoint);
  }

  if (map.featureLayers !== undefined) {
    if (!Array.isArray(map.featureLayers)) {
      invalid('"featureLayers" must be an array.');
    }
    const seenIds = new Set<string>();
    normalized.featureLayers = map.featureLayers.map((layer) =>
      validateFeatureLayer(layer, seenIds)
    );
  }

  if (map.layers !== undefined) {
    if (!Array.isArray(map.layers)) {
      invalid('"layers" must be an array.');
    }
    const seenIds = new Set<string>();
    normalized.layers = map.layers.map((layer) => validateLayer(layer, seenIds));
  }

  if (map.graphics !== undefined) {
    if (!Array.isArray(map.graphics)) {
      invalid('"graphics" must be an array.');
    }
    const seenIds = new Set<string>();
    normalized.graphics = map.graphics.map((graphic) => validateGraphic(graphic, seenIds));
  }
  if (map.graphicsRenderer !== undefined) {
    normalized.graphicsRenderer = validateRenderer(map.graphicsRenderer, 'graphicsRenderer');
  }
  if (map.floorLevel !== undefined) {
    if (!Number.isInteger(map.floorLevel)) {
      invalid('map.floorLevel must be an integer level number.');
    }
    normalized.floorLevel = map.floorLevel;
  }
  if (map.geotriggers !== undefined) {
    if (!Array.isArray(map.geotriggers)) {
      invalid('map.geotriggers must be an array.');
    }
    const geoIds = new Set<string>();
    normalized.geotriggers = map.geotriggers.map((geotrigger) => {
      if (typeof geotrigger !== 'object' || geotrigger === null) {
        invalid('Each geotrigger must be an object.');
      }
      const id = nonEmptyString(geotrigger.id, 'Each geotrigger requires a non-empty "id".');
      if (geoIds.has(id)) {
        invalid(`Duplicate geotrigger id "${id}".`, { id });
      }
      geoIds.add(id);
      const normalizedGeotrigger: MapGeotrigger = { id };
      if (geotrigger.bufferMeters !== undefined) {
        if (!isFiniteNumber(geotrigger.bufferMeters) || geotrigger.bufferMeters < 0) {
          invalid(`Geotrigger "${id}" bufferMeters must be a non-negative number.`);
        }
        normalizedGeotrigger.bufferMeters = geotrigger.bufferMeters;
      }
      if (geotrigger.ruleType !== undefined) {
        if (!['enter', 'exit', 'enterOrExit'].includes(geotrigger.ruleType)) {
          invalid(`Geotrigger "${id}" ruleType must be 'enter', 'exit', or 'enterOrExit'.`);
        }
        normalizedGeotrigger.ruleType = geotrigger.ruleType;
      }
      return normalizedGeotrigger;
    });
  }

  if (map.minScale !== undefined) {
    normalized.minScale = validatePositive(map.minScale, 'map.minScale');
  }
  if (map.maxScale !== undefined) {
    normalized.maxScale = validatePositive(map.maxScale, 'map.maxScale');
  }
  if (
    normalized.minScale !== undefined &&
    normalized.maxScale !== undefined &&
    normalized.maxScale > normalized.minScale
  ) {
    invalid('map.maxScale (most zoomed-in) must be less than or equal to map.minScale.', {
      minScale: normalized.minScale,
      maxScale: normalized.maxScale,
    });
  }
  if (map.referenceScale !== undefined) {
    normalized.referenceScale = validatePositive(map.referenceScale, 'map.referenceScale');
  }
  if (map.maxExtent !== undefined) {
    normalized.maxExtent = validateEnvelope(map.maxExtent, 'map.maxExtent');
  }
  if (map.backgroundColor !== undefined) {
    if (!isArcgisColor(map.backgroundColor)) {
      invalid('map.backgroundColor must be a hex color string (#RRGGBB or #RRGGBBAA).', {
        backgroundColor: map.backgroundColor,
      });
    }
    normalized.backgroundColor = map.backgroundColor;
  }

  return normalized;
}

function validateFeatureEdit(edit: FeatureEdit, requireObjectId: boolean): FeatureEdit {
  if (typeof edit !== 'object' || edit === null) {
    invalid('Each feature edit must be an object.');
  }
  const normalized: FeatureEdit = {};
  if (requireObjectId || edit.objectId !== undefined) {
    if (!Number.isInteger(edit.objectId)) {
      invalid('A feature update requires an integer "objectId".');
    }
    normalized.objectId = edit.objectId;
  }
  if (edit.attributes !== undefined) {
    if (typeof edit.attributes !== 'object' || edit.attributes === null) {
      invalid('feature edit "attributes" must be an object.');
    }
    normalized.attributes = edit.attributes;
  }
  if (edit.point !== undefined) {
    normalized.point = validateGeographicPoint(edit.point);
  }
  return normalized;
}

/** Validate apply-edits options and return a normalized copy. */
export function validateApplyEditsOptions(options: ApplyEditsOptions): ApplyEditsOptions {
  if (typeof options !== 'object' || options === null) {
    invalid('applyEdits requires an options object.');
  }
  if (typeof options.layerId !== 'string' || options.layerId.length === 0) {
    invalid('applyEdits requires a non-empty "layerId".');
  }
  const normalized: ApplyEditsOptions = { layerId: options.layerId };
  if (options.adds !== undefined) {
    if (!Array.isArray(options.adds)) {
      invalid('applyEdits "adds" must be an array.');
    }
    normalized.adds = options.adds.map((edit) => validateFeatureEdit(edit, false));
  }
  if (options.updates !== undefined) {
    if (!Array.isArray(options.updates)) {
      invalid('applyEdits "updates" must be an array.');
    }
    normalized.updates = options.updates.map((edit) => validateFeatureEdit(edit, true));
  }
  if (options.deleteObjectIds !== undefined) {
    if (
      !Array.isArray(options.deleteObjectIds) ||
      !options.deleteObjectIds.every((id) => Number.isInteger(id))
    ) {
      invalid('applyEdits "deleteObjectIds" must be an array of integers.');
    }
    normalized.deleteObjectIds = options.deleteObjectIds;
  }
  return normalized;
}

/** Validate feature-query options and return a normalized copy. */
export function validateFeatureQueryOptions(options: FeatureQueryOptions): FeatureQueryOptions {
  if (typeof options !== 'object' || options === null) {
    invalid('queryFeatures requires an options object.');
  }
  if (typeof options.layerId !== 'string' || options.layerId.length === 0) {
    invalid('queryFeatures requires a non-empty "layerId".');
  }
  const normalized: FeatureQueryOptions = { layerId: options.layerId };
  if (options.whereClause !== undefined) {
    if (typeof options.whereClause !== 'string') {
      invalid('queryFeatures "whereClause" must be a string.');
    }
    normalized.whereClause = options.whereClause;
  }
  if (options.maxResults !== undefined) {
    if (!Number.isInteger(options.maxResults) || options.maxResults <= 0) {
      invalid('queryFeatures "maxResults" must be a positive integer.', {
        maxResults: options.maxResults,
      });
    }
    normalized.maxResults = options.maxResults;
  }
  if (options.select !== undefined) {
    if (typeof options.select !== 'boolean') {
      invalid('queryFeatures "select" must be a boolean.');
    }
    normalized.select = options.select;
  }
  return normalized;
}

function layerIdAndWhere(
  options: { layerId?: unknown; whereClause?: unknown },
  fn: string
): { layerId: string; whereClause?: string } {
  if (typeof options !== 'object' || options === null) {
    invalid(`${fn} requires an options object.`);
  }
  if (typeof options.layerId !== 'string' || options.layerId.length === 0) {
    invalid(`${fn} requires a non-empty "layerId".`);
  }
  const normalized: { layerId: string; whereClause?: string } = { layerId: options.layerId };
  if (options.whereClause !== undefined) {
    if (typeof options.whereClause !== 'string') {
      invalid(`${fn} "whereClause" must be a string.`);
    }
    normalized.whereClause = options.whereClause;
  }
  return normalized;
}

/** Validate `selectFeatures` options. Returns a normalized copy. */
export function validateSelectFeaturesOptions(
  options: SelectFeaturesOptions
): SelectFeaturesOptions {
  return layerIdAndWhere(options, 'selectFeatures');
}

/** Validate `queryFeatureExtent` options. Returns a normalized copy. */
export function validateQueryExtentOptions(options: QueryExtentOptions): QueryExtentOptions {
  return layerIdAndWhere(options, 'queryFeatureExtent');
}

/** Validate `startGeoprocessingJob` options. Returns a normalized copy. */
export function validateGeoprocessingJobOptions(
  options: GeoprocessingJobOptions
): GeoprocessingJobOptions {
  if (typeof options !== 'object' || options === null) {
    invalid('startGeoprocessingJob requires an options object.');
  }
  const serviceUrl = nonEmptyString(
    options.serviceUrl,
    'startGeoprocessingJob requires a "serviceUrl".'
  );
  if (!Array.isArray(options.inputs) || options.inputs.length === 0) {
    invalid('startGeoprocessingJob requires a non-empty "inputs" array.');
  }
  const inputs = options.inputs.map((input): GeoprocessingInput => {
    if (typeof input !== 'object' || input === null) {
      invalid('Each geoprocessing input must be an object.');
    }
    const name = nonEmptyString(input.name, 'Each geoprocessing input requires a "name".');
    if (input.type === 'string') {
      if (typeof input.value !== 'string') {
        invalid(`Geoprocessing input "${name}" of type "string" requires a string "value".`);
      }
      return { name, type: 'string', value: input.value };
    }
    if (input.type === 'double') {
      if (!isFiniteNumber(input.value)) {
        invalid(`Geoprocessing input "${name}" of type "double" requires a numeric "value".`);
      }
      return { name, type: 'double', value: input.value };
    }
    if (input.type === 'point') {
      return { name, type: 'point', point: validateGeographicPoint(input.point) };
    }
    return invalid(
      `Geoprocessing input "${name}" has an unsupported type "${String(
        (input as { type?: unknown }).type
      )}".`
    );
  });
  return { serviceUrl, inputs };
}

const UTILITY_TRACE_TYPES = [
  'connected',
  'subnetwork',
  'upstream',
  'downstream',
  'isolation',
  'loops',
  'shortestPath',
];

function validateFeatureSelector(selector: unknown, label: string): UtilityFeatureSelector {
  if (typeof selector !== 'object' || selector === null) {
    invalid(`${label} must be an object.`);
  }
  const s = selector as { layerUrl?: unknown; whereClause?: unknown };
  return {
    layerUrl: nonEmptyString(s.layerUrl, `${label} requires a "layerUrl".`),
    whereClause: nonEmptyString(s.whereClause, `${label} requires a "whereClause".`),
  };
}

/** Validate `traceUtilityNetwork` options. Returns a normalized copy. */
export function validateTraceUtilityNetworkOptions(
  options: TraceUtilityNetworkOptions
): TraceUtilityNetworkOptions {
  if (typeof options !== 'object' || options === null) {
    invalid('traceUtilityNetwork requires an options object.');
  }
  if (!UTILITY_TRACE_TYPES.includes(options.traceType)) {
    invalid(`traceUtilityNetwork.traceType must be one of ${UTILITY_TRACE_TYPES.join(', ')}.`);
  }
  if (!Array.isArray(options.startingPoints) || options.startingPoints.length === 0) {
    invalid('traceUtilityNetwork requires a non-empty "startingPoints" array.');
  }
  const normalized: TraceUtilityNetworkOptions = {
    serviceUrl: nonEmptyString(options.serviceUrl, 'traceUtilityNetwork requires a "serviceUrl".'),
    traceType: options.traceType,
    startingPoints: options.startingPoints.map((p, i) =>
      validateFeatureSelector(p, `traceUtilityNetwork startingPoints[${i}]`)
    ),
  };
  if (options.barriers !== undefined) {
    if (!Array.isArray(options.barriers)) {
      invalid('traceUtilityNetwork.barriers must be an array.');
    }
    normalized.barriers = options.barriers.map((b, i) =>
      validateFeatureSelector(b, `traceUtilityNetwork barriers[${i}]`)
    );
  }
  return normalized;
}

/** Validate `getUtilityAssociations` options. Returns a normalized copy. */
export function validateGetUtilityAssociationsOptions(
  options: GetUtilityAssociationsOptions
): GetUtilityAssociationsOptions {
  if (typeof options !== 'object' || options === null) {
    invalid('getUtilityAssociations requires an options object.');
  }
  const normalized: GetUtilityAssociationsOptions = {
    serviceUrl: nonEmptyString(
      options.serviceUrl,
      'getUtilityAssociations requires a "serviceUrl".'
    ),
    extent: validateEnvelope(options.extent, 'getUtilityAssociations.extent'),
  };
  if (options.kind !== undefined) {
    if (!['connectivity', 'containment', 'attachment', 'all'].includes(options.kind)) {
      invalid(
        "getUtilityAssociations.kind must be 'connectivity', 'containment', 'attachment', or 'all'."
      );
    }
    normalized.kind = options.kind;
  }
  return normalized;
}

/** Validate `validateUtilityNetworkTopology` options. Returns a normalized copy. */
export function validateValidateUtilityNetworkTopologyOptions(
  options: ValidateUtilityNetworkTopologyOptions
): ValidateUtilityNetworkTopologyOptions {
  if (typeof options !== 'object' || options === null) {
    invalid('validateUtilityNetworkTopology requires an options object.');
  }
  return {
    serviceUrl: nonEmptyString(
      options.serviceUrl,
      'validateUtilityNetworkTopology requires a "serviceUrl".'
    ),
    extent: validateEnvelope(options.extent, 'validateUtilityNetworkTopology.extent'),
  };
}

/** Validate `createKmlFile` options. Returns a normalized copy. */
export function validateCreateKmlFileOptions(options: CreateKmlFileOptions): CreateKmlFileOptions {
  if (typeof options !== 'object' || options === null) {
    invalid('createKmlFile requires an options object.');
  }
  const path = nonEmptyString(options.path, 'createKmlFile requires a "path".');
  const normalized: CreateKmlFileOptions = { path };
  const hasPlacemarks = Array.isArray(options.placemarks) && options.placemarks.length > 0;
  const hasTracks = Array.isArray(options.tracks) && options.tracks.length > 0;
  if (!hasPlacemarks && !hasTracks) {
    invalid('createKmlFile requires at least one "placemarks" entry or one "tracks" entry.');
  }
  if (options.placemarks !== undefined) {
    if (!Array.isArray(options.placemarks)) {
      invalid('createKmlFile.placemarks must be an array.');
    }
    normalized.placemarks = options.placemarks.map((placemark) => {
      if (typeof placemark !== 'object' || placemark === null) {
        invalid('Each KML placemark must be an object.');
      }
      return {
        name: nonEmptyString(placemark.name, 'Each KML placemark requires a "name".'),
        point: validateGeographicPoint(placemark.point),
      };
    });
  }
  if (options.tracks !== undefined) {
    if (!Array.isArray(options.tracks)) {
      invalid('createKmlFile.tracks must be an array.');
    }
    normalized.tracks = options.tracks.map((track) => {
      if (typeof track !== 'object' || track === null || !Array.isArray(track.points)) {
        invalid('Each KML track requires a "points" array.');
      }
      if (track.points.length < 2) {
        invalid('Each KML track requires at least two points.');
      }
      return { points: track.points.map((point) => validateGeographicPoint(point)) };
    });
  }
  return normalized;
}

/** Validate `controlKmlTour` options. Returns a normalized copy. */
export function validateKmlTourOptions(options: KmlTourOptions): KmlTourOptions {
  if (typeof options !== 'object' || options === null) {
    invalid('controlKmlTour requires an options object.');
  }
  const layerId = nonEmptyString(options.layerId, 'controlKmlTour requires a "layerId".');
  if (!['play', 'pause', 'reset'].includes(options.action)) {
    invalid("controlKmlTour action must be 'play', 'pause', or 'reset'.");
  }
  return { layerId, action: options.action };
}

const STATISTIC_TYPES: StatisticType[] = [
  'count',
  'sum',
  'average',
  'min',
  'max',
  'standardDeviation',
  'variance',
];

/** Validate `queryStatistics` options. Returns a normalized copy. */
export function validateQueryStatisticsOptions(
  options: QueryStatisticsOptions
): QueryStatisticsOptions {
  if (typeof options !== 'object' || options === null) {
    invalid('queryStatistics requires an options object.');
  }
  const layerId = nonEmptyString(options.layerId, 'queryStatistics requires a "layerId".');
  if (!Array.isArray(options.statistics) || options.statistics.length === 0) {
    invalid('queryStatistics requires a non-empty "statistics" array.');
  }
  const statistics = options.statistics.map((s) => {
    const field = nonEmptyString(s.field, 'Each statistic requires a "field".');
    if (!STATISTIC_TYPES.includes(s.type)) {
      invalid(`Unsupported statistic type "${String(s.type)}".`, { type: s.type });
    }
    const def: StatisticDefinition = { field, type: s.type };
    if (s.outName !== undefined) {
      def.outName = nonEmptyString(s.outName, 'statistic outName must be a non-empty string.');
    }
    return def;
  });
  const result: QueryStatisticsOptions = { layerId, statistics };
  if (options.whereClause !== undefined) {
    if (typeof options.whereClause !== 'string') {
      invalid('queryStatistics whereClause must be a string.');
    }
    result.whereClause = options.whereClause;
  }
  if (options.groupByFields !== undefined) {
    if (
      !Array.isArray(options.groupByFields) ||
      options.groupByFields.some((f) => typeof f !== 'string' || f.length === 0)
    ) {
      invalid('queryStatistics groupByFields must be an array of non-empty strings.');
    }
    result.groupByFields = options.groupByFields;
  }
  return result;
}

/** Validate `queryRelatedFeatures` options. Returns a normalized copy. */
export function validateRelatedFeaturesOptions(
  options: RelatedFeaturesOptions
): RelatedFeaturesOptions {
  if (typeof options !== 'object' || options === null) {
    invalid('queryRelatedFeatures requires an options object.');
  }
  if (typeof options.layerId !== 'string' || options.layerId.length === 0) {
    invalid('queryRelatedFeatures requires a non-empty "layerId".');
  }
  if (!Number.isInteger(options.objectId)) {
    invalid('queryRelatedFeatures requires an integer "objectId".');
  }
  return { layerId: options.layerId, objectId: options.objectId };
}

/** Validate identify options and return a normalized copy. */
export function validateGeometryEditorOptions(
  options: GeometryEditorOptions
): GeometryEditorOptions {
  if (typeof options !== 'object' || options === null) {
    invalid('startGeometryEditor requires an options object.');
  }
  if (
    options.geometryType !== 'point' &&
    options.geometryType !== 'polyline' &&
    options.geometryType !== 'polygon'
  ) {
    invalid("startGeometryEditor geometryType must be 'point', 'polyline', or 'polygon'.");
  }
  const normalized: GeometryEditorOptions = { geometryType: options.geometryType };
  if (options.tool !== undefined) {
    if (!['vertex', 'freehand', 'reticle'].includes(options.tool)) {
      invalid("startGeometryEditor tool must be 'vertex', 'freehand', or 'reticle'.");
    }
    normalized.tool = options.tool;
  }
  if (options.snapEnabled !== undefined) {
    if (typeof options.snapEnabled !== 'boolean') {
      invalid('startGeometryEditor snapEnabled must be a boolean.');
    }
    normalized.snapEnabled = options.snapEnabled;
  }
  return normalized;
}

export function validateIdentifyOptions(options: IdentifyOptions): IdentifyOptions {
  if (typeof options !== 'object' || options === null) {
    invalid('identify requires an options object.');
  }
  const { screenPoint } = options;
  if (
    typeof screenPoint !== 'object' ||
    screenPoint === null ||
    !isFiniteNumber(screenPoint.x) ||
    !isFiniteNumber(screenPoint.y)
  ) {
    invalid('identify requires a screenPoint with finite numeric x and y.');
  }
  const normalized: IdentifyOptions = { screenPoint: { x: screenPoint.x, y: screenPoint.y } };
  if (options.tolerance !== undefined) {
    if (!isFiniteNumber(options.tolerance) || options.tolerance < 0) {
      invalid('identify tolerance must be a non-negative number.', {
        tolerance: options.tolerance,
      });
    }
    normalized.tolerance = options.tolerance;
  }
  if (options.maximumResults !== undefined) {
    if (!Number.isInteger(options.maximumResults) || options.maximumResults <= 0) {
      invalid('identify maximumResults must be a positive integer.', {
        maximumResults: options.maximumResults,
      });
    }
    normalized.maximumResults = options.maximumResults;
  }
  return normalized;
}

/**
 * Validate Arcade evaluation options and return a normalized copy. Reuses the
 * identify screen-point/tolerance validation and requires a non-empty
 * expression.
 */
export function validateArcadeEvaluationOptions(
  options: ArcadeEvaluationOptions
): ArcadeEvaluationOptions {
  const base = validateIdentifyOptions(options);
  const expression = nonEmptyString(
    (options as ArcadeEvaluationOptions)?.expression,
    'evaluateArcade requires a non-empty expression string.'
  );
  return { ...base, expression };
}

/**
 * Validate authentication options and return a normalized copy. The password is
 * validated for presence only — it is never inspected further, logged, or
 * echoed back in error details.
 */
export function validateAuthenticateOptions(options: AuthenticateOptions): AuthenticateOptions {
  if (typeof options !== 'object' || options === null) {
    invalid('authenticate requires an options object.');
  }
  if (typeof options.username !== 'string' || options.username.trim().length === 0) {
    invalid('authenticate requires a non-empty "username" string.');
  }
  if (typeof options.password !== 'string' || options.password.length === 0) {
    // Never echo the password value, even when it is the problem.
    invalid('authenticate requires a non-empty "password" string.');
  }
  const normalized: AuthenticateOptions = {
    username: options.username,
    password: options.password,
  };
  if (options.portalUrl !== undefined) {
    if (typeof options.portalUrl !== 'string' || !/^https?:\/\//i.test(options.portalUrl)) {
      invalid('authenticate "portalUrl", when provided, must be an http(s) URL.', {
        portalUrl: options.portalUrl,
      });
    }
    normalized.portalUrl = options.portalUrl;
  }
  return normalized;
}

function validateEnvelope(
  envelope: GeographicEnvelope,
  label = 'areaOfInterest'
): GeographicEnvelope {
  if (typeof envelope !== 'object' || envelope === null) {
    invalid(`${label} must be an envelope object.`);
  }
  const { minLatitude, minLongitude, maxLatitude, maxLongitude } = envelope;
  for (const [name, value, lo, hi] of [
    ['minLatitude', minLatitude, -90, 90],
    ['maxLatitude', maxLatitude, -90, 90],
    ['minLongitude', minLongitude, -180, 180],
    ['maxLongitude', maxLongitude, -180, 180],
  ] as const) {
    if (!isFiniteNumber(value) || value < lo || value > hi) {
      invalid(`${label}.${name} must be a finite number between ${lo} and ${hi}.`, {
        [name]: value,
      });
    }
  }
  if (minLatitude >= maxLatitude) {
    invalid(`${label}.minLatitude must be less than maxLatitude.`, {
      minLatitude,
      maxLatitude,
    });
  }
  if (minLongitude >= maxLongitude) {
    invalid(`${label}.minLongitude must be less than maxLongitude.`, {
      minLongitude,
      maxLongitude,
    });
  }
  return { minLatitude, minLongitude, maxLatitude, maxLongitude };
}

function validateFeatureServiceUrl(url: unknown, fn: string): string {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    invalid(`${fn} requires a "featureServiceUrl" that is an http(s) URL.`);
  }
  return url;
}

/** Validate generate-geodatabase options and return a normalized copy. */
export function validateGenerateGeodatabaseOptions(
  options: GenerateGeodatabaseOptions
): GenerateGeodatabaseOptions {
  if (typeof options !== 'object' || options === null) {
    invalid('startGenerateGeodatabaseJob requires an options object.');
  }
  return {
    featureServiceUrl: validateFeatureServiceUrl(
      options.featureServiceUrl,
      'startGenerateGeodatabaseJob'
    ),
    areaOfInterest: validateEnvelope(options.areaOfInterest),
  };
}

/** Validate a 3D camera and return a normalized copy. */
export function validateCamera(camera: Camera): Camera {
  if (typeof camera !== 'object' || camera === null) {
    invalid('A camera object is required.');
  }
  if (!isFiniteNumber(camera.latitude) || camera.latitude < -90 || camera.latitude > 90) {
    invalid('camera.latitude must be a finite number between -90 and 90.', {
      latitude: camera.latitude,
    });
  }
  if (!isFiniteNumber(camera.longitude) || camera.longitude < -180 || camera.longitude > 180) {
    invalid('camera.longitude must be a finite number between -180 and 180.', {
      longitude: camera.longitude,
    });
  }
  if (!isFiniteNumber(camera.altitude)) {
    invalid('camera.altitude must be a finite number (meters).', { altitude: camera.altitude });
  }
  const normalized: Camera = {
    latitude: camera.latitude,
    longitude: camera.longitude,
    altitude: camera.altitude,
  };
  for (const angle of ['heading', 'pitch', 'roll'] as const) {
    const value = camera[angle];
    if (value !== undefined) {
      if (!isFiniteNumber(value)) {
        invalid(`camera.${angle}, when provided, must be a finite number (degrees).`);
      }
      normalized[angle] = value;
    }
  }
  return normalized;
}

function validateSceneLayer(layer: SceneLayerSource, seenIds: Set<string>): SceneLayerSource {
  if (typeof layer !== 'object' || layer === null) {
    invalid('Each scene layer must be an object.');
  }
  if (typeof layer.id !== 'string' || layer.id.length === 0) {
    invalid('Each scene layer requires a non-empty string "id".');
  }
  if (seenIds.has(layer.id)) {
    invalid(`Duplicate scene layer id "${layer.id}". Layer ids must be unique.`, { id: layer.id });
  }
  seenIds.add(layer.id);
  if (
    layer.type !== undefined &&
    !['scene', 'integratedMesh', '3dTiles', 'pointCloud', 'building'].includes(layer.type)
  ) {
    invalid(
      `Scene layer "${layer.id}" type must be 'scene', 'integratedMesh', '3dTiles', 'pointCloud', or 'building'.`,
      { id: layer.id }
    );
  }
  const isPointCloud = layer.type === 'pointCloud';
  const hasUrl = typeof layer.url === 'string' && layer.url.length > 0;
  const hasPath = typeof layer.path === 'string' && layer.path.length > 0;
  if (isPointCloud) {
    if (hasUrl === hasPath) {
      invalid(
        `Point-cloud scene layer "${layer.id}" requires exactly one of "url" (a service) or "path" (a local .slpk).`,
        { id: layer.id }
      );
    }
  } else {
    if (!hasUrl) {
      invalid(`Scene layer "${layer.id}" requires a non-empty "url".`, { id: layer.id });
    }
    if (layer.path !== undefined) {
      invalid(`Scene layer "${layer.id}" "path" is only valid for a 'pointCloud' layer.`, {
        id: layer.id,
      });
    }
  }
  const normalized: SceneLayerSource = { id: layer.id };
  if (hasUrl) normalized.url = layer.url;
  if (hasPath) normalized.path = layer.path;
  if (layer.type !== undefined) {
    normalized.type = layer.type;
  }
  if (layer.buildingFilterExpression !== undefined) {
    if (layer.type !== 'building') {
      invalid(`Scene layer "${layer.id}" buildingFilterExpression requires type 'building'.`, {
        id: layer.id,
      });
    }
    if (typeof layer.buildingFilterExpression !== 'string') {
      invalid(`Scene layer "${layer.id}" buildingFilterExpression must be a string.`, {
        id: layer.id,
      });
    }
    normalized.buildingFilterExpression = layer.buildingFilterExpression;
  }
  if (layer.visible !== undefined) {
    if (typeof layer.visible !== 'boolean') {
      invalid(`Scene layer "${layer.id}" visible must be a boolean.`, { id: layer.id });
    }
    normalized.visible = layer.visible;
  }
  if (layer.opacity !== undefined) {
    if (!isFiniteNumber(layer.opacity) || layer.opacity < 0 || layer.opacity > 1) {
      invalid(`Scene layer "${layer.id}" opacity must be between 0 and 1.`, { id: layer.id });
    }
    normalized.opacity = layer.opacity;
  }
  if (layer.renderer !== undefined) {
    normalized.renderer = validateRenderer(layer.renderer, `Scene layer "${layer.id}"`);
  }
  if (layer.polygonFilter !== undefined) {
    const filter = layer.polygonFilter;
    if (typeof filter !== 'object' || filter === null || !Array.isArray(filter.polygons)) {
      invalid(`Scene layer "${layer.id}" polygonFilter requires a "polygons" array.`, {
        id: layer.id,
      });
    }
    if (filter.polygons.length === 0) {
      invalid(`Scene layer "${layer.id}" polygonFilter requires at least one polygon.`, {
        id: layer.id,
      });
    }
    const polygons = filter.polygons.map((ring) => {
      if (!Array.isArray(ring) || ring.length < 3) {
        invalid(`Scene layer "${layer.id}" polygonFilter rings need at least 3 points.`, {
          id: layer.id,
        });
      }
      return ring.map(validateGeographicPoint);
    });
    const normalizedFilter: SceneLayerPolygonFilter = { polygons };
    if (filter.spatialRelationship !== undefined) {
      if (!['contains', 'disjoint'].includes(filter.spatialRelationship)) {
        invalid(
          `Scene layer "${layer.id}" polygonFilter spatialRelationship must be 'contains' or 'disjoint'.`,
          { id: layer.id }
        );
      }
      normalizedFilter.spatialRelationship = filter.spatialRelationship;
    }
    normalized.polygonFilter = normalizedFilter;
  }
  return normalized;
}

function validateSceneGraphicsOverlay(
  overlay: SceneGraphicsOverlay,
  seenIds: Set<string>
): SceneGraphicsOverlay {
  if (typeof overlay !== 'object' || overlay === null) {
    invalid('Each scene graphics overlay must be an object.');
  }
  if (typeof overlay.id !== 'string' || overlay.id.length === 0) {
    invalid('Each scene graphics overlay requires a non-empty string "id".');
  }
  if (seenIds.has(overlay.id)) {
    invalid(`Duplicate graphics overlay id "${overlay.id}". Overlay ids must be unique.`, {
      id: overlay.id,
    });
  }
  seenIds.add(overlay.id);
  if (!Array.isArray(overlay.graphics)) {
    invalid(`Graphics overlay "${overlay.id}" requires a "graphics" array.`, { id: overlay.id });
  }
  const graphicIds = new Set<string>();
  const normalized: SceneGraphicsOverlay = {
    id: overlay.id,
    graphics: overlay.graphics.map((graphic) => validateGraphic(graphic, graphicIds)),
  };
  if (overlay.surfacePlacement !== undefined) {
    if (
      !['drapedBillboarded', 'drapedFlat', 'absolute', 'relative', 'relativeToScene'].includes(
        overlay.surfacePlacement
      )
    ) {
      invalid(
        `Graphics overlay "${overlay.id}" surfacePlacement must be one of 'drapedBillboarded', 'drapedFlat', 'absolute', 'relative', 'relativeToScene'.`,
        { id: overlay.id }
      );
    }
    normalized.surfacePlacement = overlay.surfacePlacement;
  }
  if (overlay.renderer !== undefined) {
    normalized.renderer = validateRenderer(overlay.renderer, `Graphics overlay "${overlay.id}"`);
  }
  if (overlay.extrusion !== undefined) {
    if (overlay.renderer === undefined) {
      invalid(`Graphics overlay "${overlay.id}" extrusion requires a "renderer".`, {
        id: overlay.id,
      });
    }
    const expression = nonEmptyString(
      overlay.extrusion.expression,
      `Graphics overlay "${overlay.id}" extrusion requires a non-empty "expression".`
    );
    const extrusion: SceneGraphicsOverlay['extrusion'] = { expression };
    if (overlay.extrusion.mode !== undefined) {
      if (
        !['baseHeight', 'absoluteHeight', 'minimum', 'maximum', 'none'].includes(
          overlay.extrusion.mode
        )
      ) {
        invalid(
          `Graphics overlay "${overlay.id}" extrusion.mode must be one of 'baseHeight', 'absoluteHeight', 'minimum', 'maximum', 'none'.`,
          { id: overlay.id }
        );
      }
      extrusion.mode = overlay.extrusion.mode;
    }
    normalized.extrusion = extrusion;
  }
  if (overlay.orientationExpressions !== undefined) {
    if (overlay.renderer === undefined) {
      invalid(`Graphics overlay "${overlay.id}" orientationExpressions requires a "renderer".`, {
        id: overlay.id,
      });
    }
    const src = overlay.orientationExpressions;
    if (typeof src !== 'object' || src === null) {
      invalid(`Graphics overlay "${overlay.id}" orientationExpressions must be an object.`, {
        id: overlay.id,
      });
    }
    const orientation: NonNullable<SceneGraphicsOverlay['orientationExpressions']> = {};
    for (const key of ['headingExpression', 'pitchExpression', 'rollExpression'] as const) {
      if (src[key] !== undefined) {
        orientation[key] = nonEmptyString(
          src[key],
          `Graphics overlay "${overlay.id}" ${key} must be a non-empty string.`
        );
      }
    }
    if (
      orientation.headingExpression === undefined &&
      orientation.pitchExpression === undefined &&
      orientation.rollExpression === undefined
    ) {
      invalid(
        `Graphics overlay "${overlay.id}" orientationExpressions must set at least one expression.`,
        { id: overlay.id }
      );
    }
    normalized.orientationExpressions = orientation;
  }
  return normalized;
}

function validateSceneImageOverlay(
  overlay: SceneImageOverlay,
  seenIds: Set<string>
): SceneImageOverlay {
  if (typeof overlay !== 'object' || overlay === null) {
    invalid('Each scene image overlay must be an object.');
  }
  if (typeof overlay.id !== 'string' || overlay.id.length === 0) {
    invalid('Each scene image overlay requires a non-empty string "id".');
  }
  if (seenIds.has(overlay.id)) {
    invalid(`Duplicate image overlay id "${overlay.id}". Overlay ids must be unique.`, {
      id: overlay.id,
    });
  }
  seenIds.add(overlay.id);
  if (
    !Array.isArray(overlay.imagePaths) ||
    overlay.imagePaths.length === 0 ||
    overlay.imagePaths.some((p) => typeof p !== 'string' || p.length === 0)
  ) {
    invalid(`Image overlay "${overlay.id}" requires a non-empty "imagePaths" array of strings.`, {
      id: overlay.id,
    });
  }
  const normalized: SceneImageOverlay = {
    id: overlay.id,
    imagePaths: [...overlay.imagePaths],
    extent: validateEnvelope(overlay.extent, `Image overlay "${overlay.id}" extent`),
  };
  if (overlay.framesPerSecond !== undefined) {
    if (!isFiniteNumber(overlay.framesPerSecond) || overlay.framesPerSecond < 0) {
      invalid(`Image overlay "${overlay.id}" framesPerSecond must be a non-negative number.`, {
        id: overlay.id,
      });
    }
    normalized.framesPerSecond = overlay.framesPerSecond;
  }
  if (overlay.opacity !== undefined) {
    if (!isFiniteNumber(overlay.opacity) || overlay.opacity < 0 || overlay.opacity > 1) {
      invalid(`Image overlay "${overlay.id}" opacity must be between 0 and 1.`, { id: overlay.id });
    }
    normalized.opacity = overlay.opacity;
  }
  return normalized;
}

function validateSceneAnalysis(analysis: SceneAnalysis): SceneAnalysis {
  if (typeof analysis !== 'object' || analysis === null) {
    invalid('Each scene analysis must be an object.');
  }
  if (analysis.type === 'viewshed') {
    if (!isFiniteNumber(analysis.headingDegrees) || !isFiniteNumber(analysis.pitchDegrees)) {
      invalid('viewshed requires finite "headingDegrees" and "pitchDegrees".');
    }
    if (!isFiniteNumber(analysis.maxDistanceMeters) || analysis.maxDistanceMeters <= 0) {
      invalid('viewshed requires a positive "maxDistanceMeters".');
    }
    const normalized: SceneAnalysis = {
      type: 'viewshed',
      location: validateGeographicPoint(analysis.location),
      headingDegrees: analysis.headingDegrees,
      pitchDegrees: analysis.pitchDegrees,
      maxDistanceMeters: analysis.maxDistanceMeters,
    };
    const h = validatePositive(analysis.horizontalAngleDegrees, 'viewshed.horizontalAngleDegrees');
    if (h !== undefined) normalized.horizontalAngleDegrees = h;
    const v = validatePositive(analysis.verticalAngleDegrees, 'viewshed.verticalAngleDegrees');
    if (v !== undefined) normalized.verticalAngleDegrees = v;
    const min = validatePositive(analysis.minDistanceMeters, 'viewshed.minDistanceMeters');
    if (min !== undefined) normalized.minDistanceMeters = min;
    return normalized;
  }
  if (analysis.type === 'lineOfSight') {
    return {
      type: 'lineOfSight',
      observer: validateGeographicPoint(analysis.observer),
      target: validateGeographicPoint(analysis.target),
    };
  }
  if (analysis.type === 'geoElementViewshed') {
    if (!isFiniteNumber(analysis.headingDegrees) || !isFiniteNumber(analysis.pitchDegrees)) {
      invalid('geoElementViewshed requires finite "headingDegrees" and "pitchDegrees".');
    }
    if (!isFiniteNumber(analysis.maxDistanceMeters) || analysis.maxDistanceMeters <= 0) {
      invalid('geoElementViewshed requires a positive "maxDistanceMeters".');
    }
    const normalized: SceneAnalysis = {
      type: 'geoElementViewshed',
      location: validateGeographicPoint(analysis.location),
      headingDegrees: analysis.headingDegrees,
      pitchDegrees: analysis.pitchDegrees,
      maxDistanceMeters: analysis.maxDistanceMeters,
    };
    const h = validatePositive(
      analysis.horizontalAngleDegrees,
      'geoElementViewshed.horizontalAngleDegrees'
    );
    if (h !== undefined) normalized.horizontalAngleDegrees = h;
    const v = validatePositive(
      analysis.verticalAngleDegrees,
      'geoElementViewshed.verticalAngleDegrees'
    );
    if (v !== undefined) normalized.verticalAngleDegrees = v;
    const min = validatePositive(
      analysis.minDistanceMeters,
      'geoElementViewshed.minDistanceMeters'
    );
    if (min !== undefined) normalized.minDistanceMeters = min;
    return normalized;
  }
  if (analysis.type === 'geoElementLineOfSight') {
    return {
      type: 'geoElementLineOfSight',
      observer: validateGeographicPoint(analysis.observer),
      target: validateGeographicPoint(analysis.target),
    };
  }
  if (analysis.type === 'cameraViewshed') {
    if (!isFiniteNumber(analysis.maxDistanceMeters) || analysis.maxDistanceMeters <= 0) {
      invalid('cameraViewshed requires a positive "maxDistanceMeters".');
    }
    const normalized: SceneAnalysis = {
      type: 'cameraViewshed',
      maxDistanceMeters: analysis.maxDistanceMeters,
    };
    const h = validatePositive(
      analysis.horizontalAngleDegrees,
      'cameraViewshed.horizontalAngleDegrees'
    );
    if (h !== undefined) normalized.horizontalAngleDegrees = h;
    const v = validatePositive(
      analysis.verticalAngleDegrees,
      'cameraViewshed.verticalAngleDegrees'
    );
    if (v !== undefined) normalized.verticalAngleDegrees = v;
    const min = validatePositive(analysis.minDistanceMeters, 'cameraViewshed.minDistanceMeters');
    if (min !== undefined) normalized.minDistanceMeters = min;
    return normalized;
  }
  if (analysis.type === 'interactiveViewshed') {
    if (!isFiniteNumber(analysis.headingDegrees) || !isFiniteNumber(analysis.pitchDegrees)) {
      invalid('interactiveViewshed requires finite "headingDegrees" and "pitchDegrees".');
    }
    if (!isFiniteNumber(analysis.maxDistanceMeters) || analysis.maxDistanceMeters <= 0) {
      invalid('interactiveViewshed requires a positive "maxDistanceMeters".');
    }
    const normalized: SceneAnalysis = {
      type: 'interactiveViewshed',
      location: validateGeographicPoint(analysis.location),
      headingDegrees: analysis.headingDegrees,
      pitchDegrees: analysis.pitchDegrees,
      maxDistanceMeters: analysis.maxDistanceMeters,
    };
    const h = validatePositive(
      analysis.horizontalAngleDegrees,
      'interactiveViewshed.horizontalAngleDegrees'
    );
    if (h !== undefined) normalized.horizontalAngleDegrees = h;
    const v = validatePositive(
      analysis.verticalAngleDegrees,
      'interactiveViewshed.verticalAngleDegrees'
    );
    if (v !== undefined) normalized.verticalAngleDegrees = v;
    const min = validatePositive(
      analysis.minDistanceMeters,
      'interactiveViewshed.minDistanceMeters'
    );
    if (min !== undefined) normalized.minDistanceMeters = min;
    return normalized;
  }
  if (analysis.type === 'distanceMeasurement') {
    if (
      analysis.unitSystem !== undefined &&
      analysis.unitSystem !== 'metric' &&
      analysis.unitSystem !== 'imperial'
    ) {
      invalid('distanceMeasurement.unitSystem must be "metric" or "imperial".');
    }
    const normalized: SceneAnalysis = {
      type: 'distanceMeasurement',
      startLocation: validateGeographicPoint(analysis.startLocation),
      endLocation: validateGeographicPoint(analysis.endLocation),
    };
    if (analysis.unitSystem !== undefined) normalized.unitSystem = analysis.unitSystem;
    return normalized;
  }
  return invalid(
    `Unsupported scene analysis type "${String((analysis as { type?: unknown }).type)}".`
  );
}

function validateWebSceneLayerLabels(entry: WebSceneLayerLabels): WebSceneLayerLabels {
  if (typeof entry !== 'object' || entry === null) {
    invalid('scene.webSceneLayerLabels entries must be objects.');
  }
  if (
    !Array.isArray(entry.layerPath) ||
    entry.layerPath.length === 0 ||
    entry.layerPath.some((name) => typeof name !== 'string' || name.length === 0)
  ) {
    invalid('webSceneLayerLabels.layerPath must be a non-empty array of non-empty layer names.');
  }
  if (!Array.isArray(entry.labels)) {
    invalid('webSceneLayerLabels.labels must be an array.');
  }
  return {
    layerPath: [...entry.layerPath],
    labels: entry.labels.map((l) => validateLabel(l, 'webSceneLayerLabels')),
  };
}

/** Validate a scene source and return a normalized copy. */
/** Validate a scene elevation source and return a normalized copy. */
function validateElevationSource(source: ElevationSource): ElevationSource {
  if (typeof source !== 'object' || source === null) {
    invalid('An elevation source must be an object.');
  }
  switch (source.type) {
    case 'world':
      return { type: 'world' };
    case 'tiled':
      return {
        type: 'tiled',
        url: nonEmptyString(source.url, "An elevation source of type 'tiled' requires a 'url'."),
      };
    case 'raster':
      return {
        type: 'raster',
        path: nonEmptyString(
          source.path,
          "An elevation source of type 'raster' requires a 'path'."
        ),
      };
    case 'tilePackage':
      return {
        type: 'tilePackage',
        path: nonEmptyString(
          source.path,
          "An elevation source of type 'tilePackage' requires a 'path'."
        ),
      };
    default:
      return invalid(
        "An elevation source 'type' must be 'world', 'tiled', 'raster', or 'tilePackage'.",
        { type: (source as { type?: unknown }).type }
      );
  }
}

export function validateSceneSource(scene: ArcgisSceneSource): ArcgisSceneSource {
  if (typeof scene !== 'object' || scene === null) {
    invalid('An ArcgisSceneView requires a "scene" object.');
  }
  const hasMobilePackage =
    typeof scene.mobileScenePackagePath === 'string' &&
    scene.mobileScenePackagePath.trim().length > 0;
  const hasWebScene =
    typeof scene.webSceneItemId === 'string' && scene.webSceneItemId.trim().length > 0;
  if (hasMobilePackage) {
    if (scene.basemap !== undefined) {
      invalid('scene.basemap cannot be combined with scene.mobileScenePackagePath.');
    }
    if (hasWebScene) {
      invalid('scene.webSceneItemId cannot be combined with scene.mobileScenePackagePath.');
    }
    const normalized: ArcgisSceneSource = {
      mobileScenePackagePath: scene.mobileScenePackagePath,
    };
    if (scene.initialCamera !== undefined) {
      normalized.initialCamera = validateCamera(scene.initialCamera);
    }
    return normalized;
  }
  if (scene.webSceneLayerLabels !== undefined && !hasWebScene) {
    invalid('scene.webSceneLayerLabels requires scene.webSceneItemId.');
  }
  if (hasWebScene) {
    if (scene.basemap !== undefined) {
      invalid('scene.basemap cannot be combined with scene.webSceneItemId.');
    }
    const normalized: ArcgisSceneSource = { webSceneItemId: scene.webSceneItemId };
    if (scene.webSceneLayerLabels !== undefined) {
      if (!Array.isArray(scene.webSceneLayerLabels)) {
        invalid('scene.webSceneLayerLabels must be an array.');
      }
      normalized.webSceneLayerLabels = scene.webSceneLayerLabels.map(validateWebSceneLayerLabels);
    }
    if (scene.initialCamera !== undefined) {
      normalized.initialCamera = validateCamera(scene.initialCamera);
    }
    return normalized;
  }
  if (!isBasemapStyle(scene.basemap)) {
    invalid('scene.basemap must be a supported basemap style.', { basemap: scene.basemap });
  }
  const normalized: ArcgisSceneSource = { basemap: scene.basemap };
  if (scene.viewingMode !== undefined) {
    if (scene.viewingMode !== 'global' && scene.viewingMode !== 'local') {
      invalid("scene.viewingMode must be 'global' or 'local'.");
    }
    normalized.viewingMode = scene.viewingMode;
  }
  if (scene.elevationEnabled !== undefined) {
    if (typeof scene.elevationEnabled !== 'boolean') {
      invalid('scene.elevationEnabled must be a boolean.');
    }
    normalized.elevationEnabled = scene.elevationEnabled;
  }
  if (scene.elevationSources !== undefined) {
    if (!Array.isArray(scene.elevationSources)) {
      invalid('scene.elevationSources must be an array.');
    }
    normalized.elevationSources = scene.elevationSources.map(validateElevationSource);
  }
  if (scene.sceneLayers !== undefined) {
    if (!Array.isArray(scene.sceneLayers)) {
      invalid('scene.sceneLayers must be an array.');
    }
    const seen = new Set<string>();
    normalized.sceneLayers = scene.sceneLayers.map((layer) => validateSceneLayer(layer, seen));
  }
  if (scene.graphicsOverlays !== undefined) {
    if (!Array.isArray(scene.graphicsOverlays)) {
      invalid('scene.graphicsOverlays must be an array.');
    }
    const seen = new Set<string>();
    normalized.graphicsOverlays = scene.graphicsOverlays.map((overlay) =>
      validateSceneGraphicsOverlay(overlay, seen)
    );
  }
  if (scene.analyses !== undefined) {
    if (!Array.isArray(scene.analyses)) {
      invalid('scene.analyses must be an array.');
    }
    normalized.analyses = scene.analyses.map(validateSceneAnalysis);
  }
  if (scene.imageOverlays !== undefined) {
    if (!Array.isArray(scene.imageOverlays)) {
      invalid('scene.imageOverlays must be an array.');
    }
    const imageOverlayIds = new Set<string>();
    normalized.imageOverlays = scene.imageOverlays.map((overlay) =>
      validateSceneImageOverlay(overlay, imageOverlayIds)
    );
  }
  if (scene.featureLayers !== undefined) {
    if (!Array.isArray(scene.featureLayers)) {
      invalid('scene.featureLayers must be an array.');
    }
    const seen = new Set<string>();
    normalized.featureLayers = scene.featureLayers.map((fl) => {
      const base = validateFeatureLayer(fl, seen);
      if (fl.extrusion === undefined) return base;
      if (fl.renderer === undefined) {
        invalid(`Scene feature layer "${fl.id}" extrusion requires a "renderer".`, { id: fl.id });
      }
      const expression = nonEmptyString(
        fl.extrusion.expression,
        `Scene feature layer "${fl.id}" extrusion requires a non-empty "expression".`
      );
      const extrusion: SceneExtrusion = { expression };
      if (fl.extrusion.mode !== undefined) {
        if (
          !['baseHeight', 'absoluteHeight', 'minimum', 'maximum', 'none'].includes(
            fl.extrusion.mode
          )
        ) {
          invalid(
            `Scene feature layer "${fl.id}" extrusion.mode must be one of 'baseHeight', 'absoluteHeight', 'minimum', 'maximum', 'none'.`,
            { id: fl.id }
          );
        }
        extrusion.mode = fl.extrusion.mode;
      }
      return { ...base, extrusion };
    });
  }
  if (scene.terrainExaggeration !== undefined) {
    if (!isFiniteNumber(scene.terrainExaggeration) || scene.terrainExaggeration <= 0) {
      invalid('scene.terrainExaggeration must be a positive number.');
    }
    normalized.terrainExaggeration = scene.terrainExaggeration;
  }
  if (scene.surfaceNavigationConstraint !== undefined) {
    if (!['none', 'stayAbove'].includes(scene.surfaceNavigationConstraint)) {
      invalid("scene.surfaceNavigationConstraint must be 'none' or 'stayAbove'.");
    }
    normalized.surfaceNavigationConstraint = scene.surfaceNavigationConstraint;
  }
  if (scene.atmosphereEffect !== undefined) {
    if (!['off', 'horizonOnly', 'realistic'].includes(scene.atmosphereEffect)) {
      invalid("scene.atmosphereEffect must be 'off', 'horizonOnly', or 'realistic'.");
    }
    normalized.atmosphereEffect = scene.atmosphereEffect;
  }
  if (scene.sunLighting !== undefined) {
    if (!['off', 'light', 'lightAndShadows'].includes(scene.sunLighting)) {
      invalid("scene.sunLighting must be 'off', 'light', or 'lightAndShadows'.");
    }
    normalized.sunLighting = scene.sunLighting;
  }
  if (scene.cameraController !== undefined) {
    const controller = scene.cameraController;
    if (controller.type !== 'orbitLocation') {
      invalid("scene.cameraController.type must be 'orbitLocation'.");
    }
    if (!isFiniteNumber(controller.distanceMeters) || controller.distanceMeters <= 0) {
      invalid('scene.cameraController.distanceMeters must be a positive number.');
    }
    normalized.cameraController = {
      type: 'orbitLocation',
      target: validateGeographicPoint(controller.target),
      distanceMeters: controller.distanceMeters,
    };
  }
  if (scene.initialCamera !== undefined) {
    normalized.initialCamera = validateCamera(scene.initialCamera);
  }
  return normalized;
}

const AR_VIEW_MODES: readonly ArViewMode[] = ['worldScale', 'tabletop', 'flyover'];

/** The validated, native-ready subset of {@link ArcgisArViewProps}. */
export type ValidatedArViewProps = {
  scene: ArcgisSceneSource;
  mode: ArViewMode;
  trackingMode?: ArTrackingMode;
  anchor?: GeographicPoint;
  translationFactor?: number;
  initialCamera?: Camera;
  clippingDistanceMeters?: number;
  calibrationVisible?: boolean;
};

/**
 * Validate {@link ArcgisArView} props and return a normalized copy. Enforces the
 * per-mode requirements: `tabletop` needs an `anchor`, `flyover` needs an
 * `initialCamera`. Throws `E_INVALID_ARGUMENT` on invalid input.
 */
export function validateArViewProps(props: ArcgisArViewProps): ValidatedArViewProps {
  if (typeof props !== 'object' || props === null) {
    invalid('ArcgisArView props are required.');
  }
  if (!AR_VIEW_MODES.includes(props.mode)) {
    invalid(`ArcgisArView "mode" must be one of ${AR_VIEW_MODES.join(', ')}.`, {
      mode: props.mode,
    });
  }
  const result: ValidatedArViewProps = {
    scene: validateSceneSource(props.scene),
    mode: props.mode,
  };

  if (props.trackingMode !== undefined) {
    if (props.trackingMode !== 'world' && props.trackingMode !== 'geo') {
      invalid('ArcgisArView "trackingMode" must be "world" or "geo".', {
        trackingMode: props.trackingMode,
      });
    }
    result.trackingMode = props.trackingMode;
  }

  if (props.mode === 'tabletop' && props.anchor === undefined) {
    invalid('tabletop AR requires an "anchor" geographic point.');
  }
  if (props.anchor !== undefined) {
    result.anchor = validateGeographicPoint(props.anchor);
  }

  if (props.mode === 'flyover' && props.initialCamera === undefined) {
    invalid('flyover AR requires an "initialCamera".');
  }
  if (props.initialCamera !== undefined) {
    result.initialCamera = validateCamera(props.initialCamera);
  }

  if (props.translationFactor !== undefined) {
    if (!isFiniteNumber(props.translationFactor) || props.translationFactor <= 0) {
      invalid('ArcgisArView "translationFactor" must be a positive number.', {
        translationFactor: props.translationFactor,
      });
    }
    result.translationFactor = props.translationFactor;
  }

  if (props.clippingDistanceMeters !== undefined) {
    if (!isFiniteNumber(props.clippingDistanceMeters) || props.clippingDistanceMeters <= 0) {
      invalid('ArcgisArView "clippingDistanceMeters" must be a positive number.', {
        clippingDistanceMeters: props.clippingDistanceMeters,
      });
    }
    result.clippingDistanceMeters = props.clippingDistanceMeters;
  }

  if (props.calibrationVisible !== undefined) {
    if (typeof props.calibrationVisible !== 'boolean') {
      invalid('ArcgisArView "calibrationVisible" must be a boolean.');
    }
    result.calibrationVisible = props.calibrationVisible;
  }

  return result;
}

/** Validate sync-geodatabase options and return a normalized copy. */
export function validateSyncGeodatabaseOptions(
  options: SyncGeodatabaseOptions
): SyncGeodatabaseOptions {
  if (typeof options !== 'object' || options === null) {
    invalid('startSyncGeodatabaseJob requires an options object.');
  }
  if (typeof options.path !== 'string' || options.path.trim().length === 0) {
    invalid('startSyncGeodatabaseJob requires a non-empty geodatabase "path".');
  }
  return {
    featureServiceUrl: validateFeatureServiceUrl(
      options.featureServiceUrl,
      'startSyncGeodatabaseJob'
    ),
    path: options.path,
  };
}
