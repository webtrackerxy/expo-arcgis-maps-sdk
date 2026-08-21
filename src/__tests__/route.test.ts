import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import {
  findClosestFacilities,
  findClosestFacility,
  findServiceArea,
  findServiceAreas,
  solveRoute,
  solveRouteInNetwork,
} from '../route';

jest.mock('../ExpoArcgisMapsSdkModule');

const mockedSolve = ExpoArcgisMapsSdkModule.solveRoute as jest.MockedFunction<
  typeof ExpoArcgisMapsSdkModule.solveRoute
>;
const mod = ExpoArcgisMapsSdkModule as unknown as Record<string, jest.Mock>;

const A = { latitude: 34.05, longitude: -118.24 };
const B = { latitude: 34.14, longitude: -118.14 };

describe('solveRoute', () => {
  beforeEach(() => {
    mockedSolve.mockReset();
    mockedSolve.mockResolvedValue({ distanceMeters: 0, travelTimeMinutes: 0, path: [] });
  });

  it('validates stops then forwards them to native', async () => {
    mockedSolve.mockResolvedValueOnce({ distanceMeters: 1500, travelTimeMinutes: 5, path: [A, B] });
    const result = await solveRoute([A, B]);
    expect(mockedSolve).toHaveBeenCalledWith([A, B], []);
    expect(result.distanceMeters).toBe(1500);
  });

  it('forwards polygon barriers and rejects non-polygon barriers', async () => {
    const barrier = {
      type: 'polygon' as const,
      ring: [A, B, { latitude: 34.1, longitude: -118.2 }],
    };
    await solveRoute([A, B], { polygonBarriers: [barrier] });
    expect(mockedSolve).toHaveBeenCalledWith([A, B], [barrier]);
    await expect(
      solveRoute([A, B], { polygonBarriers: [{ type: 'point', point: A } as never] })
    ).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
  });

  it('rejects fewer than two stops before calling native', async () => {
    await expect(solveRoute([A])).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
    expect(mockedSolve).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range stop', async () => {
    await expect(solveRoute([A, { latitude: 999, longitude: 0 }])).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    expect(mockedSolve).not.toHaveBeenCalled();
  });

  it('maps a native rejection to a stable error', async () => {
    mockedSolve.mockRejectedValueOnce('boom');
    await expect(solveRoute([A, B])).rejects.toMatchObject({ code: 'E_NATIVE_FAILURE' });
  });
});

describe('findClosestFacility', () => {
  beforeEach(() => mod.findClosestFacility.mockClear());

  it('validates and forwards incident + facilities', async () => {
    await findClosestFacility({ incident: A, facilities: [B] });
    expect(mod.findClosestFacility).toHaveBeenCalledWith(A, [B]);
  });

  it('rejects an empty facilities list', async () => {
    await expect(findClosestFacility({ incident: A, facilities: [] })).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    expect(mod.findClosestFacility).not.toHaveBeenCalled();
  });
});

describe('findServiceArea', () => {
  beforeEach(() => mod.findServiceArea.mockClear());

  it('validates and forwards facility + breaks', async () => {
    await findServiceArea({ facility: A, breaksMinutes: [5, 10] });
    expect(mod.findServiceArea).toHaveBeenCalledWith(A, [5, 10]);
  });

  it('rejects non-positive breaks', async () => {
    await expect(findServiceArea({ facility: A, breaksMinutes: [0] })).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
  });
});

describe('findClosestFacilities', () => {
  beforeEach(() => mod.findClosestFacilities.mockClear());

  it('validates and forwards incidents + facilities', async () => {
    await findClosestFacilities([A, B], [B]);
    expect(mod.findClosestFacilities).toHaveBeenCalledWith([A, B], [B]);
  });

  it('rejects empty incidents or facilities', async () => {
    await expect(findClosestFacilities([], [B])).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    await expect(findClosestFacilities([A], [])).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    expect(mod.findClosestFacilities).not.toHaveBeenCalled();
  });
});

describe('findServiceAreas', () => {
  beforeEach(() => mod.findServiceAreas.mockClear());

  it('validates and forwards facilities + breaks', async () => {
    await findServiceAreas([A, B], [5, 10]);
    expect(mod.findServiceAreas).toHaveBeenCalledWith([A, B], [5, 10]);
  });

  it('rejects an empty facilities list', async () => {
    await expect(findServiceAreas([], [5])).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
    expect(mod.findServiceAreas).not.toHaveBeenCalled();
  });

  it('rejects non-positive breaks', async () => {
    await expect(findServiceAreas([A], [0])).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
  });
});

describe('solveRouteInNetwork', () => {
  beforeEach(() => mod.solveRouteInNetwork.mockClear());

  it('validates and forwards path, network, and stops', async () => {
    await solveRouteInNetwork('/tmp/net.geodatabase', 'Streets_ND', [A, B]);
    expect(mod.solveRouteInNetwork).toHaveBeenCalledWith('/tmp/net.geodatabase', 'Streets_ND', [
      A,
      B,
    ]);
  });

  it('rejects a missing path/network or too few stops', async () => {
    await expect(solveRouteInNetwork('', 'n', [A, B])).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    await expect(solveRouteInNetwork('/p', 'n', [A])).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
  });
});
