import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import { startScheduledUpdatesJob } from '../offline';

jest.mock('../ExpoArcgisMapsSdkModule');

const mockedStart = ExpoArcgisMapsSdkModule.startScheduledUpdatesJob as jest.MockedFunction<
  typeof ExpoArcgisMapsSdkModule.startScheduledUpdatesJob
>;

describe('startScheduledUpdatesJob', () => {
  beforeEach(() => {
    mockedStart.mockReset();
  });

  it('rejects an empty package path before calling native', async () => {
    await expect(startScheduledUpdatesJob('   ')).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    expect(mockedStart).not.toHaveBeenCalled();
  });

  it('forwards a valid package path to native', async () => {
    mockedStart.mockResolvedValueOnce('job-1');
    const job = await startScheduledUpdatesJob('/data/area.mmpk');
    expect(mockedStart).toHaveBeenCalledWith('/data/area.mmpk');
    expect(job.id).toBe('job-1');
  });

  it('maps a native rejection to a stable error', async () => {
    mockedStart.mockRejectedValueOnce('boom');
    await expect(startScheduledUpdatesJob('/data/area.mmpk')).rejects.toMatchObject({
      code: 'E_NATIVE_FAILURE',
    });
  });
});
