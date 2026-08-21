/**
 * A coordinate grid drawn over the map view.
 *
 * - `none` — no grid (default).
 * - `latitudeLongitude` — degrees of latitude/longitude.
 * - `mgrs` — Military Grid Reference System.
 * - `utm` — Universal Transverse Mercator.
 * - `usng` — United States National Grid.
 *
 * The same four grid types exist on iOS and Android.
 */
export type MapGrid = 'none' | 'latitudeLongitude' | 'mgrs' | 'utm' | 'usng';

/** All supported {@link MapGrid} values. */
export const MAP_GRIDS: MapGrid[] = ['none', 'latitudeLongitude', 'mgrs', 'utm', 'usng'];

/** Type guard for a valid {@link MapGrid}. */
export function isMapGrid(value: unknown): value is MapGrid {
  return typeof value === 'string' && (MAP_GRIDS as string[]).includes(value);
}
