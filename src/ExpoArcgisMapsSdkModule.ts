import { NativeModule, requireNativeModule } from 'expo';

import type { TransformationInfo } from './geometry';
import type { ShapefileInfo } from './getShapefileInfo';
import type { ArSupport } from './types/arView';
import type { AttachmentInfo } from './types/attachment';
import type { AuthenticateOptions, OAuthAuthenticateOptions, PortalUser } from './types/auth';
import type { BasemapStyleInfo } from './types/basemap';
import type { CreateServiceVersionResult, ServiceVersionInfo } from './types/branchVersion';
import type { GeographicPoint } from './types/common';
import type { ConfigureArcgisOptions } from './types/config';
import type { CoordinateFormats } from './types/coordinates';
import type { QueryDynamicEntitiesResult } from './types/dynamicEntity';
import type { GeocodeResult } from './types/geocode';
import type {
  CreateMobileGeodatabaseOptions,
  ContingentValidationResult,
  GenerateGeodatabaseOptions,
  GeodatabaseTransactionResult,
  MobileGeodatabaseResult,
  SyncGeodatabaseOptions,
} from './types/geodatabase';
import type {
  ArcgisGeometry,
  GeodesicEllipseOptions,
  GeodesicSectorOptions,
  GeometryCombineOperation,
  GeometryRelationships,
  ProjectedPoint,
} from './types/geometry';
import type { JobProgressEvent } from './types/job';
import type { CreateKmlFileOptions, CreateKmlFileResult, KmlInfo } from './types/kml';
import type { ServiceLayerInfo } from './types/layer';
import type { LineOfSightResult } from './types/lineOfSight';
import type {
  ExportVectorTilesOptions,
  GeographicEnvelope,
  OfflineMapJobOptions,
} from './types/offline';
import type {
  AddPortalItemOptions,
  AddPortalItemResult,
  CreateAndSaveMapOptions,
  CreateAndSaveMapResult,
  WebMapSearchResult,
} from './types/portal';
import type { FeatureQueryResult } from './types/query';
import type {
  ClosestFacilityResult,
  ClosestFacilityRoute,
  FacilityServiceArea,
  RouteResult,
  ServiceAreaResult,
} from './types/route';
import type {
  GetUtilityAssociationsOptions,
  GetUtilityAssociationsResult,
  TraceUtilityNetworkOptions,
  TraceUtilityNetworkResult,
  ValidateUtilityNetworkTopologyOptions,
  ValidateUtilityNetworkTopologyResult,
} from './types/utilityNetwork';

/**
 * Module-level events. `onJobProgress` streams progress for long-running jobs
 * (offline generation, sync); consumers subscribe through a job handle rather
 * than directly.
 */
export type ExpoArcgisMapsSdkModuleEvents = {
  onJobProgress: (event: JobProgressEvent) => void;
};

/**
 * Typed view of the native `ExpoArcgisMapsSdk` module. This is an internal
 * boundary; consumers use {@link import('./configureArcgis').configureArcgis}
 * rather than calling the native module directly.
 *
 * Only serializable DTOs cross this boundary — never native ArcGIS objects.
 */
