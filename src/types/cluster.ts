import type { ArcgisColor } from './color';

/**
 * Point clustering (feature reduction) for a feature layer: nearby points are
 * aggregated into sized cluster symbols.
 */
export type ClusteringOptions = {
  /** Whether clustering is active. */
  enabled: boolean;
  /** Cluster radius in points; larger groups more points. Defaults to `60`. */
  radius?: number;
  /** Largest cluster-symbol diameter in points. Defaults to a native value. */
  maxSymbolSize?: number;
  /** Cluster bubble color. Defaults to a blue circle. */
  color?: ArcgisColor;
};
