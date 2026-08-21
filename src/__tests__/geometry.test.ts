import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import {
  bufferGeometry,
  planarBufferGeometry,
  clipGeometry,
  combineGeometries,
  convexHull,
  cutGeometry,
  densifyGeometry,
  generalizeGeometry,
  geodesicPath,
  geodesicEllipse,
  geodesicSector,
  geometryRelationships,
  getTransformations,
  nearestVertex,
  projectPoint,
  simplifyGeometry,
} from '../geometry';

// `jest.mock` is hoisted above the imports by babel-jest.
jest.mock('../ExpoArcgisMapsSdkModule');

const mod = ExpoArcgisMapsSdkModule as unknown as Record<string, jest.Mock>;

const point = { type: 'point', point: { latitude: 34, longitude: -118 } } as const;
const line = {
  type: 'polyline',
  path: [
    { latitude: 34, longitude: -118 },
    { latitude: 35, longitude: -117 },
  ],
} as const;

describe('geometry operations', () => {
  beforeEach(() =>
    Object.values(mod).forEach((m) => typeof m?.mockClear === 'function' && m.mockClear())
  );

  it('buffers a geometry by a positive distance', async () => {
    const result = await bufferGeometry(point, 1000);
    expect(mod.bufferGeometry).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'point' }),
      1000
    );
    expect(result.type).toBe('polygon');
  });

  it('rejects a non-positive buffer distance', async () => {
    await expect(bufferGeometry(point, 0)).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
    expect(mod.bufferGeometry).not.toHaveBeenCalled();
  });

  it('planar-buffers a geometry by a positive distance', async () => {
    const result = await planarBufferGeometry(point, 1000);
    expect(mod.planarBufferGeometry).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'point' }),
      1000
    );
    expect(result.type).toBe('polygon');
  });

  it('rejects a non-positive planar buffer distance', async () => {
    await expect(planarBufferGeometry(point, -5)).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    expect(mod.planarBufferGeometry).not.toHaveBeenCalled();
  });

  it('computes a convex hull and rejects an empty list', async () => {
    await convexHull([point, line]);
    expect(mod.convexHull).toHaveBeenCalled();
    await expect(convexHull([])).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
  });

  it('clips, cuts, projects, combines and relates', async () => {
    await clipGeometry(point, {
      minLatitude: 33,
      minLongitude: -119,
      maxLatitude: 35,
      maxLongitude: -117,
    });
    await cutGeometry({ type: 'polygon', ring: point ? line.path.concat(point.point) : [] }, line);
    const projected = await projectPoint({ latitude: 34, longitude: -118 }, 3857);
    expect(projected.wkid).toBe(3857);
    await combineGeometries('union', point, line);
    const rel = await geometryRelationships(point, line);
    expect(rel).toHaveProperty('intersects');
    await geodesicPath(
      { latitude: 51.5, longitude: -0.13 },
      { latitude: 35.68, longitude: 139.77 }
    );
    expect(mod.geodesicPath).toHaveBeenCalled();
  });

  it('rejects a geodesic path with an out-of-range point', async () => {
    await expect(
      geodesicPath({ latitude: 91, longitude: 0 }, { latitude: 0, longitude: 0 })
    ).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
  });

  it('forwards a geodesic ellipse and sector with normalized options', async () => {
    await geodesicEllipse({
      center: { latitude: 40, longitude: -105 },
      semiAxis1LengthMeters: 20000,
      semiAxis2LengthMeters: 10000,
    });
    expect(mod.geodesicEllipse).toHaveBeenCalledWith(
      expect.objectContaining({ semiAxis1LengthMeters: 20000, axisDirectionDegrees: 0 })
    );
    await geodesicSector({
      center: { latitude: 40, longitude: -105 },
      semiAxis1LengthMeters: 20000,
      semiAxis2LengthMeters: 10000,
      sectorAngleDegrees: 45,
    });
    expect(mod.geodesicSector).toHaveBeenCalledWith(
      expect.objectContaining({ sectorAngleDegrees: 45, startDirectionDegrees: 0 })
    );
  });

  it('rejects a geodesic ellipse with a non-positive semi-axis', async () => {
    await expect(
      geodesicEllipse({
        center: { latitude: 40, longitude: -105 },
        semiAxis1LengthMeters: 0,
        semiAxis2LengthMeters: 10000,
      })
    ).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
  });

  it('forwards simplify / densify / generalize / nearest-vertex', async () => {
    await simplifyGeometry(line);
    await densifyGeometry(line, 1.5);
    await generalizeGeometry(line, 3);
    await nearestVertex(line, { latitude: 34, longitude: -118 });
    expect(mod.simplifyGeometry).toHaveBeenCalled();
    expect(mod.densifyGeometry).toHaveBeenCalled();
    expect(mod.generalizeGeometry).toHaveBeenCalled();
    expect(mod.nearestVertex).toHaveBeenCalled();
  });

  it('rejects densify/generalize with a non-positive amount', async () => {
    await expect(densifyGeometry(line, 0)).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
    await expect(generalizeGeometry(line, -1)).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
  });

  it('lists transformations and projects with a named transformation', async () => {
    await getTransformations(4326, 27700);
    await projectPoint({ latitude: 51.5, longitude: 0 }, 27700, 'OSGB_1936_To_WGS_1984_2');
    expect(mod.getTransformations).toHaveBeenCalledWith(4326, 27700);
    expect(mod.projectPoint).toHaveBeenCalledWith(
      { latitude: 51.5, longitude: 0 },
      27700,
      'OSGB_1936_To_WGS_1984_2'
    );
  });

  it('rejects getTransformations with a non-positive wkid', async () => {
    await expect(getTransformations(0, 27700)).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
  });

  it('rejects an unknown combine operation and a non-polyline cutter', async () => {
    await expect(combineGeometries('bogus' as never, point, line)).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    await expect(cutGeometry(point, point)).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
  });
});
