import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import { queryMapImageSublayer } from '../queryMapImageSublayer';

jest.mock('../ExpoArcgisMapsSdkModule');

const mod = ExpoArcgisMapsSdkModule as unknown as Record<string, jest.Mock>;
const URL = 'https://example.com/arcgis/rest/services/USA/MapServer';

describe('queryMapImageSublayer', () => {
  beforeEach(() => mod.queryMapImageSublayer.mockClear());

  it('forwards url, sublayer id, and where clause', async () => {
    mod.queryMapImageSublayer.mockResolvedValueOnce([{ attributes: { STATE_NAME: 'CA' } }]);
    const results = await queryMapImageSublayer(URL, 3, 'POP2000 > 1000000');
    expect(mod.queryMapImageSublayer).toHaveBeenCalledWith(URL, 3, 'POP2000 > 1000000');
    expect(results[0].attributes.STATE_NAME).toBe('CA');
  });

  it('defaults the where clause to 1=1', async () => {
    await queryMapImageSublayer(URL, 0);
    expect(mod.queryMapImageSublayer).toHaveBeenCalledWith(URL, 0, '1=1');
  });

  it('rejects an empty url', async () => {
    await expect(queryMapImageSublayer('  ', 0)).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    expect(mod.queryMapImageSublayer).not.toHaveBeenCalled();
  });

  it('rejects a negative or non-integer sublayer id', async () => {
    await expect(queryMapImageSublayer(URL, -1)).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    await expect(queryMapImageSublayer(URL, 1.5)).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
  });

  it('maps a native rejection to a stable error', async () => {
    mod.queryMapImageSublayer.mockRejectedValueOnce('boom');
    await expect(queryMapImageSublayer(URL, 0)).rejects.toMatchObject({ code: 'E_NATIVE_FAILURE' });
  });
});
