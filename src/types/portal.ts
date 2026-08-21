import type { BasemapStyle } from './basemap';

/** Options for {@link import('../createAndSaveMap').createAndSaveMap}. */
export type CreateAndSaveMapOptions = {
  /** The new item's title. */
  title: string;
  /** The basemap style for the new map. */
  basemap: BasemapStyle;
  /** Optional item description. */
  description?: string;
  /** Optional item tags. */
  tags?: string[];
};

/** The saved map's new portal item, from `createAndSaveMap`. */
export type CreateAndSaveMapResult = {
  /** The new portal item id. */
  itemId: string;
};

/** Options for {@link import('../addPortalItem').addPortalItem}. */
export type AddPortalItemOptions = {
  /** The new item's title. */
  title: string;
  /** The item's content as a JSON string (a feature collection definition). */
  json: string;
  /** Optional item description. */
  description?: string;
};

/** The added portal item, from `addPortalItem`. */
export type AddPortalItemResult = {
  /** The new portal item id. */
  itemId: string;
};

/** A web map found by {@link import('../searchWebMaps').searchWebMaps}. */
export type WebMapSearchResult = {
  /** The portal item id, usable as {@link ArcgisMapSource.webMapItemId}. */
  itemId: string;
  /** The item's title. */
  title: string;
  /** The item's short description (may be empty). */
  snippet: string;
  /** The item owner's username. */
  owner: string;
};
