import { queryDynamicEntities } from '../dynamicEntities';

jest.mock('../ExpoArcgisMapsSdkModule');

function caught(fn: () => unknown): Promise<{ code?: string }> {
  return Promise.resolve()
    .then(fn)
    .then(
      () => {
        throw new Error('expected a rejection');
      },
      (error) => error as { code?: string }
    );
}

describe('queryDynamicEntities', () => {
  it('returns the native entities for a valid url', async () => {
    const result = await queryDynamicEntities({ url: 'https://x/StreamServer' });
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0]).toMatchObject({ latitude: 1, longitude: 2 });
  });

  it('rejects a missing url', async () => {
    expect((await caught(() => queryDynamicEntities({ url: '  ' }))).code).toBe(
      'E_INVALID_ARGUMENT'
    );
  });

  it('rejects an empty track id', async () => {
    expect(
      (await caught(() => queryDynamicEntities({ url: 'https://x/StreamServer', trackIds: [''] })))
        .code
    ).toBe('E_INVALID_ARGUMENT');
  });
});
