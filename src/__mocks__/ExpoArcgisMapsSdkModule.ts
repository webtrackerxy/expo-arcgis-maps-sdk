/**
 * Manual Jest mock for the native module bridge.
 *
 * Activated with `jest.mock('../ExpoArcgisMapsSdkModule')`. Lets both this
 * package and consumers exercise `configureArcgis` and friends without loading
 * native code. Reset call history with `configure.mockClear()`.
 */
import type { AuthenticateOptions, PortalUser } from '../types/auth';
import type { ConfigureArcgisOptions } from '../types/config';
import type { GeocodeResult } from '../types/geocode';
import type { OfflineMapResult } from '../types/offline';
import type { RouteResult } from '../types/route';

export const configure = jest.fn(
  async (_options: ConfigureArcgisOptions): Promise<void> => undefined
);

export const geocode = jest.fn(async (_address: string): Promise<GeocodeResult[]> => []);
export const geocodeOffline = jest.fn(
  async (_path: string, _address: string): Promise<GeocodeResult[]> => []
);

export const reverseGeocode = jest.fn(async (_point: unknown): Promise<GeocodeResult[]> => []);

export const formatCoordinates = jest.fn(async (_point: unknown) => ({
  decimalDegrees: '34.09N 118.71W',
  degreesMinutesSeconds: `34°05'27"N 118°42'18"W`,
  usng: '11S MT 12345 67890',
  mgrs: '11SMT1234567890',
  utm: '11S 361000 3772000',
}));

export const getBasemapStyles = jest.fn(async () => []);
export const searchWebMaps = jest.fn(async (_query: string) => []);
export const createAndSaveMap = jest.fn(async (_options: unknown) => ({ itemId: 'new-item' }));
export const addPortalItem = jest.fn(async (_options: unknown) => ({ itemId: 'new-item' }));
export const queryMapImageSublayer = jest.fn(
  async (_url: string, _id: number, _where: string) => []
);
export const queryFeaturesInTimeExtent = jest.fn(async (_o: unknown) => [
  { attributes: { objectid: 1 }, location: { latitude: 0, longitude: 0 } },
]);
export const computeLineOfSight = jest.fn(async (_o: unknown) => ({
  targetVisibility: 1,
  visibleLine: {
    type: 'polyline' as const,
    path: [
      { latitude: 0, longitude: 0 },
      { latitude: 1, longitude: 1 },
    ],
  },
}));
export const updateFeatureAttributes = jest.fn(async (options: { objectId: number }) => ({
  objectId: options.objectId,
}));
export const queryFeatureAttachments = jest.fn(async (_url: string, _oid: number) => []);
export const addFeatureAttachment = jest.fn(
  async (_url: string, _oid: number, name: string, contentType: string, _data: string) => ({
    id: 1,
    name,
    contentType,
    size: 0,
  })
);
export const deleteFeatureAttachment = jest.fn(
  async (_url: string, _oid: number, _aid: number) => undefined
);

export const getServiceLayers = jest.fn(async (_type: string, _url: string) => []);

export const getShapefileInfo = jest.fn(async (_path: string) => ({
  credits: '',
  description: '',
  summary: '',
  tags: [] as string[],
  copyrightText: '',
}));

export const getKmlInfo = jest.fn(async (_source: unknown) => ({
  nodes: [{ name: 'Root', type: 'document' as const, visible: true, depth: 0 }],
}));

export const createKmlFile = jest.fn(async (options: { path: string }) => ({ path: options.path }));

export const queryDynamicEntities = jest.fn(async (_o: unknown) => ({
  entities: [{ attributes: { trackId: 'A' }, latitude: 1, longitude: 2 }],
}));

export const createServiceVersion = jest.fn(async (o: { versionName: string }) => ({
  versionName: `owner.${o.versionName}`,
}));

export const getServiceVersions = jest.fn(async (_url: string) => [
  { name: 'sde.DEFAULT', access: 'public' as const, description: '', isOwner: false },
]);

