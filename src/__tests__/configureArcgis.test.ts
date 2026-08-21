import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import { configureArcgis } from '../configureArcgis';
import type { ArcgisError } from '../errors';

// Replace the native bridge with the manual mock in src/__mocks__.
jest.mock('../ExpoArcgisMapsSdkModule');

const mockedConfigure = ExpoArcgisMapsSdkModule.configure as jest.MockedFunction<
  typeof ExpoArcgisMapsSdkModule.configure
>;

describe('configureArcgis', () => {
  beforeEach(() => {
    mockedConfigure.mockReset();
    mockedConfigure.mockResolvedValue(undefined);
  });

  it('validates then forwards the normalized options to native', async () => {
    await configureArcgis({ apiKey: 'key-123' });
    expect(mockedConfigure).toHaveBeenCalledTimes(1);
    expect(mockedConfigure).toHaveBeenCalledWith({ apiKey: 'key-123' });
  });

  it('rejects invalid input before calling native', async () => {
    await expect(configureArcgis({ apiKey: '' })).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    expect(mockedConfigure).not.toHaveBeenCalled();
  });

  it('maps a native rejection to a stable error', async () => {
    mockedConfigure.mockRejectedValueOnce({ code: 'E_NOT_CONFIGURED', message: 'no key' });
    await expect(configureArcgis({ apiKey: 'key-123' })).rejects.toEqual<ArcgisError>({
      code: 'E_NOT_CONFIGURED',
      message: 'no key',
    });
  });

  it('maps an opaque native throw to E_NATIVE_FAILURE', async () => {
    mockedConfigure.mockRejectedValueOnce('kaboom');
    await expect(configureArcgis({ apiKey: 'key-123' })).rejects.toMatchObject({
      code: 'E_NATIVE_FAILURE',
    });
  });
});
