import ExpoArcgisMapsSdkModule from '../ExpoArcgisMapsSdkModule';
import { isArSupported } from '../arSupport';
import { validateArViewProps } from '../validation';

jest.mock('../ExpoArcgisMapsSdkModule');

function caught(fn: () => unknown): { code?: string; message?: string } {
  try {
    fn();
  } catch (error) {
    return error as { code?: string; message?: string };
  }
  throw new Error('expected the function to throw');
}

const SCENE = { basemap: 'arcGISImagery' as const };

describe('validateArViewProps', () => {
  it('normalizes a world-scale view with tracking + calibration', () => {
    const result = validateArViewProps({
      scene: SCENE,
      mode: 'worldScale',
      trackingMode: 'geo',
      clippingDistanceMeters: 200,
      calibrationVisible: false,
    });
    expect(result.mode).toBe('worldScale');
    expect(result.trackingMode).toBe('geo');
    expect(result.clippingDistanceMeters).toBe(200);
    expect(result.calibrationVisible).toBe(false);
    // Tabletop/flyover-only fields stay absent.
    expect(result.anchor).toBeUndefined();
    expect(result.initialCamera).toBeUndefined();
  });

  it('normalizes a tabletop view with an anchor and translation factor', () => {
    const result = validateArViewProps({
      scene: SCENE,
      mode: 'tabletop',
      anchor: { latitude: 34, longitude: -117 },
      translationFactor: 500,
    });
    expect(result.anchor).toEqual({ latitude: 34, longitude: -117 });
    expect(result.translationFactor).toBe(500);
  });

  it('normalizes a flyover view with an initial camera', () => {
    const result = validateArViewProps({
      scene: SCENE,
      mode: 'flyover',
      initialCamera: { latitude: 46, longitude: 6, altitude: 3000, heading: 200 },
      translationFactor: 1000,
    });
    expect(result.initialCamera?.altitude).toBe(3000);
    expect(result.initialCamera?.heading).toBe(200);
  });

  it('rejects an unknown mode', () => {
    expect(
      caught(() => validateArViewProps({ scene: SCENE, mode: 'holograph' as never })).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('requires an anchor for tabletop and a camera for flyover', () => {
    expect(caught(() => validateArViewProps({ scene: SCENE, mode: 'tabletop' })).message).toMatch(
      /anchor/
    );
    expect(caught(() => validateArViewProps({ scene: SCENE, mode: 'flyover' })).message).toMatch(
      /initialCamera/
    );
  });

  it('rejects a non-positive translation factor or clipping distance', () => {
    expect(
      caught(() =>
        validateArViewProps({
          scene: SCENE,
          mode: 'flyover',
          initialCamera: cam(),
          translationFactor: 0,
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(
      caught(() =>
        validateArViewProps({ scene: SCENE, mode: 'worldScale', clippingDistanceMeters: -5 })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a bad tracking mode', () => {
    expect(
      caught(() =>
        validateArViewProps({ scene: SCENE, mode: 'worldScale', trackingMode: 'gps' as never })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('propagates an invalid scene source', () => {
    expect(caught(() => validateArViewProps({ scene: {} as never, mode: 'worldScale' })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
  });
});

function cam() {
  return { latitude: 1, longitude: 2, altitude: 100 };
}

describe('isArSupported', () => {
  it('returns the native capability result', async () => {
    await expect(isArSupported()).resolves.toEqual({ supported: true });
    expect(ExpoArcgisMapsSdkModule.isArSupported).toHaveBeenCalled();
  });
});