export const traceUtilityNetwork = jest.fn(async (_o: unknown) => ({
  elementCount: 3,
  byAssetGroup: { Device: 2, Line: 1 },
}));

export const getUtilityAssociations = jest.fn(async (_o: unknown) => ({
  associations: [{ kind: 'containment' as const }],
}));

export const validateUtilityNetworkTopology = jest.fn(async (_o: unknown) => ({
  hasErrors: false,
}));

export const isArSupported = jest.fn(async () => ({ supported: true }));

export const solveRoute = jest.fn(
  async (_stops: unknown, _barriers?: unknown): Promise<RouteResult> => ({
    distanceMeters: 0,
    travelTimeMinutes: 0,
    path: [],
  })
);

export const solveRouteInNetwork = jest.fn(
  async (_p: string, _n: string, _stops: unknown): Promise<RouteResult> => ({
    distanceMeters: 0,
    travelTimeMinutes: 0,
    path: [],
  })
);

export const findClosestFacility = jest.fn(async (_incident: unknown, _facilities: unknown) => ({
  facilityIndex: 0,
  distanceMeters: 0,
  travelTimeMinutes: 0,
  path: [],
}));

export const findClosestFacilities = jest.fn(
  async (_incidents: unknown, _facilities: unknown) => []
);

export const findServiceArea = jest.fn(async (_facility: unknown, _breaks: unknown) => ({
  polygons: [],
}));

export const findServiceAreas = jest.fn(async (_facilities: unknown, _breaks: unknown) => []);

export const authenticate = jest.fn(async (options: AuthenticateOptions): Promise<PortalUser> => ({
  username: options.username,
}));

export const authenticateWithOAuth = jest.fn(async (_options: unknown): Promise<PortalUser> => ({
  username: 'oauth-user',
}));

export const authenticateWithIWA = jest.fn(
  async (options: { username: string }): Promise<PortalUser> => ({ username: options.username })
);

export const authenticateWithPKI = jest.fn(async (_options: unknown): Promise<PortalUser> => ({
  username: 'pki-user',
}));

export const signOut = jest.fn(async (): Promise<void> => undefined);

export const startOfflineMapJob = jest.fn(async (_options: unknown): Promise<string> => 'job-1');
export const startPreplannedMapAreaJob = jest.fn(
  async (_id: string, _i: number): Promise<string> => 'job-1'
);

export const startScheduledUpdatesJob = jest.fn(async (_path: string): Promise<string> => 'job-1');

export const startExportVectorTilesJob = jest.fn(async (_o: unknown) => 'job-1');

export const startGeoprocessingJob = jest.fn(async (_o: unknown): Promise<string> => 'job-gp');

export const startGenerateGeodatabaseJob = jest.fn(
  async (_options: unknown): Promise<string> => 'job-2'
);

export const startSyncGeodatabaseJob = jest.fn(
  async (_options: unknown): Promise<string> => 'job-3'
);

export const applyGeodatabaseTransaction = jest.fn(
  async (_path: string, _table: string, addCount: number, commit: boolean) => ({
    committed: commit,
    featureCount: commit ? addCount : 0,
  })
);

export const addFeatureWithContingentValues = jest.fn(async (_o: unknown) => ({
  added: true,
  violations: [],
}));

export const awaitJob = jest.fn(async (_jobId: string): Promise<OfflineMapResult> => ({
  path: '/mock/offline',
  layerErrors: [],
}));

export const cancelJob = jest.fn(async (_jobId: string): Promise<void> => undefined);

export const deleteOfflineMap = jest.fn(async (_path: string): Promise<void> => undefined);

export const addListener = jest.fn((_event: string, _listener: (...args: unknown[]) => void) => ({
  remove: jest.fn(),
}));

