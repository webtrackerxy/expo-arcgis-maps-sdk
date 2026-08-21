/** Options for {@link import('../dynamicEntities').queryDynamicEntities}. */
export type QueryDynamicEntitiesOptions = {
  /** URL to an ArcGIS stream service (`.../StreamServer`). */
  url: string;
  /** Limit the result to these track ids. Omit to return all current entities. */
  trackIds?: string[];
};

/** A single dynamic entity's current state. */
export type DynamicEntityInfo = {
  /** The entity's current attribute values. */
  attributes: Record<string, string | number | boolean | null>;
  /** Current latitude (WGS 84), when the entity has a point location. */
  latitude?: number;
  /** Current longitude (WGS 84), when the entity has a point location. */
  longitude?: number;
};

/** Result of {@link import('../dynamicEntities').queryDynamicEntities}. */
export type QueryDynamicEntitiesResult = {
  /** The dynamic entities matching the query, at the moment it ran. */
  entities: DynamicEntityInfo[];
};
