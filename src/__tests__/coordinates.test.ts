import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import { formatCoordinates } from '../coordinates';

// `jest.mock` is hoisted above the imports by babel-jest.
jest.mock('../ExpoArcgisMapsSdkModule');

const mockModule = ExpoArcgisMapsSdkModule as unknown as {
  formatCoordinates: jest.Mock;
};

describe('formatCoordinates', () => {
  beforeEach(() => mockModule.formatCoordinates.mockClear());

  it('validates the point and forwards it to the native module', async () => {
    const result = await formatCoordinates({ latitude: 34.0909, longitude: -118.7051 });
    expect(mockModule.formatCoordinates).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 34.0909, longitude: -118.7051 })
    );
    expect(result).toHaveProperty('mgrs');
    expect(result).toHaveProperty('utm');
  });

  it('rejects a malformed point with E_INVALID_ARGUMENT', async () => {
    await expect(formatCoordinates({ latitude: 999, longitude: 0 })).rejects.toMatchObject({
      code: 'E_INVALID_ARGUMENT',
    });
    expect(mockModule.formatCoordinates).not.toHaveBeenCalled();
  });
});
