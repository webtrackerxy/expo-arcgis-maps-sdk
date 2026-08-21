import { ARCGIS_ERROR_CODES, ArcgisSdkError, isArcgisError, toArcgisError } from '../errors';

describe('errors', () => {
  describe('ArcgisSdkError', () => {
    it('is an Error carrying a stable code and optional details', () => {
      const err = new ArcgisSdkError('E_INVALID_ARGUMENT', 'bad input', { field: 'apiKey' });
      expect(err).toBeInstanceOf(Error);
      expect(err.code).toBe('E_INVALID_ARGUMENT');
      expect(err.message).toBe('bad input');
      expect(err.details).toEqual({ field: 'apiKey' });
    });

    it('omits details from the plain view when absent', () => {
      const err = new ArcgisSdkError('E_UNSUPPORTED', 'nope');
      expect(err.toArcgisError()).toEqual({ code: 'E_UNSUPPORTED', message: 'nope' });
      expect('details' in err.toArcgisError()).toBe(false);
    });
  });

  describe('isArcgisError', () => {
    it('accepts a well-formed error', () => {
      expect(isArcgisError({ code: 'E_MAP_LOAD_FAILED', message: 'x' })).toBe(true);
    });

    it('rejects unknown codes and malformed values', () => {
      expect(isArcgisError({ code: 'NOPE', message: 'x' })).toBe(false);
      expect(isArcgisError({ message: 'x' })).toBe(false);
      expect(isArcgisError(null)).toBe(false);
      expect(isArcgisError('E_UNSUPPORTED')).toBe(false);
    });
  });

  describe('toArcgisError', () => {
    it('passes through an existing ArcgisError', () => {
      const input = { code: 'E_LAYER_LOAD_FAILED' as const, message: 'boom', details: { a: 1 } };
      expect(toArcgisError(input)).toEqual(input);
    });

    it('adopts a native code only when it is one of ours', () => {
      expect(toArcgisError({ code: 'E_AUTHENTICATION_FAILED', message: 'denied' })).toEqual({
        code: 'E_AUTHENTICATION_FAILED',
        message: 'denied',
      });
      expect(toArcgisError({ code: 'ESRI_9999', message: 'weird' })).toEqual({
        code: 'E_NATIVE_FAILURE',
        message: 'weird',
      });
    });

    it('uses the fallback code and a generic message for opaque values', () => {
      expect(toArcgisError('raw native text')).toEqual({
        code: 'E_NATIVE_FAILURE',
        message: 'ArcGIS operation failed',
      });
      expect(toArcgisError(undefined, 'E_MAP_LOAD_FAILED')).toEqual({
        code: 'E_MAP_LOAD_FAILED',
        message: 'ArcGIS operation failed',
      });
    });

    it('never leaks non-ArcgisError detail objects', () => {
      // A raw thrown Error should not surface its stack/extra props as details.
      const mapped = toArcgisError(new Error('secret token abc'));
      expect(mapped.code).toBe('E_NATIVE_FAILURE');
      expect(mapped.details).toBeUndefined();
    });
  });

  it('exposes every documented code exactly once', () => {
    expect(new Set(ARCGIS_ERROR_CODES).size).toBe(ARCGIS_ERROR_CODES.length);
    expect(ARCGIS_ERROR_CODES).toContain('E_NOT_CONFIGURED');
    expect(ARCGIS_ERROR_CODES).toContain('E_JOB_CANCELLED');
  });
});
