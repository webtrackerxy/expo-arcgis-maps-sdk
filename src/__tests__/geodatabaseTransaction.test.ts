import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import { applyGeodatabaseTransaction } from '../geodatabase';

jest.mock('../ExpoArcgisMapsSdkModule');

const mod = ExpoArcgisMapsSdkModule as unknown as Record<string, jest.Mock>;
const PATH = '/tmp/x.geodatabase';

describe('applyGeodatabaseTransaction', () => {
  beforeEach(() => mod.applyGeodatabaseTransaction.mockClear());

  it('forwards path, table, count, and commit flag', async () => {
    mod.applyGeodatabaseTransaction.mockResolvedValueOnce({ committed: true, featureCount: 6 });
    const r = await applyGeodatabaseTransaction(PATH, 'T', 3, true);
    expect(mod.applyGeodatabaseTransaction).toHaveBeenCalledWith(PATH, 'T', 3, true);
    expect(r).toEqual({ committed: true, featureCount: 6 });
  });

  it('rejects bad path / tableName', async () => {
    await expect(applyGeodatabaseTransaction('', 'T', 1, true)).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    await expect(applyGeodatabaseTransaction(PATH, ' ', 1, true)).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
  });

  it('rejects non-positive addCount and non-boolean commit', async () => {
    await expect(applyGeodatabaseTransaction(PATH, 'T', 0, true)).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    await expect(
      applyGeodatabaseTransaction(PATH, 'T', 1, 'yes' as unknown as boolean)
    ).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
    expect(mod.applyGeodatabaseTransaction).not.toHaveBeenCalled();
  });

  it('maps a native rejection to a stable error', async () => {
    mod.applyGeodatabaseTransaction.mockRejectedValueOnce('boom');
    await expect(applyGeodatabaseTransaction(PATH, 'T', 1, false)).rejects.toMatchObject({
      code: 'E_NATIVE_FAILURE',
    });
  });
});
