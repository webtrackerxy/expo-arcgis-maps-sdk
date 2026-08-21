/**
 * Options for global ArcGIS configuration.
 *
 * Configuration is process-global on both platforms: calling
 * `configureArcgis` sets the credentials used by every subsequently created
 * map. Call it once before mounting an `ArcgisMapView`.
 */
export type ConfigureArcgisOptions = {
  /**
   * ArcGIS API key used to access ArcGIS basemaps, geocoding and other
   * location services.
   *
   * Security: API keys embedded in a mobile app are recoverable. Use a narrowly
   * scoped key with the referrer/usage restrictions supported by your ArcGIS
   * account. The key is never logged or echoed in errors by this package.
   */
  apiKey: string;
};
