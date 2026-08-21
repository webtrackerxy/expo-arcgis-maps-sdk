import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import { getShapefileInfo } from '../getShapefileInfo';

jest.mock('../ExpoArcgisMapsSdkModule');

const mod = ExpoArcgisMapsSdkModule as unknown as Record<string, jest.Mock>;

describe('getShapefileInfo', () => {
  beforeEach(() => mod.getShapefileInfo.mockClear());

  it('forwards a non-empty path to native and returns the metadata', async () => {
    mod.getShapefileInfo.mockResolvedValueOnce({
      credits: 'Esri',
      description: 'Aurora subdivisions',
      summary: 'Subdivisions',
      tags: ['aurora', 'subdivisions'],
      copyrightText: '',
    });
    const info = await getShapefileInfo('/data/Subdivisions.shp');
    expect(mod.getShapefileInfo).toHaveBeenCalledWith('/data/Subdivisions.shp');
    expect(info.summary).toBe('Subdivisions');
    expect(info.tags).toEqual(['aurora', 'subdivisions']);
  });

  it('rejects an empty path before calling native', async () => {
    await expect(getShapefileInfo('   ')).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
    expect(mod.getShapefileInfo).not.toHaveBeenCalled();
  });

  it('maps a native rejection to a stable error', async () => {
    mod.getShapefileInfo.mockRejectedValueOnce({ code: 'E_NATIVE_FAILURE', message: 'boom' });
    await expect(getShapefileInfo('/data/x.shp')).rejects.toMatchObject({
      code: 'E_NATIVE_FAILURE',
    });
  });
});
