import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { toArcgisError } from './errors';
import type {
  GetUtilityAssociationsOptions,
  GetUtilityAssociationsResult,
  TraceUtilityNetworkOptions,
  TraceUtilityNetworkResult,
  ValidateUtilityNetworkTopologyOptions,
  ValidateUtilityNetworkTopologyResult,
} from './types/utilityNetwork';
import {
  validateGetUtilityAssociationsOptions,
  validateTraceUtilityNetworkOptions,
  validateValidateUtilityNetworkTopologyOptions,
} from './validation';

/**
 * Run a trace on a utility network — `connected`, `subnetwork`, `upstream`,
 * `downstream`, `isolation`, `loops`, or `shortestPath`. Returns the count of
 * elements found and a breakdown by asset group (a compact load report). Loads
 * the network, resolves each starting point / barrier feature, traces, and
 * aggregates the result.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   bad options, `E_AUTHENTICATION_FAILED` without access, `E_NATIVE_FAILURE`
 *   otherwise).
 */
export async function traceUtilityNetwork(
  options: TraceUtilityNetworkOptions
): Promise<TraceUtilityNetworkResult> {
  const validated = validateTraceUtilityNetworkOptions(options);
  try {
    return await ExpoArcgisMapsSdkModule.traceUtilityNetwork(validated);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * List the utility associations (connectivity / containment / attachment) within
 * an extent. Use `kind: 'containment'` to list a container's contents.
 *
 * @throws An {@link import('./errors').ArcgisError}.
 */
export async function getUtilityAssociations(
  options: GetUtilityAssociationsOptions
): Promise<GetUtilityAssociationsResult> {
  const validated = validateGetUtilityAssociationsOptions(options);
  try {
    return await ExpoArcgisMapsSdkModule.getUtilityAssociations(validated);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Validate a utility network's topology over an extent, reporting whether any
 * dirty areas / topology errors remain.
 *
 * @throws An {@link import('./errors').ArcgisError}.
 */
export async function validateUtilityNetworkTopology(
  options: ValidateUtilityNetworkTopologyOptions
): Promise<ValidateUtilityNetworkTopologyResult> {
  const validated = validateValidateUtilityNetworkTopologyOptions(options);
  try {
    return await ExpoArcgisMapsSdkModule.validateUtilityNetworkTopology(validated);
  } catch (error) {
    throw toArcgisError(error);
  }
}
