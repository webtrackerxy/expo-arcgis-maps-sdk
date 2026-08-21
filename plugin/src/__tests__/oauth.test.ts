import { parseRedirectUri } from '../withArcgisOAuth';

describe('parseRedirectUri', () => {
  it('parses a scheme + host', () => {
    expect(parseRedirectUri('my-arcgis-app://auth')).toEqual({
      scheme: 'my-arcgis-app',
      host: 'auth',
    });
  });

  it('parses a scheme + host + path', () => {
    expect(parseRedirectUri('myapp://auth/oauth')).toEqual({
      scheme: 'myapp',
      host: 'auth',
      path: '/oauth',
    });
  });

  it('parses a bare scheme with no host', () => {
    expect(parseRedirectUri('myapp://')).toEqual({ scheme: 'myapp' });
  });

  it('preserves dots and hyphens in the scheme (reverse-DNS style)', () => {
    expect(parseRedirectUri('com.example.app://auth').scheme).toBe('com.example.app');
  });

  it('trims surrounding whitespace', () => {
    expect(parseRedirectUri('  myapp://auth  ').scheme).toBe('myapp');
  });

  it('throws when there is no scheme', () => {
    expect(() => parseRedirectUri('auth')).toThrow(/URL scheme/);
    expect(() => parseRedirectUri('/oauth')).toThrow(/URL scheme/);
  });
});
