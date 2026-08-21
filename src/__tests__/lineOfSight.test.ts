import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import { computeLineOfSight } from '../lineOfSight';

jest.mock('../ExpoArcgisMapsSdkModule');

const mod = ExpoArcgisMapsSdkModule as unknown as Record<string, jest.Mock>;

function rejection(fn: () => unknown): Promise<{ code?: string }> {
  return Promise.resolve()
    .then(fn)
    .then(
      () => {
        throw new Error('expected a rejection');
      },
      (error) => error as { code?: string }
    );
}

describe('computeLineOfSight', () => {
  beforeEach(() => mod.computeLineOfSight.mockClear());

  it('forwards the validated observer, target, and raster path', async () => {
    const result = await computeLineOfSight({
      observer: { latitude: 36.5, longitude: -121.8, altitude: 300 },
      target: { latitude: 36.51, longitude: -121.77, altitude: 20 },
      elevationRasterPath: '/dem/monterey.dt2',
    });
    expect(result.targetVisibility).toBe(1);
    expect(mod.computeLineOfSight).toHaveBeenCalledWith(
      expect.objectContaining({ elevationRasterPath: '/dem/monterey.dt2' })
    );
  });

  it('rejects a missing raster path or bad observer', async () => {
    expect(
      (
        await rejection(() =>
          computeLineOfSight({
            observer: { latitude: 0, longitude: 0 },
            target: { latitude: 1, longitude: 1 },
            elevationRasterPath: '  ',
          })
        )
      ).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(
      (
        await rejection(() =>
          computeLineOfSight({
            observer: { latitude: 999, longitude: 0 },
            target: { latitude: 1, longitude: 1 },
            elevationRasterPath: '/dem.tif',
          })
        )
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});
