import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import { geocode, geocodeOffline, reverseGeocode } from '../geocode';

jest.mock('../ExpoArcgisMapsSdkModule');

const mockedGeocode = ExpoArcgisMapsSdkModule.geocode as jest.MockedFunction<
  typeof ExpoArcgisMapsSdkModule.geocode
>;
const mockedReverse = ExpoArcgisMapsSdkModule.reverseGeocode as jest.MockedFunction<
  typeof ExpoArcgisMapsSdkModule.reverseGeocode
>;

describe('geocode', () => {
  beforeEach(() => {
    mockedGeocode.mockReset();
    mockedGeocode.mockResolvedValue([]);
  });

  it('forwards a non-empty address to native', async () => {
    mockedGeocode.mockResolvedValueOnce([
      { label: 'Redlands, CA', location: { latitude: 34, longitude: -117 }, score: 100 },
    ]);
    const results = await geocode('Redlands');
    expect(mockedGeocode).toHaveBeenCalledWith('Redlands');
    expect(results[0].label).toBe('Redlands, CA');
  });

  it('rejects an empty address before calling native', async () => {
    await expect(geocode('   ')).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
    expect(mockedGeocode).not.toHaveBeenCalled();
  });

  it('maps a native rejection to a stable error', async () => {
    mockedGeocode.mockRejectedValueOnce('boom');
    await expect(geocode('x')).rejects.toMatchObject({ code: 'E_NATIVE_FAILURE' });
  });
});

describe('reverseGeocode', () => {
  beforeEach(() => {
    mockedReverse.mockReset();
    mockedReverse.mockResolvedValue([]);
  });

  it('validates the point then forwards it to native', async () => {
    await reverseGeocode({ latitude: 34.05, longitude: -118.24 });
    expect(mockedReverse).toHaveBeenCalledWith({ latitude: 34.05, longitude: -118.24 });
  });

  it('rejects an out-of-range point before calling native', async () => {
    await expect(reverseGeocode({ latitude: 200, longitude: 0 })).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    expect(mockedReverse).not.toHaveBeenCalled();
  });
});

describe('geocodeOffline', () => {
  const mod = ExpoArcgisMapsSdkModule as unknown as Record<string, jest.Mock>;
  beforeEach(() => mod.geocodeOffline.mockClear());

  it('forwards the locator path and address', async () => {
    await geocodeOffline('/tmp/x.loc', 'Redlands');
    expect(mod.geocodeOffline).toHaveBeenCalledWith('/tmp/x.loc', 'Redlands');
  });

  it('rejects an empty path or address', async () => {
    await expect(geocodeOffline('', 'x')).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
    await expect(geocodeOffline('/tmp/x.loc', ' ')).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    expect(mod.geocodeOffline).not.toHaveBeenCalled();
  });
});
