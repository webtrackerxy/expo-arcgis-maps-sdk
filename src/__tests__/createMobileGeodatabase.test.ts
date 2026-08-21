import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import { createMobileGeodatabase } from '../createMobileGeodatabase';

jest.mock('../ExpoArcgisMapsSdkModule');
const mod = ExpoArcgisMapsSdkModule as unknown as Record<string, jest.Mock>;

const valid = {
  tableName: 'demo',
  geometryType: 'point' as const,
  fields: [{ name: 'name', type: 'text' as const }],
};

describe('createMobileGeodatabase', () => {
  beforeEach(() => mod.createMobileGeodatabase?.mockClear());

  it('forwards valid options', async () => {
    await createMobileGeodatabase(valid);
    expect(mod.createMobileGeodatabase).toHaveBeenCalledWith(valid);
  });

  it('rejects an empty table name, bad geometry type, and empty/invalid fields', async () => {
    await expect(createMobileGeodatabase({ ...valid, tableName: '' })).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    await expect(
      createMobileGeodatabase({ ...valid, geometryType: 'blob' as never })
    ).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
    await expect(createMobileGeodatabase({ ...valid, fields: [] })).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    await expect(
      createMobileGeodatabase({ ...valid, fields: [{ name: 'x', type: 'money' as never }] })
    ).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
  });
});
