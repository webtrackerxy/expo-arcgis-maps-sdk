import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import { searchWebMaps } from '../searchWebMaps';

jest.mock('../ExpoArcgisMapsSdkModule');

const mod = ExpoArcgisMapsSdkModule as unknown as Record<string, jest.Mock>;

describe('searchWebMaps', () => {
  beforeEach(() => mod.searchWebMaps.mockClear());

  it('forwards a non-empty query to native', async () => {
    mod.searchWebMaps.mockResolvedValueOnce([
      { itemId: 'abc', title: 'Trees', snippet: 'A map', owner: 'esri' },
    ]);
    const results = await searchWebMaps('trees');
    expect(mod.searchWebMaps).toHaveBeenCalledWith('trees');
    expect(results[0].itemId).toBe('abc');
  });

  it('rejects an empty query before calling native', async () => {
    await expect(searchWebMaps('   ')).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
    expect(mod.searchWebMaps).not.toHaveBeenCalled();
  });

  it('maps a native rejection to a stable error', async () => {
    mod.searchWebMaps.mockRejectedValueOnce('boom');
    await expect(searchWebMaps('trees')).rejects.toMatchObject({ code: 'E_NATIVE_FAILURE' });
  });
});
