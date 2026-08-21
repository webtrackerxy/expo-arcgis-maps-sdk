import {
  getUtilityAssociations,
  traceUtilityNetwork,
  validateUtilityNetworkTopology,
} from '../utilityNetwork';
import {
  validateGetUtilityAssociationsOptions,
  validateTraceUtilityNetworkOptions,
  validateValidateUtilityNetworkTopologyOptions,
} from '../validation';

jest.mock('../ExpoArcgisMapsSdkModule');

function caught(fn: () => unknown): { code?: string } {
  try {
    fn();
  } catch (error) {
    return error as { code?: string };
  }
  throw new Error('expected the function to throw');
}

const EXTENT = { minLatitude: 41, minLongitude: -88, maxLatitude: 42, maxLongitude: -87 };

describe('validateTraceUtilityNetworkOptions', () => {
  it('normalizes a trace with starting points and barriers', () => {
    const result = validateTraceUtilityNetworkOptions({
      serviceUrl: 'https://x/FeatureServer',
      traceType: 'isolation',
      startingPoints: [{ layerUrl: 'https://x/FeatureServer/0', whereClause: 'objectid = 1' }],
      barriers: [{ layerUrl: 'https://x/FeatureServer/0', whereClause: 'objectid = 2' }],
    });
    expect(result.traceType).toBe('isolation');
    expect(result.startingPoints).toHaveLength(1);
    expect(result.barriers).toHaveLength(1);
  });

  it('rejects a bad trace type or empty starting points', () => {
    expect(
      caught(() =>
        validateTraceUtilityNetworkOptions({
          serviceUrl: 'https://x',
          traceType: 'sideways' as never,
          startingPoints: [{ layerUrl: 'https://x/0', whereClause: '1=1' }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(
      caught(() =>
        validateTraceUtilityNetworkOptions({
          serviceUrl: 'https://x',
          traceType: 'connected',
          startingPoints: [],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});

describe('validateGetUtilityAssociationsOptions', () => {
  it('normalizes with a kind', () => {
    const result = validateGetUtilityAssociationsOptions({
      serviceUrl: 'https://x/FeatureServer',
      extent: EXTENT,
      kind: 'containment',
    });
    expect(result.kind).toBe('containment');
  });

  it('rejects a bad kind', () => {
    expect(
      caught(() =>
        validateGetUtilityAssociationsOptions({
          serviceUrl: 'https://x',
          extent: EXTENT,
          kind: 'sideways' as never,
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});

describe('utility network module functions', () => {
  it('trace / associations / validate return native results', async () => {
    const trace = await traceUtilityNetwork({
      serviceUrl: 'https://x/FeatureServer',
      traceType: 'connected',
      startingPoints: [{ layerUrl: 'https://x/FeatureServer/0', whereClause: '1=1' }],
    });
    expect(trace.elementCount).toBe(3);

    const assoc = await getUtilityAssociations({ serviceUrl: 'https://x', extent: EXTENT });
    expect(assoc.associations).toHaveLength(1);

    const validation = await validateUtilityNetworkTopology({
      serviceUrl: 'https://x',
      extent: EXTENT,
    });
    expect(validation.hasErrors).toBe(false);
  });

  it('rejects a missing serviceUrl for validate', () => {
    expect(
      caught(() =>
        validateValidateUtilityNetworkTopologyOptions({ serviceUrl: '', extent: EXTENT } as never)
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});
