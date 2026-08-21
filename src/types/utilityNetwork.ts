import type { ArcgisGeometry } from './geometry';
import type { GeographicEnvelope } from './offline';

/** A utility-network trace type. See {@link TraceUtilityNetworkOptions}. */
export type UtilityTraceType =
  'connected' | 'subnetwork' | 'upstream' | 'downstream' | 'isolation' | 'loops' | 'shortestPath';

/**
 * Selects a single feature (by a `WHERE` clause on a feature-service layer) to
 * use as a trace starting point or barrier. The layer must belong to the
 * utility network's service.
 */
export type UtilityFeatureSelector = {
  /** URL to the feature-service layer (`.../FeatureServer/N`) the feature is in. */
  layerUrl: string;
  /** `WHERE` clause selecting exactly one feature (e.g. `"objectid = 1"`). */
  whereClause: string;
};

/** Options for {@link import('../utilityNetwork').traceUtilityNetwork}. */
export type TraceUtilityNetworkOptions = {
  /** URL to the utility network's feature service (`.../FeatureServer`). */
  serviceUrl: string;
  /** The kind of trace to run. */
  traceType: UtilityTraceType;
  /** One or more starting features. */
  startingPoints: UtilityFeatureSelector[];
  /** Features that stop the trace (e.g. an open valve for an isolation trace). */
  barriers?: UtilityFeatureSelector[];
};

/** Result of {@link import('../utilityNetwork').traceUtilityNetwork}. */
export type TraceUtilityNetworkResult = {
  /** Total number of network elements the trace returned. */
  elementCount: number;
  /**
   * Element counts grouped by asset-group name — a compact "load report" of
   * what the trace found.
   */
  byAssetGroup: Record<string, number>;
};

/** A utility-association kind to query. `all` returns every kind. */
export type UtilityAssociationKind = 'connectivity' | 'containment' | 'attachment' | 'all';

/** Options for {@link import('../utilityNetwork').getUtilityAssociations}. */
export type GetUtilityAssociationsOptions = {
  /** URL to the utility network's feature service (`.../FeatureServer`). */
  serviceUrl: string;
  /** The map extent (WGS 84) to fetch associations within. */
  extent: GeographicEnvelope;
  /**
   * Which association kind to return. Use `containment` to list a container's
   * contents; omit or `all` for every association. Defaults to `all`.
   */
  kind?: UtilityAssociationKind;
};

/** One utility association returned by {@link import('../utilityNetwork').getUtilityAssociations}. */
export type UtilityAssociationInfo = {
  /** The association kind (`connectivity`, `containment`, `attachment`, …). */
  kind: string;
  /** The association's geometry (WGS 84), when it has one. */
  geometry?: ArcgisGeometry;
};

/** Result of {@link import('../utilityNetwork').getUtilityAssociations}. */
export type GetUtilityAssociationsResult = {
  /** The associations within the requested extent. */
  associations: UtilityAssociationInfo[];
};

/** Options for {@link import('../utilityNetwork').validateUtilityNetworkTopology}. */
export type ValidateUtilityNetworkTopologyOptions = {
  /** URL to the utility network's feature service (`.../FeatureServer`). */
  serviceUrl: string;
  /** The extent (WGS 84) to validate. */
  extent: GeographicEnvelope;
};

/** Result of {@link import('../utilityNetwork').validateUtilityNetworkTopology}. */
export type ValidateUtilityNetworkTopologyResult = {
  /** Whether the validated area still has dirty areas / topology errors. */
  hasErrors: boolean;
};
