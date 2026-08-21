import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import { authenticateWithIWA, authenticateWithOAuth, authenticateWithPKI } from '../auth';

jest.mock('../ExpoArcgisMapsSdkModule');

const mod = ExpoArcgisMapsSdkModule as unknown as Record<string, jest.Mock>;

describe('authenticateWithOAuth', () => {
  beforeEach(() => mod.authenticateWithOAuth.mockClear());

  it('normalizes options (defaulting the portal) and forwards them', async () => {
    mod.authenticateWithOAuth.mockResolvedValueOnce({ username: 'jane' });
    const user = await authenticateWithOAuth({ clientId: 'abc', redirectUri: 'myapp://auth' });
    expect(mod.authenticateWithOAuth).toHaveBeenCalledWith({
      clientId: 'abc',
      redirectUri: 'myapp://auth',
      portalUrl: 'https://www.arcgis.com',
    });
    expect(user.username).toBe('jane');
  });

  it('keeps an explicit portalUrl', async () => {
    await authenticateWithOAuth({
      clientId: 'abc',
      redirectUri: 'myapp://auth',
      portalUrl: 'https://org.maps.arcgis.com',
    });
    expect(mod.authenticateWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ portalUrl: 'https://org.maps.arcgis.com' })
    );
  });

  it('rejects a missing clientId or redirectUri before calling native', async () => {
    await expect(
      authenticateWithOAuth({ clientId: ' ', redirectUri: 'myapp://auth' })
    ).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
    await expect(authenticateWithOAuth({ clientId: 'abc', redirectUri: '' })).rejects.toMatchObject(
      { code: 'E_INVALID_ARGUMENT' }
    );
    expect(mod.authenticateWithOAuth).not.toHaveBeenCalled();
  });

  it('maps a native rejection (cancelled) to a stable error', async () => {
    mod.authenticateWithOAuth.mockRejectedValueOnce('boom');
    await expect(
      authenticateWithOAuth({ clientId: 'abc', redirectUri: 'myapp://auth' })
    ).rejects.toMatchObject({ code: 'E_NATIVE_FAILURE' });
  });
});

describe('authenticateWithIWA', () => {
  beforeEach(() => mod.authenticateWithIWA.mockClear());

  it('forwards the portal + Windows credentials', async () => {
    mod.authenticateWithIWA.mockResolvedValueOnce({ username: 'DOMAIN\\jane' });
    const user = await authenticateWithIWA({
      portalUrl: 'https://wa.example.com/portal',
      username: 'DOMAIN\\jane',
      password: 'secret',
    });
    expect(user.username).toBe('DOMAIN\\jane');
    expect(mod.authenticateWithIWA).toHaveBeenCalledWith({
      portalUrl: 'https://wa.example.com/portal',
      username: 'DOMAIN\\jane',
      password: 'secret',
    });
  });

  it('rejects missing fields before calling native', async () => {
    await expect(
      authenticateWithIWA({ portalUrl: '', username: 'x', password: 'y' })
    ).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
    expect(mod.authenticateWithIWA).not.toHaveBeenCalled();
  });
});

describe('authenticateWithPKI', () => {
  beforeEach(() => mod.authenticateWithPKI.mockClear());

  it('forwards an iOS certificate file path with a null Android alias', async () => {
    mod.authenticateWithPKI.mockResolvedValueOnce({ username: 'cert-user' });
    await authenticateWithPKI({
      portalUrl: 'https://pki.example.com/portal',
      certificatePath: '/certs/client.pfx',
      password: 'p12pass',
    });
    expect(mod.authenticateWithPKI).toHaveBeenCalledWith({
      portalUrl: 'https://pki.example.com/portal',
      certificatePath: '/certs/client.pfx',
      password: 'p12pass',
      certificateAlias: null,
    });
  });

  it('forwards an Android KeyChain alias', async () => {
    mod.authenticateWithPKI.mockResolvedValueOnce({ username: 'cert-user' });
    await authenticateWithPKI({
      portalUrl: 'https://pki.example.com/portal',
      certificateAlias: 'my-client-cert',
    });
    expect(mod.authenticateWithPKI).toHaveBeenCalledWith(
      expect.objectContaining({ certificateAlias: 'my-client-cert', certificatePath: null })
    );
  });

  it('rejects when neither a certificate path nor an alias is given', async () => {
    await expect(
      authenticateWithPKI({ portalUrl: 'https://pki.example.com/portal' })
    ).rejects.toMatchObject({ code: 'E_INVALID_ARGUMENT' });
    expect(mod.authenticateWithPKI).not.toHaveBeenCalled();
  });
});
