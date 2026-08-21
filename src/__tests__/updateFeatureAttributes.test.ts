import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import { updateFeatureAttributes } from '../updateFeatureAttributes';

jest.mock('../ExpoArcgisMapsSdkModule');

const mod = ExpoArcgisMapsSdkModule as unknown as Record<string, jest.Mock>;
const URL = 'https://example.com/FeatureServer/0';

describe('updateFeatureAttributes', () => {
  beforeEach(() => mod.updateFeatureAttributes.mockClear());

  it('forwards url, objectId, and attributes', async () => {
    mod.updateFeatureAttributes.mockResolvedValueOnce({ objectId: 42 });
    const result = await updateFeatureAttributes(URL, 42, { typdamage: 'Affected' });
    expect(mod.updateFeatureAttributes).toHaveBeenCalledWith({
      serviceUrl: URL,
      objectId: 42,
      attributes: { typdamage: 'Affected' },
    });
    expect(result.objectId).toBe(42);
  });

  it('rejects bad url / non-integer objectId', async () => {
    await expect(updateFeatureAttributes('', 1, { a: 1 })).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    await expect(updateFeatureAttributes(URL, 1.5, { a: 1 })).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
  });

  it('rejects empty attributes', async () => {
    await expect(updateFeatureAttributes(URL, 1, {})).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    expect(mod.updateFeatureAttributes).not.toHaveBeenCalled();
  });

  it('maps a native rejection to a stable error', async () => {
    mod.updateFeatureAttributes.mockRejectedValueOnce('boom');
    await expect(updateFeatureAttributes(URL, 1, { a: 1 })).rejects.toMatchObject({
      code: 'E_NATIVE_FAILURE',
    });
  });
});
