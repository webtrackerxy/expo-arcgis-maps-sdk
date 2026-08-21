import { startGeoprocessingJob } from '../geoprocessing';
import { validateGeoprocessingJobOptions } from '../validation';

jest.mock('../ExpoArcgisMapsSdkModule');

function caught(fn: () => unknown): { code?: string } {
  try {
    fn();
  } catch (error) {
    return error as { code?: string };
  }
  throw new Error('expected the function to throw');
}

describe('validateGeoprocessingJobOptions', () => {
  it('normalizes string, double, and point inputs', () => {
    const result = validateGeoprocessingJobOptions({
      serviceUrl: 'https://example.com/arcgis/rest/services/GP/GPServer/Task',
      inputs: [
        { name: 'Query', type: 'string', value: "('Fire')" },
        { name: 'Distance', type: 'double', value: 500 },
        { name: 'Observer', type: 'point', point: { latitude: 45, longitude: -120 } },
      ],
    });
    expect(result.inputs).toHaveLength(3);
    expect(result.inputs[0]).toEqual({ name: 'Query', type: 'string', value: "('Fire')" });
    expect(result.inputs[1]).toEqual({ name: 'Distance', type: 'double', value: 500 });
    expect(result.inputs[2]).toMatchObject({ name: 'Observer', type: 'point' });
  });

  it('rejects a missing serviceUrl or empty inputs', () => {
    expect(
      caught(() => validateGeoprocessingJobOptions({ serviceUrl: '', inputs: [] } as never)).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(
      caught(() =>
        validateGeoprocessingJobOptions({ serviceUrl: 'https://x/GPServer/T', inputs: [] })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a wrong-typed input value', () => {
    expect(
      caught(() =>
        validateGeoprocessingJobOptions({
          serviceUrl: 'https://x/GPServer/T',
          inputs: [{ name: 'Distance', type: 'double', value: 'far' as never }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects an unsupported input type', () => {
    expect(
      caught(() =>
        validateGeoprocessingJobOptions({
          serviceUrl: 'https://x/GPServer/T',
          inputs: [{ name: 'X', type: 'raster' } as never],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});

describe('startGeoprocessingJob', () => {
  it('validates then returns a job handle with the native id', async () => {
    const job = await startGeoprocessingJob({
      serviceUrl: 'https://example.com/arcgis/rest/services/GP/GPServer/Task',
      inputs: [{ name: 'Query', type: 'string', value: "('Fire')" }],
    });
    expect(job.id).toBe('job-gp');
    expect(typeof job.cancel).toBe('function');
    expect(typeof job.onProgress).toBe('function');
  });
});
