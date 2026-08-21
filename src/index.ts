/**
 * Public entry point for `expo-arcgis-maps-sdk`.
 *
 * Only stable, serializable values are exported. Native ArcGIS objects never
 * cross into JavaScript (see CLAUDE.md "Public API rules").
 */

export { ArcgisArView } from './ArcgisArView';
export { ArcgisMapView } from './ArcgisMapView';
export { ArcgisSceneView } from './ArcgisSceneView';
export { isArSupported } from './arSupport';
export {
  authenticate,
  authenticateWithOAuth,
  authenticateWithIWA,
  authenticateWithPKI,
  signOut,
} from './auth';
export type { IwaAuthenticateOptions, PkiAuthenticateOptions } from './types/auth';
export { configureArcgis } from './configureArcgis';
export { formatCoordinates } from './coordinates';
export {
  bufferGeometry,
  planarBufferGeometry,
  convexHull,
  clipGeometry,
  cutGeometry,
  projectPoint,
  combineGeometries,
  geometryRelationships,
  geodesicPath,
  geodesicEllipse,
  geodesicSector,
  simplifyGeometry,
  densifyGeometry,
  generalizeGeometry,
  nearestVertex,
  getTransformations,
} from './geometry';
export type { NearestVertexResult, TransformationInfo } from './geometry';
export { geocode, geocodeOffline, reverseGeocode } from './geocode';
export { getBasemapStyles } from './getBasemapStyles';
export { searchWebMaps } from './searchWebMaps';
export { createAndSaveMap } from './createAndSaveMap';
export { addPortalItem } from './addPortalItem';
export { queryMapImageSublayer } from './queryMapImageSublayer';
export { queryFeaturesInTimeExtent } from './queryTimeExtent';
export type { TimeExtentQueryOptions } from './types/query';
export { computeLineOfSight } from './lineOfSight';
export type { ComputeLineOfSightOptions, LineOfSightResult } from './types/lineOfSight';
export {
  queryFeatureAttachments,
  addFeatureAttachment,
  deleteFeatureAttachment,
} from './attachments';
export { updateFeatureAttributes, type UpdateFeatureResult } from './updateFeatureAttributes';
export { getServiceLayers } from './getServiceLayers';
export { getShapefileInfo, type ShapefileInfo } from './getShapefileInfo';
export { getKmlInfo, createKmlFile } from './kml';
export { queryDynamicEntities } from './dynamicEntities';
export { createServiceVersion, getServiceVersions } from './branchVersion';
export type {
  CreateServiceVersionOptions,
  CreateServiceVersionResult,
  ServiceVersionInfo,
} from './types/branchVersion';
export {
  traceUtilityNetwork,
  getUtilityAssociations,
  validateUtilityNetworkTopology,
} from './utilityNetwork';
export type {
  UtilityTraceType,
  UtilityFeatureSelector,
  TraceUtilityNetworkOptions,
  TraceUtilityNetworkResult,
  UtilityAssociationKind,
  GetUtilityAssociationsOptions,
  UtilityAssociationInfo,
  GetUtilityAssociationsResult,
  ValidateUtilityNetworkTopologyOptions,
  ValidateUtilityNetworkTopologyResult,
} from './types/utilityNetwork';
export type {
  QueryDynamicEntitiesOptions,
  DynamicEntityInfo,
  QueryDynamicEntitiesResult,
} from './types/dynamicEntity';
export type {
  ArViewMode,
  ArTrackingMode,
  ArTrackingState,
  ArTrackingReason,
  ArcgisArViewProps,
  ArcgisArViewRef,
  ArSupport,
} from './types/arView';
export type {
  KmlNodeType,
  KmlNodeInfo,
  KmlInfo,
  KmlPlacemarkInput,
  KmlTrackInput,
  CreateKmlFileOptions,
  CreateKmlFileResult,
} from './types/kml';
export { createMobileGeodatabase } from './createMobileGeodatabase';
export {
  startGenerateGeodatabaseJob,
  startSyncGeodatabaseJob,
  applyGeodatabaseTransaction,
  addFeatureWithContingentValues,
} from './geodatabase';
export { startGeoprocessingJob } from './geoprocessing';
export {
  solveRoute,
  solveRouteInNetwork,
  findClosestFacility,
  findClosestFacilities,
  findServiceArea,
  findServiceAreas,
} from './route';

export {
  ArcgisSdkError,
  isArcgisError,
  toArcgisError,
  ARCGIS_ERROR_CODES,
  type ArcgisError,
  type ArcgisErrorCode,
} from './errors';

export * from './types';
