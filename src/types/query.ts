import type { GeographicPoint } from './common';
import type { GeographicEnvelope } from './offline';

/** Options for querying features from a feature layer already on the map. */
export type FeatureQueryOptions = {
  /**
   * Id of the feature layer to query. Must match a
   * {@link import('./map').FeatureLayerSource.id} currently on the map.
   */
  layerId: string;
  /**
   * SQL-92 `WHERE` clause selecting features (e.g. `"STATUS = 'open'"`).
   * Defaults to `"1=1"` (all features). Named `whereClause` because `where` is a
   * reserved keyword on the native platforms.
   */
  whereClause?: string;
  /** Maximum number of features to return. Positive integer when provided. */
  maxResults?: number;
  /**
   * When `true`, the matching features are highlighted (selected) on the map
   * layer and any previous selection on that layer is cleared. Defaults to
   * `false` (query returns data only, no visual change).
   */
  select?: boolean;
};

/**
 * A single feature returned by {@link import('./view').ArcgisMapViewRef.queryFeatures}.
 * Only serializable attribute values cross the boundary; native geometry does not.
 */
export type FeatureQueryResult = {
  /** Serializable attributes of the feature. */
  attributes: Record<string, string | number | boolean | null>;
  /** Representative location (feature point or geometry extent center), when available. */
  location?: GeographicPoint;
};

/** Options for {@link import('./view').ArcgisMapViewRef.selectFeatures}. */
export type SelectFeaturesOptions = {
  /** Id of the feature layer to select in. */
  layerId: string;
  /** SQL-92 `WHERE` clause selecting features. Defaults to `"1=1"` (all). */
  whereClause?: string;
};

/** Options for {@link import('./view').ArcgisMapViewRef.queryFeatureExtent}. */
export type QueryExtentOptions = {
  /** Id of the feature layer to query. */
  layerId: string;
  /** SQL-92 `WHERE` clause. Defaults to `"1=1"` (all features). */
  whereClause?: string;
};

/** The count and combined extent of the features matching a query. */
export type QueryExtentResult = {
  /** Number of matching features. */
  count: number;
  /** Bounding box (WGS 84) of the matches, absent when the query matched nothing. */
  extent?: GeographicEnvelope;
};

/** An aggregate statistic to compute over a field. */
export type StatisticType =
  'count' | 'sum' | 'average' | 'min' | 'max' | 'standardDeviation' | 'variance';

/** One statistic in a {@link QueryStatisticsOptions}. */
export type StatisticDefinition = {
  /** Field to aggregate. */
  field: string;
  /** The aggregate to compute. */
  type: StatisticType;
  /** Result key; defaults to `"<field>_<type>"`. */
  outName?: string;
};

/** Options for {@link import('./view').ArcgisMapViewRef.queryStatistics}. */
export type QueryStatisticsOptions = {
  /** Id of the feature layer to aggregate over. */
  layerId: string;
  /** The statistics to compute (at least one). */
  statistics: StatisticDefinition[];
  /** SQL-92 `WHERE` clause selecting rows. Defaults to all features. */
  whereClause?: string;
  /** Fields to group results by (SQL `GROUP BY`). Omit for a single overall row. */
  groupByFields?: string[];
};

/** One row of {@link import('./view').ArcgisMapViewRef.queryStatistics} results. */
export type StatisticsRow = {
  /** Group field values for this row (empty when not grouping). */
  group: Record<string, string | number>;
  /** Computed statistics keyed by each definition's `outName`. */
  statistics: Record<string, number | string>;
};

/** Options for {@link import('./view').ArcgisMapViewRef.queryRelatedFeatures}. */
export type RelatedFeaturesOptions = {
  /** Id of the feature layer whose related records to query. */
  layerId: string;
  /** Object id of the origin feature whose related features to fetch. */
  objectId: number;
};

/** Options for {@link import('../queryTimeExtent').queryFeaturesInTimeExtent}. */
export type TimeExtentQueryOptions = {
  /** URL to a time-aware feature service layer (`.../FeatureServer/N`). */
  serviceUrl: string;
  /** Start of the time window, epoch milliseconds. */
  startTime: number;
  /** End of the time window, epoch milliseconds. Must be `>= startTime`. */
  endTime: number;
  /** Optional additional `WHERE` clause. Defaults to all features (`1=1`). */
  whereClause?: string;
};