export declare class ExpoArcgisMapsSdkModule extends NativeModule<ExpoArcgisMapsSdkModuleEvents> {
  /**
   * Apply global ArcGIS configuration (API key). Rejects with a native
   * `{ code, message }` that {@link import('./errors').toArcgisError} maps to a
   * stable error.
   */
  configure(options: ConfigureArcgisOptions): Promise<void>;
  /** Forward geocode an address via the ArcGIS World Geocoding Service. */
  geocode(address: string): Promise<GeocodeResult[]>;
  /** Forward geocode against a local offline locator (.loc). */
  geocodeOffline(locatorPath: string, address: string): Promise<GeocodeResult[]>;
  /** Reverse geocode a location via the ArcGIS World Geocoding Service. */
  reverseGeocode(point: GeographicPoint): Promise<GeocodeResult[]>;
  /** Format a point as decimal degrees, DMS, USNG, MGRS and UTM strings. */
  formatCoordinates(point: GeographicPoint): Promise<CoordinateFormats>;
  /** List the basemap styles advertised by the ArcGIS basemap-styles service. */
  getBasemapStyles(): Promise<BasemapStyleInfo[]>;
  /** Search ArcGIS Online for public web maps matching a query. */
  searchWebMaps(query: string): Promise<WebMapSearchResult[]>;
  /** Create a map and save it as a web map item in the signed-in user's portal. */
  createAndSaveMap(options: CreateAndSaveMapOptions): Promise<CreateAndSaveMapResult>;
  /** Add a feature-collection item to the signed-in user's portal from JSON. */
  addPortalItem(options: AddPortalItemOptions): Promise<AddPortalItemResult>;
  /** Update a feature's attributes and apply the edit to the service. */
  updateFeatureAttributes(options: {
    serviceUrl: string;
    objectId: number;
    attributes: Record<string, string | number | boolean | null>;
  }): Promise<{ objectId: number }>;
  /** List a feature's attachments (metadata only). */
  queryFeatureAttachments(serviceUrl: string, objectId: number): Promise<AttachmentInfo[]>;
  /** Add a base64 attachment to a feature and apply the edit. */
  addFeatureAttachment(
    serviceUrl: string,
    objectId: number,
    name: string,
    contentType: string,
    dataBase64: string
  ): Promise<AttachmentInfo>;
  /** Delete a feature's attachment by id and apply the edit. */
  deleteFeatureAttachment(
    serviceUrl: string,
    objectId: number,
    attachmentId: number
  ): Promise<void>;
  /** Browse the layers/collections of an OGC service (wms/wfs/ogcFeature). */
  getServiceLayers(type: string, url: string): Promise<ServiceLayerInfo[]>;
  /** Read a local shapefile's descriptive metadata. */
  getShapefileInfo(path: string): Promise<ShapefileInfo>;
  /** List a KML/KMZ document's node tree (flattened). */
  getKmlInfo(source: { url: string | null; path: string | null }): Promise<KmlInfo>;
  /** Author a KML/KMZ file from placemarks and/or a multi-track. */
  createKmlFile(options: CreateKmlFileOptions): Promise<CreateKmlFileResult>;
  /** Query the current dynamic entities of a stream service (one-shot snapshot). */
  queryDynamicEntities(options: {
    url: string;
    trackIds: string[] | null;
  }): Promise<QueryDynamicEntitiesResult>;
  /** Create a branch version on a service geodatabase and switch to it. */
  createServiceVersion(options: {
    serviceUrl: string;
    versionName: string;
    description: string | null;
    access: 'public' | 'protected' | 'private';
  }): Promise<CreateServiceVersionResult>;
  /** List the branch versions of a branch-versioned feature service. */
  getServiceVersions(serviceUrl: string): Promise<ServiceVersionInfo[]>;
  /** Run a utility-network trace and return element counts by asset group. */
  traceUtilityNetwork(options: TraceUtilityNetworkOptions): Promise<TraceUtilityNetworkResult>;
  /** List a utility network's associations within an extent. */
  getUtilityAssociations(
    options: GetUtilityAssociationsOptions
  ): Promise<GetUtilityAssociationsResult>;
  /** Validate a utility network's topology within an extent. */
  validateUtilityNetworkTopology(
    options: ValidateUtilityNetworkTopologyOptions
  ): Promise<ValidateUtilityNetworkTopologyResult>;
  /** Report whether this device can run augmented reality (ARKit / ARCore). */
  isArSupported(): Promise<ArSupport>;
  /** Query one sublayer of a map image (dynamic) service by where clause. */
  queryMapImageSublayer(
    serviceUrl: string,
    sublayerId: number,
    where: string
  ): Promise<FeatureQueryResult[]>;
  /** Query a time-aware feature service layer within a time extent. */
  queryFeaturesInTimeExtent(options: {
    serviceUrl: string;
    startTime: number;
    endTime: number;
    whereClause: string | null;
  }): Promise<FeatureQueryResult[]>;
  /** Compute line of sight against a local elevation raster (for a 2D map). */
  computeLineOfSight(options: {
    observer: GeographicPoint;
    target: GeographicPoint;
    elevationRasterPath: string;
  }): Promise<LineOfSightResult>;
  /** Geodesic buffer (meters) around a geometry. */
  bufferGeometry(geometry: ArcgisGeometry, distanceMeters: number): Promise<ArcgisGeometry>;
  /** Planar buffer (meters, via Web Mercator) around a geometry. */
  planarBufferGeometry(geometry: ArcgisGeometry, distanceMeters: number): Promise<ArcgisGeometry>;
  /** Convex hull enclosing the geometries. */
  convexHull(geometries: ArcgisGeometry[]): Promise<ArcgisGeometry>;
  /** Clip a geometry to a geographic envelope. */
  clipGeometry(geometry: ArcgisGeometry, envelope: GeographicEnvelope): Promise<ArcgisGeometry>;
  /** Cut a geometry with a polyline; returns the pieces. */
  cutGeometry(geometry: ArcgisGeometry, cutter: ArcgisGeometry): Promise<ArcgisGeometry[]>;
  /** Project a WGS 84 point into another spatial reference (WKID). */
  projectPoint(
    point: GeographicPoint,
    toWkid: number,
    transformationName: string | null
  ): Promise<ProjectedPoint>;
  /** List datum transformations available between two spatial references. */
  getTransformations(fromWkid: number, toWkid: number): Promise<TransformationInfo[]>;
  /** Create a new mobile geodatabase with one feature table and sample features. */
  createMobileGeodatabase(
    options: CreateMobileGeodatabaseOptions
  ): Promise<MobileGeodatabaseResult>;
  /** Combine two geometries with a set operation. */
  combineGeometries(
    operation: GeometryCombineOperation,
    a: ArcgisGeometry,
    b: ArcgisGeometry
  ): Promise<ArcgisGeometry>;
  /** Topological relationships between two geometries. */
  geometryRelationships(a: ArcgisGeometry, b: ArcgisGeometry): Promise<GeometryRelationships>;
  /** Geodesic (great-circle) densified polyline between two points. */
  geodesicPath(from: GeographicPoint, to: GeographicPoint): Promise<ArcgisGeometry>;
  /** Geodesic ellipse polygon around a center. */
  geodesicEllipse(options: GeodesicEllipseOptions): Promise<ArcgisGeometry>;
  /** Geodesic sector (wedge) polygon around a center. */
  geodesicSector(options: GeodesicSectorOptions): Promise<ArcgisGeometry>;
  /** Topologically simplify a geometry. */
  simplifyGeometry(geometry: ArcgisGeometry): Promise<ArcgisGeometry>;
  /** Densify a geometry to a maximum segment length (geometry units). */
  densifyGeometry(geometry: ArcgisGeometry, maxSegmentLength: number): Promise<ArcgisGeometry>;
  /** Generalize a geometry within a maximum deviation (geometry units). */
  generalizeGeometry(geometry: ArcgisGeometry, maxDeviation: number): Promise<ArcgisGeometry>;
  /** The vertex of a geometry nearest a point. */
  nearestVertex(
    geometry: ArcgisGeometry,
    point: GeographicPoint
  ): Promise<{ point: GeographicPoint; distance: number }>;
  /** Solve a route through the given stops (with optional polygon barriers). */
  solveRoute(stops: GeographicPoint[], barriers: unknown[]): Promise<RouteResult>;
  /** Solve a route using a local transportation network dataset (offline). */
  solveRouteInNetwork(
    geodatabasePath: string,
    networkName: string,
    stops: GeographicPoint[]
  ): Promise<RouteResult>;
  /** Find the closest facility to an incident via the World Closest Facility Service. */
  findClosestFacility(
    incident: GeographicPoint,
    facilities: GeographicPoint[]
  ): Promise<ClosestFacilityResult>;
  /** Find the closest facility to each of several incidents. */
  findClosestFacilities(
    incidents: GeographicPoint[],
    facilities: GeographicPoint[]
  ): Promise<ClosestFacilityRoute[]>;
  /** Compute drive-time service-area polygons via the World Service Area Service. */
  findServiceArea(facility: GeographicPoint, breaksMinutes: number[]): Promise<ServiceAreaResult>;
  /** Compute drive-time service-area polygons around each of several facilities. */
  findServiceAreas(
    facilities: GeographicPoint[],
    breaksMinutes: number[]
  ): Promise<FacilityServiceArea[]>;
  /**
   * Authenticate a named user against a portal with a username and password,
   * add the resulting credential to the OS credential store, and return the
   * portal user's non-sensitive profile.
   */
  authenticate(options: AuthenticateOptions): Promise<PortalUser>;
  /**
   * Sign in interactively with OAuth via the system browser, store the
   * credential, and return the portal user's non-sensitive profile.
   */
  authenticateWithOAuth(options: OAuthAuthenticateOptions): Promise<PortalUser>;
  /** Authenticate against an IWA-protected portal with Windows credentials. */
  authenticateWithIWA(options: {
    portalUrl: string;
    username: string;
    password: string;
  }): Promise<PortalUser>;
  /** Authenticate against a PKI-protected portal with a client certificate. */
  authenticateWithPKI(options: {
    portalUrl: string;
    certificatePath: string | null;
    password: string | null;
    certificateAlias: string | null;
  }): Promise<PortalUser>;
  /** Remove all stored ArcGIS credentials (sign out). */
  signOut(): Promise<void>;
  /**
   * Create and start a generate-offline-map job. Resolves with an opaque job id
   * once the job has started; progress arrives via `onJobProgress`.
   */
  startOfflineMapJob(options: OfflineMapJobOptions): Promise<string>;
  /** Create and start a download-preplanned-offline-map-area job. */
  startPreplannedMapAreaJob(webMapItemId: string, areaIndex: number): Promise<string>;
  /** Create and start an apply-scheduled-updates job for an offline package. */
  startScheduledUpdatesJob(mobileMapPackagePath: string): Promise<string>;
  /** Create and start an export-vector-tiles job; resolves with an opaque job id. */
  startExportVectorTilesJob(options: ExportVectorTilesOptions): Promise<string>;
  /**
   * Create and start a geoprocessing job; resolves with an opaque job id. Inputs
   * are sent with a fixed field per type (`stringValue` / `doubleValue` /
   * `point`) since the native Record layer is strictly typed.
   */
  startGeoprocessingJob(options: {
    serviceUrl: string;
    inputs: {
      name: string;
      type: 'string' | 'double' | 'point';
      stringValue?: string;
      doubleValue?: number;
      point?: GeographicPoint;
    }[];
  }): Promise<string>;
  /**
   * Create and start a generate-geodatabase job. Resolves with an opaque job id.
   */
  startGenerateGeodatabaseJob(options: GenerateGeodatabaseOptions): Promise<string>;
  /**
   * Create and start a sync-geodatabase job. Resolves with an opaque job id.
   */
  startSyncGeodatabaseJob(options: SyncGeodatabaseOptions): Promise<string>;
  /** Add features to a geodatabase table inside a transaction, then commit or roll back. */
  applyGeodatabaseTransaction(
    path: string,
    tableName: string,
    addCount: number,
    commit: boolean
  ): Promise<GeodatabaseTransactionResult>;
  /** Validate attributes against a table's contingent values and add if valid. */
  addFeatureWithContingentValues(options: {
    geodatabasePath: string;
    tableName: string;
    attributes: Record<string, string | number | boolean | null>;
  }): Promise<ContingentValidationResult>;
  /**
   * Await any started job's terminal outcome. Resolves once with the job's
   * result payload, or rejects (`E_JOB_CANCELLED` when cancelled). Also releases
   * the job's native resources. The payload shape depends on the job type and
   * is narrowed by the caller.
   */
  awaitJob(jobId: string): Promise<unknown>;
  /** Request cancellation of a running job by id. */
  cancelJob(jobId: string): Promise<void>;
  /** Delete a previously generated offline map package or geodatabase file. */
  deleteOfflineMap(path: string): Promise<void>;
}

// This call resolves the native module at import time on device. In Jest it is
// replaced by the manual mock in `src/__mocks__/ExpoArcgisMapsSdkModule.ts`.
export default requireNativeModule<ExpoArcgisMapsSdkModule>('ExpoArcgisMapsSdk');
