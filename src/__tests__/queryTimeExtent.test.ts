import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import { queryFeaturesInTimeExtent } from '../queryTimeExtent';

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

describe('queryFeaturesInTimeExtent', () => {
  beforeEach(() => mod.queryFeaturesInTimeExtent.mockClear());

  it('forwards the service, window, and a null where clause', async () => {
    const features = await queryFeaturesInTimeExtent({
      serviceUrl: 'https://x/FeatureServer/0',
      startTime: 100,
      endTime: 200,
    });
    expect(Array.isArray(features)).toBe(true);
    expect(mod.queryFeaturesInTimeExtent).toHaveBeenCalledWith({
      serviceUrl: 'https://x/FeatureServer/0',
      startTime: 100,
      endTime: 200,
      whereClause: null,
    });
  });

  it('rejects a missing serviceUrl or non-numeric window', async () => {
    expect(
      (
        await rejection(() =>
          queryFeaturesInTimeExtent({ serviceUrl: '', startTime: 1, endTime: 2 })
        )
      ).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(
      (
        await rejection(() =>
          queryFeaturesInTimeExtent({
            serviceUrl: 'https://x',
            startTime: NaN,
            endTime: 2,
          })
        )
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects endTime before startTime', async () => {
    expect(
      (
        await rejection(() =>
          queryFeaturesInTimeExtent({ serviceUrl: 'https://x', startTime: 200, endTime: 100 })
        )
      ).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(mod.queryFeaturesInTimeExtent).not.toHaveBeenCalled();
  });
});