export const bufferGeometry = jest.fn(async (_g: unknown, _d: number) => ({
  type: 'polygon',
  ring: [
    { latitude: 0, longitude: 0 },
    { latitude: 1, longitude: 0 },
    { latitude: 1, longitude: 1 },
  ],
}));
export const planarBufferGeometry = jest.fn(async (_g: unknown, _d: number) => ({
  type: 'polygon',
  ring: [
    { latitude: 0, longitude: 0 },
    { latitude: 1, longitude: 0 },
    { latitude: 1, longitude: 1 },
  ],
}));
export const convexHull = jest.fn(async (_g: unknown) => ({
  type: 'polygon',
  ring: [
    { latitude: 0, longitude: 0 },
    { latitude: 1, longitude: 0 },
    { latitude: 1, longitude: 1 },
  ],
}));
export const clipGeometry = jest.fn(async (_g: unknown, _e: unknown) => ({
  type: 'point',
  point: { latitude: 0, longitude: 0 },
}));
export const cutGeometry = jest.fn(async (_g: unknown, _c: unknown) => []);
export const projectPoint = jest.fn(async (_p: unknown, wkid: number, _t?: unknown) => ({
  x: 0,
  y: 0,
  wkid,
}));
export const combineGeometries = jest.fn(async (_op: unknown, _a: unknown, _b: unknown) => ({
  type: 'point',
  point: { latitude: 0, longitude: 0 },
}));
export const geometryRelationships = jest.fn(async (_a: unknown, _b: unknown) => ({
  contains: false,
  within: false,
  crosses: false,
  disjoint: true,
  intersects: false,
  overlaps: false,
  touches: false,
}));

export const geodesicPath = jest.fn(async (_from: unknown, _to: unknown) => ({
  type: 'polyline' as const,
  path: [],
}));

export const geodesicEllipse = jest.fn(async (_options: unknown) => ({
  type: 'polygon' as const,
  ring: [],
}));

export const geodesicSector = jest.fn(async (_options: unknown) => ({
  type: 'polygon' as const,
  ring: [],
}));

export const getTransformations = jest.fn(async (_from: number, _to: number) => []);

export const createMobileGeodatabase = jest.fn(async (_o: unknown) => ({
  path: '/tmp/x.geodatabase',
  tableName: 'demo',
  featureCount: 0,
}));

export const simplifyGeometry = jest.fn(async (g: unknown) => g);
export const densifyGeometry = jest.fn(async (g: unknown, _m: number) => g);
export const generalizeGeometry = jest.fn(async (g: unknown, _m: number) => g);
export const nearestVertex = jest.fn(async (_g: unknown, _p: unknown) => ({
  point: { latitude: 0, longitude: 0 },
  distance: 0,
}));

const ExpoArcgisMapsSdkModule = {
  configure,
  geocode,
  geocodeOffline,
  reverseGeocode,
  formatCoordinates,
  getBasemapStyles,
  searchWebMaps,
  createAndSaveMap,
  addPortalItem,
  queryMapImageSublayer,
  queryFeaturesInTimeExtent,
  computeLineOfSight,
  updateFeatureAttributes,
  queryFeatureAttachments,
  addFeatureAttachment,
  deleteFeatureAttachment,
  getServiceLayers,
  getShapefileInfo,
  getKmlInfo,
  createKmlFile,
  queryDynamicEntities,
  createServiceVersion,
  getServiceVersions,
  traceUtilityNetwork,
  getUtilityAssociations,
  validateUtilityNetworkTopology,
  findClosestFacility,
  findClosestFacilities,
  findServiceArea,
  findServiceAreas,
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
  getTransformations,
  createMobileGeodatabase,
  simplifyGeometry,
  densifyGeometry,
  generalizeGeometry,
  nearestVertex,
  solveRoute,
  solveRouteInNetwork,
  authenticate,
  authenticateWithOAuth,
  authenticateWithIWA,
  authenticateWithPKI,
  signOut,
  startOfflineMapJob,
  startPreplannedMapAreaJob,
  startScheduledUpdatesJob,
  startExportVectorTilesJob,
  startGeoprocessingJob,
  startGenerateGeodatabaseJob,
  startSyncGeodatabaseJob,
  applyGeodatabaseTransaction,
  addFeatureWithContingentValues,
  awaitJob,
  cancelJob,
  deleteOfflineMap,
  isArSupported,
  addListener,
};

export default ExpoArcgisMapsSdkModule;
