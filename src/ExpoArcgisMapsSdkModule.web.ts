import { registerWebModule, NativeModule } from 'expo';

import type { ExpoArcgisMapsSdkModuleEvents } from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError } from './errors';
import type { ConfigureArcgisOptions } from './types/config';

/**
 * Web is not a supported target for v0.1 (see README "Not planned for v0.1").
 * The module exists so bundlers resolve cleanly, but every operation fails with
 * a stable `E_UNSUPPORTED` error rather than a raw runtime crash.
 */
class ExpoArcgisMapsSdkModule extends NativeModule<ExpoArcgisMapsSdkModuleEvents> {
  async configure(_options: ConfigureArcgisOptions): Promise<void> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'ArcGIS maps are not supported on web.');
  }

  async geocode(_address: string): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geocoding is not supported on web.');
  }

  async geocodeOffline(_path: string, _address: string): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'ArcGIS maps are not supported on web.');
  }

  async reverseGeocode(_point: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geocoding is not supported on web.');
  }

  async formatCoordinates(_point: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Coordinate formatting is not supported on web.');
  }

  async getBasemapStyles(): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'ArcGIS maps are not supported on web.');
  }

  async searchWebMaps(_query: string): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'ArcGIS maps are not supported on web.');
  }

  async createAndSaveMap(_options: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'ArcGIS maps are not supported on web.');
  }

  async addPortalItem(_options: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'ArcGIS maps are not supported on web.');
  }

  async queryMapImageSublayer(_url: string, _id: number, _where: string): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'ArcGIS maps are not supported on web.');
  }

  async updateFeatureAttributes(_options: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'ArcGIS maps are not supported on web.');
  }

  async queryFeatureAttachments(_url: string, _objectId: number): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'ArcGIS maps are not supported on web.');
  }

  async addFeatureAttachment(
    _url: string,
    _objectId: number,
    _name: string,
    _contentType: string,
    _dataBase64: string
  ): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'ArcGIS maps are not supported on web.');
  }

  async deleteFeatureAttachment(
    _url: string,
    _objectId: number,
    _attachmentId: number
  ): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'ArcGIS maps are not supported on web.');
  }

  async getServiceLayers(_type: string, _url: string): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'ArcGIS maps are not supported on web.');
  }

  async getShapefileInfo(_path: string): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'ArcGIS maps are not supported on web.');
  }

  async bufferGeometry(_geometry: unknown, _distanceMeters: number): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geometry operations are not supported on web.');
  }

  async planarBufferGeometry(_geometry: unknown, _distanceMeters: number): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geometry operations are not supported on web.');
  }

  async convexHull(_geometries: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geometry operations are not supported on web.');
  }

  async clipGeometry(_geometry: unknown, _envelope: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geometry operations are not supported on web.');
  }

  async cutGeometry(_geometry: unknown, _cutter: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geometry operations are not supported on web.');
  }

  async projectPoint(_point: unknown, _toWkid: number, _t?: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geometry operations are not supported on web.');
  }

  async getTransformations(_fromWkid: number, _toWkid: number): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geometry operations are not supported on web.');
  }

  async createMobileGeodatabase(_options: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'ArcGIS maps are not supported on web.');
  }

  async combineGeometries(_op: unknown, _a: unknown, _b: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geometry operations are not supported on web.');
  }

  async geometryRelationships(_a: unknown, _b: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geometry operations are not supported on web.');
  }

  async geodesicPath(_from: unknown, _to: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geometry operations are not supported on web.');
  }

  async geodesicEllipse(_options: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geometry operations are not supported on web.');
  }

  async geodesicSector(_options: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geometry operations are not supported on web.');
  }

  async simplifyGeometry(_g: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geometry operations are not supported on web.');
  }

  async densifyGeometry(_g: unknown, _m: number): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geometry operations are not supported on web.');
  }

  async generalizeGeometry(_g: unknown, _m: number): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geometry operations are not supported on web.');
  }

  async nearestVertex(_g: unknown, _p: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geometry operations are not supported on web.');
  }

  async solveRoute(_stops: unknown, _barriers: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Routing is not supported on web.');
  }

  async solveRouteInNetwork(_p: string, _n: string, _stops: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Routing is not supported on web.');
  }

  async findClosestFacility(_incident: unknown, _facilities: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Routing is not supported on web.');
  }

  async findClosestFacilities(_incidents: unknown, _facilities: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Routing is not supported on web.');
  }

  async findServiceArea(_facility: unknown, _breaks: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Routing is not supported on web.');
  }

  async findServiceAreas(_facilities: unknown, _breaks: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Routing is not supported on web.');
  }

  async authenticate(_options: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Authentication is not supported on web.');
  }

  async authenticateWithOAuth(_options: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Authentication is not supported on web.');
  }

  async signOut(): Promise<void> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Authentication is not supported on web.');
  }

  async startOfflineMapJob(_options: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Offline maps are not supported on web.');
  }

  async startPreplannedMapAreaJob(_id: string, _i: number): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Offline jobs are not supported on web.');
  }

  async startScheduledUpdatesJob(_path: string): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Offline jobs are not supported on web.');
  }

  async startExportVectorTilesJob(_options: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'ArcGIS maps are not supported on web.');
  }

  async startGenerateGeodatabaseJob(_options: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geodatabase jobs are not supported on web.');
  }

  async startSyncGeodatabaseJob(_options: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geodatabase jobs are not supported on web.');
  }

  async applyGeodatabaseTransaction(
    _path: string,
    _tableName: string,
    _addCount: number,
    _commit: boolean
  ): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geodatabase editing is not supported on web.');
  }

  async addFeatureWithContingentValues(_options: unknown): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Geodatabase editing is not supported on web.');
  }

  async awaitJob(_jobId: string): Promise<never> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Jobs are not supported on web.');
  }

  async cancelJob(_jobId: string): Promise<void> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Jobs are not supported on web.');
  }

  async deleteOfflineMap(_path: string): Promise<void> {
    throw new ArcgisSdkError('E_UNSUPPORTED', 'Offline maps are not supported on web.');
  }
}

export default registerWebModule(ExpoArcgisMapsSdkModule, 'ExpoArcgisMapsSdkModule');
