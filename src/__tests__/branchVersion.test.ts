import { createServiceVersion, getServiceVersions } from '../branchVersion';

jest.mock('../ExpoArcgisMapsSdkModule');

function rejection(fn: () => unknown): Promise<{ code?: string }> {
  return Promise.resolve()
    .then(fn)
    .then(
      () => {
        throw new Error('expected a rejection');
      },
      (error) => error as { code?: string }
    );
}

describe('createServiceVersion', () => {
  it('returns the server-assigned version name', async () => {
    const result = await createServiceVersion({
      serviceUrl: 'https://x/FeatureServer',
      versionName: 'edits',
    });
    expect(result.versionName).toBe('owner.edits');
  });

  it('rejects a missing serviceUrl or versionName', async () => {
    expect(
      (await rejection(() => createServiceVersion({ serviceUrl: '', versionName: 'v' }))).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(
      (await rejection(() => createServiceVersion({ serviceUrl: 'https://x', versionName: '  ' })))
        .code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects an invalid access', async () => {
    expect(
      (
        await rejection(() =>
          createServiceVersion({
            serviceUrl: 'https://x',
            versionName: 'v',
            access: 'secret' as never,
          })
        )
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});

describe('getServiceVersions', () => {
  it('lists the service versions', async () => {
    const versions = await getServiceVersions('https://x/FeatureServer');
    expect(Array.isArray(versions)).toBe(true);
    expect(versions[0]).toHaveProperty('name');
    expect(versions[0]).toHaveProperty('access');
  });

  it('rejects a missing serviceUrl', async () => {
    expect((await rejection(() => getServiceVersions('  '))).code).toBe('E_INVALID_ARGUMENT');
  });
});
