import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import { createAndSaveMap } from '../createAndSaveMap';

jest.mock('../ExpoArcgisMapsSdkModule');

const mod = ExpoArcgisMapsSdkModule as unknown as Record<string, jest.Mock>;

describe('createAndSaveMap', () => {
  beforeEach(() => mod.createAndSaveMap.mockClear());

  it('normalizes and forwards options', async () => {
    mod.createAndSaveMap.mockResolvedValueOnce({ itemId: 'abc123' });
    const result = await createAndSaveMap({ title: 'My Map', basemap: 'arcGISTopographic' });
    expect(mod.createAndSaveMap).toHaveBeenCalledWith({
      title: 'My Map',
      basemap: 'arcGISTopographic',
      description: '',
      tags: [],
    });
    expect(result.itemId).toBe('abc123');
  });

  it('rejects an empty title', async () => {
    await expect(createAndSaveMap({ title: '  ', basemap: 'arcGISStreets' })).rejects.toMatchObject(
      { code: 'E_INVALID_ARGUMENT' }
    );
    expect(mod.createAndSaveMap).not.toHaveBeenCalled();
  });

  it('rejects an invalid basemap', async () => {
    await expect(
      createAndSaveMap({ title: 'x', basemap: 'notReal' as never })
    ).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
  });

  it('maps a native rejection (not signed in) to a stable error', async () => {
    mod.createAndSaveMap.mockRejectedValueOnce('boom');
    await expect(createAndSaveMap({ title: 'x', basemap: 'arcGISStreets' })).rejects.toMatchObject({
      code: 'E_NATIVE_FAILURE',
    });
  });
});
