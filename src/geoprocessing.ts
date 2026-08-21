import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { toArcgisError } from './errors';
import { makeJobHandle } from './jobs';
import type {
  GeoprocessingJob,
  GeoprocessingJobOptions,
  GeoprocessingJobResult,
} from './types/geoprocessing';
import { validateGeoprocessingJobOptions } from './validation';

/**
 * Start a geoprocessing job on an ArcGIS geoprocessing service (e.g. hotspot
 * analysis or a viewshed calculation). Returns a {@link GeoprocessingJob} handle
 * with progress, cancellation, and a typed result (a result map-image URL and/or
 * output geometries). The task's execution type (sync/async) is taken from the
 * service.
 */
export async function startGeoprocessingJob(
  options: GeoprocessingJobOptions
): Promise<GeoprocessingJob> {
  const validated = validateGeoprocessingJobOptions(options);
  // The `value` field is a string for `string` inputs and a number for `double`
  // inputs; the native Record layer needs a fixed type per field, so split it
  // into `stringValue` / `doubleValue` on the wire.
  const nativeOptions = {
    serviceUrl: validated.serviceUrl,
    inputs: validated.inputs.map((input) => {
      if (input.type === 'string') {
        return { name: input.name, type: 'string' as const, stringValue: input.value };
      }
      if (input.type === 'double') {
        return { name: input.name, type: 'double' as const, doubleValue: input.value };
      }
      return { name: input.name, type: 'point' as const, point: input.point };
    }),
  };
  let id: string;
  try {
    id = await ExpoArcgisMapsSdkModule.startGeoprocessingJob(nativeOptions);
  } catch (error) {
    throw toArcgisError(error);
  }
  return makeJobHandle<GeoprocessingJobResult>(id);
}
