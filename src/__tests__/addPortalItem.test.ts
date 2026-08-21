import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import { addPortalItem } from '../addPortalItem';

jest.mock('../ExpoArcgisMapsSdkModule');

const mod = ExpoArcgisMapsSdkModule as unknown as Record<string, jest.Mock>;

describe('addPortalItem', () => {
  beforeEach(() => mod.addPortalItem.mockClear());

  it('normalizes and forwards options', async () => {
    mod.addPortalItem.mockResolvedValueOnce({ itemId: 'abc' });
    const result = await addPortalItem({ title: 'Item', json: '{"a":1}' });
    expect(mod.addPortalItem).toHaveBeenCalledWith({
      title: 'Item',
      json: '{"a":1}',
      description: '',
    });
    expect(result.itemId).toBe('abc');
  });

  it('rejects empty title or json', async () => {
    await expect(addPortalItem({ title: ' ', json: '{}' })).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    await expect(addPortalItem({ title: 'x', json: '' })).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    expect(mod.addPortalItem).not.toHaveBeenCalled();
  });

  it('maps a native rejection to a stable error', async () => {
    mod.addPortalItem.mockRejectedValueOnce('boom');
    await expect(addPortalItem({ title: 'x', json: '{}' })).rejects.toMatchObject({
      code: 'E_NATIVE_FAILURE',
    });
  });
});
