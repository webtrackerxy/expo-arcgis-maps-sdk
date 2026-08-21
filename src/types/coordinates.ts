/**
 * A single geographic point rendered in several coordinate notations by the
 * native `CoordinateFormatter`. All values are strings ready for display.
 */
export type CoordinateFormats = {
  /** Decimal degrees, e.g. `34.09N 118.71W`. */
  decimalDegrees: string;
  /** Degrees / minutes / seconds, e.g. `34°05'27"N 118°42'18"W`. */
  degreesMinutesSeconds: string;
  /** United States National Grid. */
  usng: string;
  /** Military Grid Reference System. */
  mgrs: string;
  /** Universal Transverse Mercator. */
  utm: string;
};
