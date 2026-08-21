import type { ArcgisError } from '../errors';
import {
  validateConfigureOptions,
  validateGeographicPoint,
  validateApplyEditsOptions,
  validateCamera,
  validateSceneSource,
  validateAuthenticateOptions,
  validateFeatureQueryOptions,
  validateArcadeEvaluationOptions,
  validateIdentifyOptions,
  validateMapSource,
  validateGenerateGeodatabaseOptions,
  validateGeometryEditorOptions,
  validateExportVectorTilesOptions,
  validateOfflineMapJobOptions,
  validateSyncGeodatabaseOptions,
  validateViewpoint,
  validateViewpointAnimationOptions,
  validateQueryStatisticsOptions,
  validateKmlTourOptions,
  validateCreateKmlFileOptions,
} from '../validation';

/** Runs `fn`, returning the thrown ArcgisError (fails the test if none thrown). */
function caught(fn: () => unknown): ArcgisError {
  try {
    fn();
  } catch (error) {
    return error as ArcgisError;
  }
  throw new Error('expected function to throw');
}

describe('validateConfigureOptions', () => {
  it('accepts a non-empty apiKey', () => {
    expect(validateConfigureOptions({ apiKey: 'abc' })).toEqual({ apiKey: 'abc' });
  });

  it('rejects a missing/blank apiKey without echoing the value', () => {
    const err = caught(() => validateConfigureOptions({ apiKey: '   ' }));
    expect(err.code).toBe('E_INVALID_ARGUMENT');
    expect(err.message).not.toContain('   ');
  });
});

describe('validateGeographicPoint', () => {
  it('accepts a valid lat/long and normalizes extras', () => {
    expect(validateGeographicPoint({ latitude: 51.4, longitude: -0.3, altitude: 12 })).toEqual({
      latitude: 51.4,
      longitude: -0.3,
      altitude: 12,
    });
  });

  it('rejects out-of-range latitude and longitude', () => {
    expect(caught(() => validateGeographicPoint({ latitude: 91, longitude: 0 })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
    expect(caught(() => validateGeographicPoint({ latitude: 0, longitude: 181 })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
  });

  it('rejects non-finite coordinates', () => {
    expect(caught(() => validateGeographicPoint({ latitude: NaN, longitude: 0 })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
  });
});

describe('validateViewpoint', () => {
  it('normalizes center, scale and rotation', () => {
    expect(
      validateViewpoint({ center: { latitude: 1, longitude: 2 }, scale: 50000, rotation: 90 })
    ).toEqual({ center: { latitude: 1, longitude: 2 }, scale: 50000, rotation: 90 });
  });

  it('rejects a non-positive scale', () => {
    expect(
      caught(() => validateViewpoint({ center: { latitude: 1, longitude: 2 }, scale: 0 })).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});

describe('validateViewpointAnimationOptions', () => {
  it('defaults to an empty object', () => {
    expect(validateViewpointAnimationOptions()).toEqual({});
  });

  it('rejects a negative duration', () => {
    expect(caught(() => validateViewpointAnimationOptions({ durationMs: -1 })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
  });
});

describe('validateMapSource', () => {
  it('accepts a basemap with an initial viewpoint and layers', () => {
    const result = validateMapSource({
      basemap: 'arcGISTopographic',
      initialViewpoint: { center: { latitude: 51.4, longitude: -0.3 }, scale: 50000 },
      featureLayers: [{ id: 'a', url: 'https://example.com/FeatureServer/0' }],
    });
    expect(result.basemap).toBe('arcGISTopographic');
    expect(result.featureLayers).toHaveLength(1);
  });

  it('accepts a web map alone', () => {
    expect(validateMapSource({ webMapItemId: 'deadbeef' })).toEqual({ webMapItemId: 'deadbeef' });
  });

  it('accepts a mobile map package path alone', () => {
    expect(validateMapSource({ mobileMapPackagePath: '/data/tour.mmpk' })).toEqual({
      mobileMapPackagePath: '/data/tour.mmpk',
    });
  });

  it('rejects a mobile map package combined with a basemap', () => {
    expect(
      caught(() =>
        validateMapSource({ basemap: 'arcGISStreets', mobileMapPackagePath: '/data/tour.mmpk' })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects layers combined with a mobile map package', () => {
    expect(
      caught(() =>
        validateMapSource({
          mobileMapPackagePath: '/data/tour.mmpk',
          featureLayers: [{ id: 'a', url: 'u' }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects basemap + webMapItemId together', () => {
    expect(
      caught(() => validateMapSource({ basemap: 'arcGISStreets', webMapItemId: 'x' })).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects featureLayers combined with a web map', () => {
    expect(
      caught(() => validateMapSource({ webMapItemId: 'x', featureLayers: [{ id: 'a', url: 'u' }] }))
        .code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes basemap style parameters (worldview)', () => {
    expect(
      validateMapSource({
        basemap: 'arcGISLightGray',
        basemapStyleParameters: { worldview: 'china' },
      })
    ).toEqual({ basemap: 'arcGISLightGray', basemapStyleParameters: { worldview: 'china' } });
  });

  it('rejects an unsupported worldview', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISLightGray',
          basemapStyleParameters: { worldview: 'atlantis' as never },
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a shapefile layer with a renderer', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      layers: [
        {
          id: 's',
          type: 'shapefile',
          path: '/data/Subdivisions.shp',
          renderer: {
            type: 'simple',
            symbol: { type: 'simpleFill', style: 'solid', color: '#FFFF00' },
          },
        },
      ],
    });
    expect(result.layers?.[0]).toMatchObject({
      type: 'shapefile',
      renderer: { type: 'simple' },
    });
  });

  it('normalizes a map-image layer with per-sublayer renderers', () => {
    const result = validateMapSource({
      basemap: 'arcGISLightGray',
      layers: [
        {
          id: 'm',
          type: 'mapImage',
          url: 'https://x/MapServer',
          sublayerRenderers: [
            {
              sublayerId: 2,
              renderer: {
                type: 'classBreaks',
                field: 'POP2007',
                classBreaks: [{ maxValue: 100, symbol: { type: 'simpleFill', color: '#FF0000' } }],
              },
            },
          ],
        },
      ],
    });
    expect(result.layers?.[0]).toMatchObject({ type: 'mapImage' });
    const m = result.layers?.[0] as { sublayerRenderers?: { sublayerId: number }[] };
    expect(m.sublayerRenderers?.[0].sublayerId).toBe(2);
  });

  it('rejects a sublayer renderer with a non-integer id', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISLightGray',
          layers: [
            {
              id: 'm',
              type: 'mapImage',
              url: 'https://x/MapServer',
              sublayerRenderers: [
                {
                  sublayerId: 1.5 as never,
                  renderer: { type: 'simple', symbol: { type: 'simpleFill', color: '#FFF' } },
                },
              ],
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a positive spatialReferenceWkid', () => {
    expect(validateMapSource({ spatialReferenceWkid: 54024 })).toEqual({
      spatialReferenceWkid: 54024,
    });
  });

  it('rejects a non-positive spatialReferenceWkid', () => {
    expect(caught(() => validateMapSource({ spatialReferenceWkid: 0 })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
  });

  it('rejects an unsupported basemap style', () => {
    expect(caught(() => validateMapSource({ basemap: 'notARealBasemap' as never })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
  });

  it('normalizes a feature-collection-from-table layer', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      layers: [
        {
          id: 'fc',
          type: 'featureCollectionFromTable',
          fields: [{ name: 'name', type: 'text' }],
          features: [{ point: { latitude: 34, longitude: -117 }, attributes: { name: 'A' } }],
        },
      ],
    });
    expect(result.layers?.[0]).toMatchObject({ id: 'fc', type: 'featureCollectionFromTable' });
  });

  it('rejects a feature-collection-from-table layer without fields', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          layers: [
            { id: 'fc', type: 'featureCollectionFromTable', fields: [], features: [] } as never,
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('allows a graphic with no symbol (styled by a shared renderer)', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      graphicsRenderer: { type: 'simple', symbol: { type: 'simpleMarker', color: '#ff0000' } },
      graphics: [{ id: 'g', geometry: { type: 'point', point: { latitude: 1, longitude: 2 } } }],
    });
    expect(result.graphics?.[0]).toEqual({
      id: 'g',
      geometry: { type: 'point', point: { latitude: 1, longitude: 2 } },
    });
    expect(result.graphics?.[0].symbol).toBeUndefined();
  });

  it('normalizes a multilayer polyline symbol on a graphic', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      graphics: [
        {
          id: 'g',
          geometry: {
            type: 'polyline',
            path: [
              { latitude: 0, longitude: 0 },
              { latitude: 1, longitude: 1 },
            ],
          },
          symbol: {
            type: 'multilayerPolyline',
            strokeLayers: [
              { color: '#000000', widthPoints: 8 },
              { color: '#ffffff', widthPoints: 3 },
            ],
          },
        },
      ],
    });
    expect(result.graphics?.[0].symbol).toMatchObject({ type: 'multilayerPolyline' });
  });

  it('normalizes a uniqueValue renderer with scale-based alternate symbols', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      featureLayers: [
        {
          id: 'a',
          url: 'https://x/FeatureServer/0',
          renderer: {
            type: 'uniqueValue',
            fields: ['status'],
            uniqueValues: [
              {
                values: ['open'],
                symbol: { type: 'simpleMarker', color: '#ff0000', size: 12 },
                alternateSymbols: [
                  {
                    symbol: { type: 'simpleMarker', color: '#ff0000', size: 6 },
                    minScale: 100000,
                    maxScale: 10000,
                  },
                ],
              },
            ],
          },
        },
      ],
    });
    const renderer = result.featureLayers?.[0].renderer;
    expect(renderer?.type).toBe('uniqueValue');
    expect(
      (renderer as { uniqueValues: { alternateSymbols?: unknown[] }[] }).uniqueValues[0]
        .alternateSymbols
    ).toHaveLength(1);
  });

  it('rejects an alternate symbol with a negative scale', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          featureLayers: [
            {
              id: 'a',
              url: 'https://x/FeatureServer/0',
              renderer: {
                type: 'uniqueValue',
                fields: ['s'],
                uniqueValues: [
                  {
                    values: ['x'],
                    symbol: { type: 'simpleMarker', color: '#ff0000' },
                    alternateSymbols: [
                      { symbol: { type: 'simpleMarker', color: '#ff0000' }, minScale: -1 },
                    ],
                  },
                ],
              },
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a web-style symbol on a graphic', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      graphics: [
        {
          id: 'g',
          geometry: { type: 'point', point: { latitude: 0, longitude: 0 } },
          symbol: {
            type: 'webStyle',
            styleName: 'Esri2DPointSymbolsStyle',
            symbolKey: 'esri-pin-1',
          },
        },
      ],
    });
    expect(result.graphics?.[0].symbol).toMatchObject({
      type: 'webStyle',
      symbolKey: 'esri-pin-1',
    });
  });

  it('rejects a web-style symbol without a style source', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          graphics: [
            {
              id: 'g',
              geometry: { type: 'point', point: { latitude: 0, longitude: 0 } },
              symbol: { type: 'webStyle', symbolKey: 'esri-pin-1' } as never,
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a multilayer polyline symbol without stroke layers', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          graphics: [
            {
              id: 'g',
              geometry: { type: 'point', point: { latitude: 0, longitude: 0 } },
              symbol: { type: 'multilayerPolyline', strokeLayers: [] } as never,
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes kml, raster, and shapefile layers', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      layers: [
        { id: 'k', type: 'kml', url: 'https://example.com/doc.kmz' },
        { id: 'r', type: 'raster', url: 'https://example.com/ImageServer' },
        { id: 'rp', type: 'raster', path: '/data/dem.tif' },
        { id: 's', type: 'shapefile', path: '/data/trails.shp' },
      ],
    });
    expect(result.layers?.map((l) => l.type)).toEqual(['kml', 'raster', 'raster', 'shapefile']);
  });

  it('normalizes a geoPackage layer with a table index', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      layers: [{ id: 'gp', type: 'geoPackage', path: '/data/x.gpkg', tableIndex: 2 }],
    });
    expect(result.layers?.[0]).toMatchObject({ type: 'geoPackage', tableIndex: 2 });
  });

  it('normalizes annotation, dimension, and subtype-feature layers', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      layers: [
        { id: 'an', type: 'annotation', url: 'https://x/FeatureServer/0' },
        { id: 'di', type: 'dimension', url: 'https://x/FeatureServer/1' },
        { id: 'su', type: 'subtypeFeature', url: 'https://x/FeatureServer/2' },
      ],
    });
    expect(result.layers?.map((l) => l.type)).toEqual([
      'annotation',
      'dimension',
      'subtypeFeature',
    ]);
  });

  it('normalizes a raster layer with a hillshade renderer', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      layers: [
        {
          id: 'r',
          type: 'raster',
          url: 'https://x/ImageServer',
          hillshade: { altitudeDegrees: 45, azimuthDegrees: 315, zFactor: 2 },
        },
      ],
    });
    expect(result.layers?.[0]).toMatchObject({ type: 'raster', hillshade: { zFactor: 2 } });
  });

  it('normalizes a raster layer with a raster function', () => {
    const fn = JSON.stringify({ raster_function: { type: 'Hillshade_function' } });
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      layers: [{ id: 'r', type: 'raster', url: 'https://x/ImageServer', rasterFunction: fn }],
    });
    expect(result.layers?.[0]).toMatchObject({ type: 'raster', rasterFunction: fn });
  });

  it('normalizes a floor level and geotriggers', () => {
    const result = validateMapSource({
      webMapItemId: 'b4b599a43a474d33946cf0df526426f5',
      floorLevel: 2,
      geotriggers: [{ id: 'gate', bufferMeters: 50, ruleType: 'enterOrExit' }, { id: 'center' }],
    });
    expect(result.floorLevel).toBe(2);
    expect(result.geotriggers?.[0]).toEqual({
      id: 'gate',
      bufferMeters: 50,
      ruleType: 'enterOrExit',
    });
    expect(result.geotriggers?.[1]).toEqual({ id: 'center' });
  });

  it('rejects a duplicate geotrigger id and a bad ruleType', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISTopographic',
          geotriggers: [{ id: 'a' }, { id: 'a' }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISTopographic',
          geotriggers: [{ id: 'a', ruleType: 'sometimes' as never }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a kml layer with a ground overlay opacity', () => {
    const result = validateMapSource({
      basemap: 'arcGISImagery',
      layers: [{ id: 'k', type: 'kml', url: 'https://x/doc.kmz', groundOverlayOpacity: 0.5 }],
    });
    expect(result.layers?.[0]).toMatchObject({ type: 'kml', groundOverlayOpacity: 0.5 });
  });

  it('rejects a kml ground overlay opacity out of range', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISImagery',
          layers: [{ id: 'k', type: 'kml', url: 'https://x/doc.kmz', groundOverlayOpacity: 5 }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a raster layer with a mosaic rule', () => {
    const result = validateMapSource({
      basemap: 'arcGISImageryStandard',
      layers: [
        {
          id: 'm',
          type: 'raster',
          url: 'https://x/ImageServer',
          mosaicRule: { method: 'northwest', operation: 'first', ascending: false },
        },
      ],
    });
    expect(result.layers?.[0]).toMatchObject({
      type: 'raster',
      mosaicRule: { method: 'northwest', operation: 'first', ascending: false },
    });
  });

  it('rejects a mosaic rule without an image-service url, and a bad method', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISImageryStandard',
          layers: [{ id: 'm', type: 'raster', path: '/x.tif', mosaicRule: { method: 'center' } }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISImageryStandard',
          layers: [
            {
              id: 'm',
              type: 'raster',
              url: 'https://x/ImageServer',
              mosaicRule: { method: 'zzz' as never },
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a basemap built from a tiled base layer', () => {
    const result = validateMapSource({
      basemapLayer: { type: 'tiled', url: 'https://x/MapServer' },
    });
    expect(result.basemapLayer).toEqual({ type: 'tiled', url: 'https://x/MapServer' });
  });

  it('normalizes a basemap from a vector-tiled portal item (custom style)', () => {
    const result = validateMapSource({
      basemapLayer: { type: 'vectorTiled', itemId: 'abc123' },
    });
    expect(result.basemapLayer).toEqual({ type: 'vectorTiled', itemId: 'abc123' });
  });

  it('rejects a basemapLayer with both url and itemId, or neither', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemapLayer: { type: 'tiled', url: 'https://x', itemId: 'y' },
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(caught(() => validateMapSource({ basemapLayer: { type: 'tiled' } as never })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
  });

  it('normalizes a dynamic entity layer', () => {
    const result = validateMapSource({
      basemap: 'arcGISDarkGray',
      layers: [{ id: 'de', type: 'dynamicEntity', url: 'https://x/StreamServer' }],
    });
    expect(result.layers?.[0]).toEqual({
      id: 'de',
      type: 'dynamicEntity',
      url: 'https://x/StreamServer',
    });
  });

  it('rejects a dynamic entity layer without a url or custom feed', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISDarkGray',
          layers: [{ id: 'de', type: 'dynamicEntity' } as never],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a dynamic entity layer with a custom local feed', () => {
    const result = validateMapSource({
      basemap: 'arcGISDarkGray',
      layers: [
        {
          id: 'custom',
          type: 'dynamicEntity',
          customFeed: {
            observationsPath: '/tmp/obs.jsonl',
            entityIdField: 'MMSI',
            longitudeField: 'longitude',
            latitudeField: 'latitude',
            observationsPerSecond: 15,
          },
        },
      ],
    });
    expect(result.layers?.[0]).toEqual({
      id: 'custom',
      type: 'dynamicEntity',
      customFeed: {
        observationsPath: '/tmp/obs.jsonl',
        entityIdField: 'MMSI',
        longitudeField: 'longitude',
        latitudeField: 'latitude',
        observationsPerSecond: 15,
      },
    });
  });

  it('rejects a custom feed missing its entity id field', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISDarkGray',
          layers: [
            {
              id: 'custom',
              type: 'dynamicEntity',
              customFeed: {
                observationsPath: '/tmp/obs.jsonl',
                longitudeField: 'longitude',
                latitudeField: 'latitude',
              },
            } as never,
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes an ENC layer with resource and SENC paths', () => {
    const result = validateMapSource({
      basemap: 'arcGISOceans',
      layers: [
        {
          id: 'enc',
          type: 'enc',
          path: '/data/ENC_ROOT/CATALOG.031',
          resourcePath: '/data/hydrography',
          sencPath: '/cache/senc',
        },
      ],
    });
    expect(result.layers?.[0]).toEqual({
      id: 'enc',
      type: 'enc',
      path: '/data/ENC_ROOT/CATALOG.031',
      resourcePath: '/data/hydrography',
      sencPath: '/cache/senc',
    });
  });

  it('rejects an ENC layer without a path', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISOceans',
          layers: [{ id: 'enc', type: 'enc' } as never],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes an annotation layer with sublayer visibility', () => {
    const result = validateMapSource({
      basemap: 'arcGISLightGray',
      layers: [
        {
          id: 'a',
          type: 'annotation',
          url: 'https://x/FeatureServer/0',
          sublayerVisibility: [
            { name: 'Open', visible: true },
            { name: 'Closed', visible: false },
          ],
        },
      ],
    });
    expect(result.layers?.[0]).toMatchObject({
      type: 'annotation',
      sublayerVisibility: [
        { name: 'Open', visible: true },
        { name: 'Closed', visible: false },
      ],
    });
  });

  it('rejects annotation sublayer visibility with a non-boolean visible', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISLightGray',
          layers: [
            {
              id: 'a',
              type: 'annotation',
              url: 'https://x/FeatureServer/0',
              sublayerVisibility: [{ name: 'Open', visible: 'yes' as never }],
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a raster layer with a blend renderer', () => {
    const result = validateMapSource({
      basemap: 'arcGISImageryStandard',
      layers: [
        {
          id: 'blend',
          type: 'raster',
          path: '/data/color.tif',
          blend: {
            elevationPath: '/data/dem.tif',
            altitudeDegrees: 45,
            azimuthDegrees: 315,
            colorRamp: 'elevation',
          },
        },
      ],
    });
    expect(result.layers?.[0]).toMatchObject({
      type: 'raster',
      blend: { elevationPath: '/data/dem.tif', altitudeDegrees: 45, colorRamp: 'elevation' },
    });
  });

  it('rejects a blend renderer without an elevation source', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISImageryStandard',
          layers: [
            {
              id: 'blend',
              type: 'raster',
              path: '/data/color.tif',
              blend: { altitudeDegrees: 45 },
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a blend renderer with an unknown colorRamp', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISImageryStandard',
          layers: [
            {
              id: 'blend',
              type: 'raster',
              path: '/data/color.tif',
              blend: { elevationPath: '/data/dem.tif', colorRamp: 'rainbow' as never },
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a raster layer with a server rendering rule', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      layers: [
        { id: 'r', type: 'raster', url: 'https://x/ImageServer', renderingRule: 'RFTHillshade' },
      ],
    });
    expect(result.layers?.[0]).toMatchObject({ type: 'raster', renderingRule: 'RFTHillshade' });
  });

  it('rejects a rendering rule without a url', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          layers: [
            { id: 'r', type: 'raster', path: '/data/dem.tif', renderingRule: 'RFTHillshade' },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects an empty raster function string', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          layers: [{ id: 'r', type: 'raster', url: 'https://x/ImageServer', rasterFunction: '' }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a raster layer with a stretch renderer', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      layers: [
        {
          id: 'r',
          type: 'raster',
          url: 'https://x/ImageServer',
          stretch: { type: 'percentClip', minPercent: 2, maxPercent: 2 },
        },
      ],
    });
    expect(result.layers?.[0]).toMatchObject({ type: 'raster', stretch: { type: 'percentClip' } });
  });

  it('normalizes a raster layer with an RGB renderer', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      layers: [
        {
          id: 'r',
          type: 'raster',
          url: 'https://x/ImageServer',
          rgb: {
            bandIndices: [0, 1, 2],
            stretch: { type: 'percentClip', minPercent: 2, maxPercent: 2 },
          },
        },
      ],
    });
    expect(result.layers?.[0]).toMatchObject({
      type: 'raster',
      rgb: { bandIndices: [0, 1, 2], stretch: { type: 'percentClip' } },
    });
  });

  it('rejects RGB bandIndices that are not three non-negative integers', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          layers: [
            {
              id: 'r',
              type: 'raster',
              url: 'https://x/ImageServer',
              rgb: { bandIndices: [0, 1] },
            } as never,
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a raster layer with a colormap renderer', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      layers: [
        {
          id: 'r',
          type: 'raster',
          url: 'https://x/ImageServer',
          colormap: { colors: ['#0000FF', '#00FF00', '#FF0000'] },
        },
      ],
    });
    expect(result.layers?.[0]).toMatchObject({
      type: 'raster',
      colormap: { colors: ['#0000FF', '#00FF00', '#FF0000'] },
    });
  });

  it('rejects a colormap with no colours', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          layers: [
            { id: 'r', type: 'raster', url: 'https://x/ImageServer', colormap: { colors: [] } },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a colormap with a non-hex colour', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          layers: [
            {
              id: 'r',
              type: 'raster',
              url: 'https://x/ImageServer',
              colormap: { colors: ['blue'] },
            } as never,
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a stretch with an unknown type', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          layers: [
            {
              id: 'r',
              type: 'raster',
              url: 'https://x/ImageServer',
              stretch: { type: 'x' },
            } as never,
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a hillshade with a non-numeric value', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          layers: [
            {
              id: 'r',
              type: 'raster',
              url: 'https://x/ImageServer',
              hillshade: { altitudeDegrees: 'high' },
            } as never,
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a raster layer with neither url nor path', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          layers: [{ id: 'r', type: 'raster' } as never],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a feature-collection-from-query layer', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      layers: [
        {
          id: 'fcq',
          type: 'featureCollectionFromQuery',
          url: 'https://x/FeatureServer/0',
          where: 'POP > 100',
        },
      ],
    });
    expect(result.layers?.[0]).toMatchObject({
      type: 'featureCollectionFromQuery',
      where: 'POP > 100',
    });
  });

  it('rejects duplicate feature-layer ids', () => {
    const err = caught(() =>
      validateMapSource({
        basemap: 'arcGISStreets',
        featureLayers: [
          { id: 'dup', url: 'u1' },
          { id: 'dup', url: 'u2' },
        ],
      })
    );
    expect(err.code).toBe('E_INVALID_ARGUMENT');
    expect(err.details).toEqual({ id: 'dup' });
  });

  it('rejects layer opacity out of range', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          featureLayers: [{ id: 'a', url: 'u', opacity: 2 }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('accepts scale limits, reference scale, and a max extent', () => {
    const result = validateMapSource({
      basemap: 'arcGISTopographic',
      minScale: 10_000_000,
      maxScale: 1_000,
      referenceScale: 50_000,
      maxExtent: { minLatitude: 33, minLongitude: -119, maxLatitude: 35, maxLongitude: -117 },
    });
    expect(result.minScale).toBe(10_000_000);
    expect(result.maxScale).toBe(1_000);
    expect(result.referenceScale).toBe(50_000);
    expect(result.maxExtent).toEqual({
      minLatitude: 33,
      minLongitude: -119,
      maxLatitude: 35,
      maxLongitude: -117,
    });
  });

  it('rejects a non-positive scale', () => {
    expect(caught(() => validateMapSource({ basemap: 'arcGISStreets', minScale: 0 })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
    expect(
      caught(() => validateMapSource({ basemap: 'arcGISStreets', referenceScale: -5 })).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects maxScale greater than minScale', () => {
    const err = caught(() =>
      validateMapSource({ basemap: 'arcGISStreets', minScale: 1_000, maxScale: 10_000 })
    );
    expect(err.code).toBe('E_INVALID_ARGUMENT');
    expect(err.details).toEqual({ minScale: 1_000, maxScale: 10_000 });
  });

  it('rejects a malformed max extent using the map.maxExtent label', () => {
    const err = caught(() =>
      validateMapSource({
        basemap: 'arcGISStreets',
        // minLatitude not below maxLatitude
        maxExtent: { minLatitude: 35, minLongitude: -119, maxLatitude: 35, maxLongitude: -117 },
      })
    );
    expect(err.code).toBe('E_INVALID_ARGUMENT');
    expect(err.message).toContain('map.maxExtent');
  });

  it('accepts a valid background color', () => {
    const result = validateMapSource({ basemap: 'arcGISStreets', backgroundColor: '#FFEEDDCC' });
    expect(result.backgroundColor).toBe('#FFEEDDCC');
  });

  it('rejects a malformed background color', () => {
    expect(
      caught(() => validateMapSource({ basemap: 'arcGISStreets', backgroundColor: 'blue' })).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('accepts a simple renderer on a feature layer', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      featureLayers: [
        {
          id: 'a',
          url: 'u',
          renderer: { type: 'simple', symbol: { type: 'simpleMarker', color: '#FF0000' } },
        },
      ],
    });
    expect(result.featureLayers?.[0].renderer?.type).toBe('simple');
  });

  it('accepts unique-value and class-breaks renderers', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      graphicsRenderer: {
        type: 'uniqueValue',
        fields: ['status'],
        uniqueValues: [
          { values: ['open'], symbol: { type: 'simpleMarker', color: '#00FF00' } },
          { values: [2], symbol: { type: 'simpleMarker', color: '#0000FF' } },
        ],
        defaultSymbol: { type: 'simpleMarker', color: '#888888' },
      },
      featureLayers: [
        {
          id: 'b',
          url: 'u',
          renderer: {
            type: 'classBreaks',
            field: 'pop',
            classBreaks: [
              { maxValue: 100, symbol: { type: 'simpleFill', color: '#EEEEEE' } },
              { minValue: 100, maxValue: 1000, symbol: { type: 'simpleFill', color: '#333333' } },
            ],
          },
        },
      ],
    });
    expect(result.graphicsRenderer?.type).toBe('uniqueValue');
    expect(result.featureLayers?.[0].renderer?.type).toBe('classBreaks');
  });

  it('accepts the new operational layer types', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      layers: [
        { id: 'tiled', type: 'tiled', url: 'https://example.com/MapServer' },
        { id: 'osm', type: 'openStreetMap', opacity: 0.5 },
        {
          id: 'web',
          type: 'webTiled',
          urlTemplate: 'https://{subDomain}.x/{level}/{col}/{row}',
          subDomains: ['a', 'b'],
        },
        { id: 'wms', type: 'wms', url: 'https://example.com/wms', layerNames: ['0'] },
        { id: 'wfs', type: 'wfs', url: 'https://example.com/wfs', tableName: 'ns:things' },
        { id: 'wmts', type: 'wmts', url: 'https://example.com/wmts', layerId: 'layer0' },
        {
          id: 'mi',
          type: 'mapImage',
          url: 'https://example.com/MapServer',
          sublayerVisibility: [{ sublayerId: 2, visible: false }],
        },
      ],
    });
    expect(result.layers).toHaveLength(7);
    expect(result.layers?.[0].type).toBe('tiled');
  });

  it('rejects a web map combined with layers, and malformed layers', () => {
    expect(
      caught(() =>
        validateMapSource({ webMapItemId: 'x', layers: [{ id: 'a', type: 'openStreetMap' }] })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          layers: [{ id: 'a', type: 'tiled' } as never],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          layers: [
            { id: 'dup', type: 'openStreetMap' },
            { id: 'dup', type: 'openStreetMap' },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('accepts a dictionary renderer on a feature layer', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      featureLayers: [
        {
          id: 'mil',
          url: 'https://example.com/FeatureServer/0',
          renderer: { type: 'dictionary', portalItemId: 'abc123' },
        },
      ],
    });
    expect(result.featureLayers?.[0].renderer).toEqual({
      type: 'dictionary',
      portalItemId: 'abc123',
    });
  });

  it('rejects a dictionary renderer without a portalItemId', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          featureLayers: [{ id: 'm', url: 'u', renderer: { type: 'dictionary' } as never }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('accepts a dictionary renderer from a local .stylx path', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      featureLayers: [
        {
          id: 'r',
          url: 'https://example.com/FeatureServer/0',
          renderer: { type: 'dictionary', stylxPath: '/data/Restaurant.stylx' },
        },
      ],
    });
    expect(result.featureLayers?.[0].renderer).toEqual({
      type: 'dictionary',
      stylxPath: '/data/Restaurant.stylx',
    });
  });

  it('rejects a dictionary renderer with both portalItemId and stylxPath', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          featureLayers: [
            {
              id: 'm',
              url: 'u',
              renderer: { type: 'dictionary', portalItemId: 'abc', stylxPath: '/x.stylx' } as never,
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('accepts a webStyle symbol from a local .stylx path', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      graphics: [
        {
          id: 'g',
          geometry: { type: 'point', point: { latitude: 34, longitude: -117 } },
          symbol: { type: 'webStyle', symbolKey: 'Sad', stylxPath: '/data/emoji-mobile.stylx' },
        },
      ],
    });
    expect(result.graphics?.[0].symbol).toEqual({
      type: 'webStyle',
      symbolKey: 'Sad',
      stylxPath: '/data/emoji-mobile.stylx',
    });
  });

  it('accepts a webStyle symbol composed from multiple symbolKeys', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      graphics: [
        {
          id: 'g',
          geometry: { type: 'point', point: { latitude: 34, longitude: -117 } },
          symbol: {
            type: 'webStyle',
            symbolKey: 'Face1',
            symbolKeys: ['Face1', 'Hat-cowboy', 'Mouth-frown'],
            stylxPath: '/data/emoji-mobile.stylx',
          },
        },
      ],
    });
    expect((result.graphics?.[0].symbol as { symbolKeys?: string[] }).symbolKeys).toEqual([
      'Face1',
      'Hat-cowboy',
      'Mouth-frown',
    ]);
  });

  it('rejects webStyle symbolKeys that are not a non-empty string array', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          graphics: [
            {
              id: 'g',
              geometry: { type: 'point', point: { latitude: 0, longitude: 0 } },
              symbol: {
                type: 'webStyle',
                symbolKey: 'k',
                symbolKeys: [''],
                stylxPath: '/x.stylx',
              } as never,
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a webStyle symbol with more than one style source', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          graphics: [
            {
              id: 'g',
              geometry: { type: 'point', point: { latitude: 0, longitude: 0 } },
              symbol: {
                type: 'webStyle',
                symbolKey: 'k',
                styleName: 'Esri2DPointSymbolsStyle',
                stylxPath: '/x.stylx',
              } as never,
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('accepts a WMS style and a WFS XML query', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      layers: [
        { id: 'w', type: 'wms', url: 'https://x/wms', layerNames: ['0'], styleName: 'geologic' },
        {
          id: 'f',
          type: 'wfs',
          url: 'https://x/wfs',
          tableName: 'ns:t',
          xmlQuery: '<wfs:GetFeature/>',
        },
      ],
    });
    const [wms, wfs] = result.layers ?? [];
    expect(wms.type === 'wms' && wms.styleName).toBe('geologic');
    expect(wfs.type === 'wfs' && wfs.xmlQuery).toBe('<wfs:GetFeature/>');
  });

  it('accepts a feature collection and a group layer', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      layers: [
        { id: 'fc', type: 'featureCollection', portalItemId: 'abc123' },
        {
          id: 'grp',
          type: 'group',
          sublayers: [
            { id: 'g1', type: 'openStreetMap' },
            { id: 'g2', type: 'tiled', url: 'https://example.com/MapServer' },
          ],
        },
      ],
    });
    expect(result.layers).toHaveLength(2);
    expect(result.layers?.[1].type).toBe('group');
  });

  it('rejects a nested group and a group id colliding with a sublayer', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          layers: [
            {
              id: 'grp',
              type: 'group',
              sublayers: [{ id: 'inner', type: 'group', sublayers: [] } as never],
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          layers: [{ id: 'x', type: 'group', sublayers: [{ id: 'x', type: 'openStreetMap' }] }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('accepts labels and clustering on a feature layer', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      featureLayers: [
        {
          id: 'a',
          url: 'u',
          labels: [
            {
              expression: '[NAME]',
              color: '#111111',
              size: 12,
              haloColor: '#FFFFFF',
              haloWidth: 2,
            },
          ],
          clustering: {
            enabled: true,
            radius: 70,
            maxSymbolSize: 40,
            color: '#2563EB',
          },
        },
      ],
    });
    expect(result.featureLayers?.[0].labels?.[0].expression).toBe('[NAME]');
    expect(result.featureLayers?.[0].clustering?.enabled).toBe(true);
  });

  it('rejects invalid labels or clustering', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          featureLayers: [{ id: 'a', url: 'u', labels: [{ expression: '' }] }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          featureLayers: [{ id: 'a', url: 'u', clustering: { enabled: true, radius: -1 } }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a renderer with an invalid symbol or missing fields', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          featureLayers: [
            { id: 'a', url: 'u', renderer: { type: 'simple', symbol: { color: 'red' } as never } },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          graphicsRenderer: { type: 'uniqueValue', fields: [], uniqueValues: [] } as never,
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});

describe('validateIdentifyOptions', () => {
  it('normalizes a valid request', () => {
    expect(
      validateIdentifyOptions({ screenPoint: { x: 10, y: 20 }, tolerance: 12, maximumResults: 5 })
    ).toEqual({ screenPoint: { x: 10, y: 20 }, tolerance: 12, maximumResults: 5 });
  });

  it('rejects a non-integer maximumResults', () => {
    expect(
      caught(() => validateIdentifyOptions({ screenPoint: { x: 0, y: 0 }, maximumResults: 1.5 }))
        .code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a missing screenPoint', () => {
    expect(caught(() => validateIdentifyOptions({ screenPoint: { x: NaN, y: 0 } })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
  });
});

describe('validateArcadeEvaluationOptions', () => {
  it('normalizes a valid request', () => {
    expect(
      validateArcadeEvaluationOptions({
        screenPoint: { x: 10, y: 20 },
        tolerance: 8,
        expression: '$feature.POP2000',
      })
    ).toEqual({ screenPoint: { x: 10, y: 20 }, tolerance: 8, expression: '$feature.POP2000' });
  });

  it('rejects an empty expression', () => {
    expect(
      caught(() => validateArcadeEvaluationOptions({ screenPoint: { x: 0, y: 0 }, expression: '' }))
        .code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a missing screenPoint (identify rules still apply)', () => {
    expect(
      caught(() =>
        validateArcadeEvaluationOptions({
          screenPoint: { x: NaN, y: 0 },
          expression: '$feature.POP2000',
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});

describe('validateMapSource graphics', () => {
  const pt = (latitude: number, longitude: number) => ({ latitude, longitude });

  it('accepts point / polyline / polygon graphics with simple symbols', () => {
    const result = validateMapSource({
      basemap: 'arcGISStreets',
      graphics: [
        {
          id: 'p',
          geometry: { type: 'point', point: pt(1, 2) },
          symbol: { type: 'simpleMarker', color: '#ff0000', size: 10 },
        },
        {
          id: 'l',
          geometry: { type: 'polyline', path: [pt(1, 2), pt(3, 4)] },
          symbol: { type: 'simpleLine', color: '#00ff00ff', width: 2 },
        },
        {
          id: 'g',
          geometry: { type: 'polygon', ring: [pt(0, 0), pt(0, 1), pt(1, 1)] },
          symbol: {
            type: 'simpleFill',
            color: '#0000ff80',
            outline: { type: 'simpleLine', color: '#000000' },
          },
        },
      ],
    });
    expect(result.graphics).toHaveLength(3);
  });

  it('rejects duplicate graphic ids', () => {
    const err = caught(() =>
      validateMapSource({
        basemap: 'arcGISStreets',
        graphics: [
          {
            id: 'x',
            geometry: { type: 'point', point: pt(0, 0) },
            symbol: { type: 'simpleMarker', color: '#fff000' },
          },
          {
            id: 'x',
            geometry: { type: 'point', point: pt(1, 1) },
            symbol: { type: 'simpleMarker', color: '#fff000' },
          },
        ],
      })
    );
    expect(err.code).toBe('E_INVALID_ARGUMENT');
    expect(err.details).toEqual({ id: 'x' });
  });

  it('rejects an invalid hex color', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          graphics: [
            {
              id: 'x',
              geometry: { type: 'point', point: pt(0, 0) },
              symbol: { type: 'simpleMarker', color: 'red' },
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a polyline path with fewer than 2 points', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          graphics: [
            {
              id: 'x',
              geometry: { type: 'polyline', path: [pt(0, 0)] },
              symbol: { type: 'simpleLine', color: '#000000' },
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a polygon ring with fewer than 3 points', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          graphics: [
            {
              id: 'x',
              geometry: { type: 'polygon', ring: [pt(0, 0), pt(1, 1)] },
              symbol: { type: 'simpleFill', color: '#000000' },
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a non-positive marker size', () => {
    expect(
      caught(() =>
        validateMapSource({
          basemap: 'arcGISStreets',
          graphics: [
            {
              id: 'x',
              geometry: { type: 'point', point: pt(0, 0) },
              symbol: { type: 'simpleMarker', color: '#000000', size: 0 },
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});

describe('validateFeatureQueryOptions', () => {
  it('normalizes a valid query', () => {
    expect(
      validateFeatureQueryOptions({ layerId: 'trees', whereClause: "TYPE='oak'", maxResults: 10 })
    ).toEqual({ layerId: 'trees', whereClause: "TYPE='oak'", maxResults: 10 });
  });

  it('requires a non-empty layerId', () => {
    expect(caught(() => validateFeatureQueryOptions({ layerId: '' })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
  });

  it('rejects a non-integer maxResults', () => {
    expect(caught(() => validateFeatureQueryOptions({ layerId: 'x', maxResults: 2.5 })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
  });
});

describe('validateApplyEditsOptions', () => {
  it('normalizes adds / updates / deletes', () => {
    const result = validateApplyEditsOptions({
      layerId: 'trees',
      adds: [{ attributes: { TYPE: 'oak' }, point: { latitude: 1, longitude: 2 } }],
      updates: [{ objectId: 5, attributes: { TYPE: 'elm' } }],
      deleteObjectIds: [7, 8],
    });
    expect(result.adds).toHaveLength(1);
    expect(result.updates?.[0].objectId).toBe(5);
    expect(result.deleteObjectIds).toEqual([7, 8]);
  });

  it('requires an objectId on updates', () => {
    expect(
      caught(() => validateApplyEditsOptions({ layerId: 'x', updates: [{ attributes: {} }] })).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects non-integer delete ids', () => {
    expect(
      caught(() => validateApplyEditsOptions({ layerId: 'x', deleteObjectIds: [1.5] })).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('requires a layerId', () => {
    expect(caught(() => validateApplyEditsOptions({ layerId: '' })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
  });
});

describe('validateAuthenticateOptions', () => {
  it('normalizes username / password / portalUrl', () => {
    const result = validateAuthenticateOptions({
      username: 'jdoe',
      password: 'secret',
      portalUrl: 'https://example.maps.arcgis.com',
    });
    expect(result).toEqual({
      username: 'jdoe',
      password: 'secret',
      portalUrl: 'https://example.maps.arcgis.com',
    });
  });

  it('requires a username', () => {
    expect(caught(() => validateAuthenticateOptions({ username: ' ', password: 'x' })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
  });

  it('requires a password and never echoes it', () => {
    const err = caught(() => validateAuthenticateOptions({ username: 'jdoe', password: '' }));
    expect(err.code).toBe('E_INVALID_ARGUMENT');
    expect(JSON.stringify(err)).not.toContain('password');
  });

  it('rejects a non-http portalUrl', () => {
    expect(
      caught(() =>
        validateAuthenticateOptions({ username: 'j', password: 'p', portalUrl: 'ftp://x' })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});

describe('validateOfflineMapJobOptions', () => {
  const area = { minLatitude: 34.0, minLongitude: -118.8, maxLatitude: 34.2, maxLongitude: -118.6 };

  it('normalizes a valid job', () => {
    const result = validateOfflineMapJobOptions({
      webMapItemId: 'abc',
      areaOfInterest: area,
      minScale: 500000,
      maxScale: 5000,
    });
    expect(result.webMapItemId).toBe('abc');
    expect(result.areaOfInterest).toEqual(area);
    expect(result.minScale).toBe(500000);
    expect(result.maxScale).toBe(5000);
  });

  it('requires a webMapItemId', () => {
    expect(
      caught(() => validateOfflineMapJobOptions({ webMapItemId: '', areaOfInterest: area })).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects an inverted envelope', () => {
    expect(
      caught(() =>
        validateOfflineMapJobOptions({
          webMapItemId: 'abc',
          areaOfInterest: { ...area, minLatitude: 40, maxLatitude: 30 },
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects out-of-range longitude', () => {
    expect(
      caught(() =>
        validateOfflineMapJobOptions({
          webMapItemId: 'abc',
          areaOfInterest: { ...area, maxLongitude: 200 },
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects maxScale larger than minScale', () => {
    expect(
      caught(() =>
        validateOfflineMapJobOptions({
          webMapItemId: 'abc',
          areaOfInterest: area,
          minScale: 5000,
          maxScale: 500000,
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});

describe('validateExportVectorTilesOptions', () => {
  const area = { minLatitude: 51.5, minLongitude: -0.14, maxLatitude: 51.52, maxLongitude: -0.11 };

  it('normalizes a valid job', () => {
    const result = validateExportVectorTilesOptions({
      serviceUrl: 'https://example.com/VectorTileServer',
      area,
      maxScale: 10000,
    });
    expect(result.serviceUrl).toBe('https://example.com/VectorTileServer');
    expect(result.area).toEqual(area);
    expect(result.maxScale).toBe(10000);
  });

  it('omits maxScale when not provided', () => {
    const result = validateExportVectorTilesOptions({
      serviceUrl: 'https://example.com/VectorTileServer',
      area,
    });
    expect(result.maxScale).toBeUndefined();
  });

  it('requires a serviceUrl', () => {
    expect(caught(() => validateExportVectorTilesOptions({ serviceUrl: '', area })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
  });

  it('rejects an inverted envelope', () => {
    expect(
      caught(() =>
        validateExportVectorTilesOptions({
          serviceUrl: 'https://example.com/VectorTileServer',
          area: { ...area, minLatitude: 60, maxLatitude: 50 },
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a non-positive maxScale', () => {
    expect(
      caught(() =>
        validateExportVectorTilesOptions({
          serviceUrl: 'https://example.com/VectorTileServer',
          area,
          maxScale: 0,
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});

describe('geodatabase validation', () => {
  const area = { minLatitude: 34.0, minLongitude: -118.8, maxLatitude: 34.2, maxLongitude: -118.6 };
  const url = 'https://services.example.com/arcgis/rest/services/Wildfire/FeatureServer';

  it('normalizes generate options', () => {
    const result = validateGenerateGeodatabaseOptions({
      featureServiceUrl: url,
      areaOfInterest: area,
    });
    expect(result.featureServiceUrl).toBe(url);
    expect(result.areaOfInterest).toEqual(area);
  });

  it('rejects a non-http feature service url', () => {
    expect(
      caught(() =>
        validateGenerateGeodatabaseOptions({ featureServiceUrl: 'ftp://x', areaOfInterest: area })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes sync options', () => {
    const result = validateSyncGeodatabaseOptions({
      featureServiceUrl: url,
      path: '/data/wildfire.geodatabase',
    });
    expect(result.path).toBe('/data/wildfire.geodatabase');
  });

  it('requires a geodatabase path to sync', () => {
    expect(
      caught(() => validateSyncGeodatabaseOptions({ featureServiceUrl: url, path: '' })).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});

describe('validateCamera', () => {
  it('normalizes a full camera', () => {
    const result = validateCamera({
      latitude: 48.4,
      longitude: -4.5,
      altitude: 60,
      heading: 40,
      pitch: 70,
      roll: 0,
    });
    expect(result).toEqual({
      latitude: 48.4,
      longitude: -4.5,
      altitude: 60,
      heading: 40,
      pitch: 70,
      roll: 0,
    });
  });

  it('requires a finite altitude', () => {
    expect(
      caught(() => validateCamera({ latitude: 0, longitude: 0, altitude: Number.NaN })).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects out-of-range latitude', () => {
    expect(caught(() => validateCamera({ latitude: 200, longitude: 0, altitude: 1 })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
  });
});

describe('validateSceneSource', () => {
  it('normalizes basemap + elevation + layers + camera', () => {
    const result = validateSceneSource({
      basemap: 'arcGISTopographic',
      elevationEnabled: true,
      sceneLayers: [{ id: 'buildings', url: 'https://example.com/SceneServer' }],
      initialCamera: { latitude: 48.4, longitude: -4.5, altitude: 60 },
    });
    expect(result.basemap).toBe('arcGISTopographic');
    expect(result.sceneLayers).toHaveLength(1);
    expect(result.initialCamera?.altitude).toBe(60);
  });

  it('rejects an unknown basemap', () => {
    expect(caught(() => validateSceneSource({ basemap: 'nope' as never })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
  });

  it('normalizes 3D layer types, terrain exaggeration, and nav constraint', () => {
    const result = validateSceneSource({
      basemap: 'arcGISImagery',
      elevationEnabled: true,
      sceneLayers: [
        { id: 'mesh', type: 'integratedMesh', url: 'https://x/SceneServer' },
        { id: 'tiles', type: '3dTiles', url: 'https://x/tileset.json' },
      ],
      terrainExaggeration: 3,
      surfaceNavigationConstraint: 'stayAbove',
    });
    expect(result.sceneLayers?.map((l) => l.type)).toEqual(['integratedMesh', '3dTiles']);
    expect(result.terrainExaggeration).toBe(3);
    expect(result.surfaceNavigationConstraint).toBe('stayAbove');
  });

  it('normalizes atmosphere effect and sun lighting', () => {
    const result = validateSceneSource({
      basemap: 'arcGISImagery',
      atmosphereEffect: 'realistic',
      sunLighting: 'lightAndShadows',
    });
    expect(result.atmosphereEffect).toBe('realistic');
    expect(result.sunLighting).toBe('lightAndShadows');
  });

  it('normalizes elevation sources (world / tiled / raster / tilePackage)', () => {
    const result = validateSceneSource({
      basemap: 'arcGISImagery',
      elevationSources: [
        { type: 'world' },
        { type: 'tiled', url: 'https://x/ImageServer' },
        { type: 'raster', path: '/data/dem.dt2' },
        { type: 'tilePackage', path: '/data/elev.tpkx' },
      ],
    });
    expect(result.elevationSources).toEqual([
      { type: 'world' },
      { type: 'tiled', url: 'https://x/ImageServer' },
      { type: 'raster', path: '/data/dem.dt2' },
      { type: 'tilePackage', path: '/data/elev.tpkx' },
    ]);
  });

  it('rejects a tiled elevation source without a url', () => {
    expect(
      caught(() =>
        validateSceneSource({ basemap: 'arcGISImagery', elevationSources: [{ type: 'tiled' }] })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a raster elevation source without a path', () => {
    expect(
      caught(() =>
        validateSceneSource({ basemap: 'arcGISImagery', elevationSources: [{ type: 'raster' }] })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a building scene layer with a solid filter expression', () => {
    const result = validateSceneSource({
      basemap: 'arcGISTopographic',
      sceneLayers: [
        {
          id: 'bldg',
          type: 'building',
          url: 'https://x/SceneServer',
          buildingFilterExpression: 'BldgLevel = 3',
        },
      ],
    });
    expect(result.sceneLayers?.[0]).toMatchObject({
      type: 'building',
      buildingFilterExpression: 'BldgLevel = 3',
    });
  });

  it('rejects a building filter expression on a non-building layer', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISTopographic',
          sceneLayers: [
            {
              id: 'x',
              type: 'scene',
              url: 'https://x/SceneServer',
              buildingFilterExpression: 'a=1',
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a scene layer polygon filter', () => {
    const result = validateSceneSource({
      basemap: 'arcGISImagery',
      sceneLayers: [
        {
          id: 'b',
          type: 'scene',
          url: 'https://x/SceneServer',
          polygonFilter: {
            polygons: [
              [
                { latitude: 1, longitude: 1 },
                { latitude: 1, longitude: 2 },
                { latitude: 2, longitude: 2 },
              ],
            ],
            spatialRelationship: 'disjoint',
          },
        },
      ],
    });
    expect(result.sceneLayers?.[0].polygonFilter?.spatialRelationship).toBe('disjoint');
    expect(result.sceneLayers?.[0].polygonFilter?.polygons[0]).toHaveLength(3);
  });

  it('rejects a polygon filter ring with fewer than 3 points', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISImagery',
          sceneLayers: [
            {
              id: 'b',
              type: 'scene',
              url: 'https://x/SceneServer',
              polygonFilter: {
                polygons: [
                  [
                    { latitude: 1, longitude: 1 },
                    { latitude: 1, longitude: 2 },
                  ],
                ],
              },
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects an unknown elevation source type', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISImagery',
          elevationSources: [{ type: 'bogus' as never }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes an orbit-location camera controller', () => {
    const result = validateSceneSource({
      basemap: 'arcGISImagery',
      cameraController: {
        type: 'orbitLocation',
        target: { latitude: 41.98, longitude: 2.82 },
        distanceMeters: 500,
      },
    });
    expect(result.cameraController).toMatchObject({ type: 'orbitLocation', distanceMeters: 500 });
  });

  it('rejects a camera controller with non-positive distance', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISImagery',
          cameraController: {
            type: 'orbitLocation',
            target: { latitude: 0, longitude: 0 },
            distanceMeters: 0,
          },
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects an unknown atmosphere effect', () => {
    expect(
      caught(() =>
        validateSceneSource({ basemap: 'arcGISImagery', atmosphereEffect: 'foggy' as never })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes web-scene layer labels with placement', () => {
    const result = validateSceneSource({
      webSceneItemId: '850dfee7d30f4d9da0ebca34a533c169',
      webSceneLayerLabels: [
        {
          layerPath: ['Gas', 'Gas Main'],
          labels: [
            {
              expression: 'Text($feature.INSTALLATIONDATE, `DD MMM YY`)',
              arcade: true,
              color: '#FFA500',
              size: 16,
              haloColor: '#FFFFFF',
              haloWidth: 2,
              placement: 'lineAboveAlong',
            },
          ],
        },
      ],
    });
    expect(result.webSceneItemId).toBe('850dfee7d30f4d9da0ebca34a533c169');
    expect(result.webSceneLayerLabels?.[0].layerPath).toEqual(['Gas', 'Gas Main']);
    expect(result.webSceneLayerLabels?.[0].labels[0]).toMatchObject({
      arcade: true,
      placement: 'lineAboveAlong',
    });
  });

  it('rejects web-scene layer labels without a web scene', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISImagery',
          webSceneLayerLabels: [{ layerPath: ['Gas'], labels: [] }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects web-scene layer labels with an empty layer path or bad placement', () => {
    expect(
      caught(() =>
        validateSceneSource({
          webSceneItemId: 'abc',
          webSceneLayerLabels: [{ layerPath: [], labels: [] }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(
      caught(() =>
        validateSceneSource({
          webSceneItemId: 'abc',
          webSceneLayerLabels: [
            { layerPath: ['A'], labels: [{ expression: '[X]', placement: 'sideways' as never }] },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a scene layer with a mesh-fill renderer', () => {
    const result = validateSceneSource({
      basemap: 'arcGISImagery',
      sceneLayers: [
        {
          id: 'buildings',
          url: 'https://x/SceneServer',
          renderer: { type: 'simple', symbol: { type: 'meshFill', color: '#FF8C00' } },
        },
      ],
    });
    expect(result.sceneLayers?.[0].renderer).toMatchObject({
      type: 'simple',
      symbol: { type: 'meshFill', color: '#FF8C00' },
    });
  });

  it('rejects a mesh-fill symbol without a color', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISImagery',
          sceneLayers: [
            {
              id: 'b',
              url: 'https://x/SceneServer',
              renderer: { type: 'simple', symbol: { type: 'meshFill' } as never },
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects an unknown scene layer type and non-positive exaggeration', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISImagery',
          sceneLayers: [{ id: 'x', type: 'bogus' as never, url: 'https://x/SceneServer' }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(
      caught(() => validateSceneSource({ basemap: 'arcGISImagery', terrainExaggeration: 0 })).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a viewing mode', () => {
    const result = validateSceneSource({ basemap: 'arcGISImagery', viewingMode: 'local' });
    expect(result.viewingMode).toBe('local');
  });

  it('rejects an invalid viewing mode', () => {
    expect(
      caught(() => validateSceneSource({ basemap: 'arcGISImagery', viewingMode: 'flat' as never }))
        .code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('accepts a web scene item id alone', () => {
    const result = validateSceneSource({ webSceneItemId: 'deadbeef' });
    expect(result.webSceneItemId).toBe('deadbeef');
    expect(result.basemap).toBeUndefined();
  });

  it('rejects basemap combined with a web scene item id', () => {
    expect(
      caught(() => validateSceneSource({ basemap: 'arcGISImagery', webSceneItemId: 'deadbeef' }))
        .code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects duplicate scene layer ids', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISImagery',
          sceneLayers: [
            { id: 'a', url: 'https://x/SceneServer' },
            { id: 'a', url: 'https://y/SceneServer' },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a graphics overlay with a 3D scene symbol', () => {
    const result = validateSceneSource({
      basemap: 'arcGISTopographic',
      graphicsOverlays: [
        {
          id: 'markers',
          surfacePlacement: 'absolute',
          graphics: [
            {
              id: 'g1',
              geometry: { type: 'point', point: { latitude: 49, longitude: 4.9 } },
              symbol: {
                type: 'simpleMarkerScene',
                style: 'cone',
                color: '#FF0000',
                height: 200,
                width: 200,
                depth: 200,
              },
            },
          ],
        },
      ],
    });
    expect(result.graphicsOverlays?.[0].surfacePlacement).toBe('absolute');
    expect(result.graphicsOverlays?.[0].graphics[0].symbol).toEqual({
      type: 'simpleMarkerScene',
      style: 'cone',
      color: '#FF0000',
      height: 200,
      width: 200,
      depth: 200,
    });
  });

  it('rejects an invalid scene symbol style', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISTopographic',
          graphicsOverlays: [
            {
              id: 'o',
              graphics: [
                {
                  id: 'g',
                  geometry: { type: 'point', point: { latitude: 0, longitude: 0 } },
                  symbol: { type: 'simpleMarkerScene', style: 'pyramid' as never, color: '#FFF' },
                },
              ],
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a distance composite scene symbol', () => {
    const result = validateSceneSource({
      basemap: 'arcGISTopographic',
      graphicsOverlays: [
        {
          id: 'o',
          surfacePlacement: 'absolute',
          graphics: [
            {
              id: 'g',
              geometry: { type: 'point', point: { latitude: 0, longitude: 0, altitude: 500 } },
              symbol: {
                type: 'distanceCompositeScene',
                ranges: [
                  {
                    symbol: { type: 'simpleMarkerScene', style: 'cone', color: '#FF0000' },
                    minDistance: 0,
                    maxDistance: 1000,
                  },
                  {
                    symbol: { type: 'simpleMarkerScene', style: 'sphere', color: '#0000FF' },
                    minDistance: 1000,
                    maxDistance: 5000,
                  },
                ],
              },
            },
          ],
        },
      ],
    });
    const symbol = result.graphicsOverlays?.[0].graphics[0].symbol as {
      type: string;
      ranges: unknown[];
    };
    expect(symbol.type).toBe('distanceCompositeScene');
    expect(symbol.ranges).toHaveLength(2);
  });

  it('rejects a distance composite range whose symbol is not a scene marker', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISTopographic',
          graphicsOverlays: [
            {
              id: 'o',
              graphics: [
                {
                  id: 'g',
                  geometry: { type: 'point', point: { latitude: 0, longitude: 0 } },
                  symbol: {
                    type: 'distanceCompositeScene',
                    ranges: [{ symbol: { type: 'simpleMarker', color: '#FF0000' } as never }],
                  },
                },
              ],
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes graphic attributes and an extrusion renderer', () => {
    const result = validateSceneSource({
      basemap: 'arcGISTopographic',
      graphicsOverlays: [
        {
          id: 'buildings',
          surfacePlacement: 'drapedFlat',
          renderer: { type: 'simple', symbol: { type: 'simpleFill', color: '#FF000080' } },
          extrusion: { expression: '[height]', mode: 'baseHeight' },
          graphics: [
            {
              id: 'b1',
              geometry: {
                type: 'polygon',
                ring: [
                  { latitude: 0, longitude: 0 },
                  { latitude: 0, longitude: 0.01 },
                  { latitude: 0.01, longitude: 0.01 },
                ],
              },
              symbol: { type: 'simpleFill', color: '#FF0000' },
              attributes: { height: 5000, label: 'tower', active: true },
            },
          ],
        },
      ],
    });
    expect(result.graphicsOverlays?.[0].extrusion).toEqual({
      expression: '[height]',
      mode: 'baseHeight',
    });
    expect(result.graphicsOverlays?.[0].graphics[0].attributes).toEqual({
      height: 5000,
      label: 'tower',
      active: true,
    });
  });

  it('rejects extrusion without a renderer', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISTopographic',
          graphicsOverlays: [{ id: 'o', graphics: [], extrusion: { expression: '[height]' } }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a non-finite graphic attribute value', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISTopographic',
          graphicsOverlays: [
            {
              id: 'o',
              graphics: [
                {
                  id: 'g',
                  geometry: { type: 'point', point: { latitude: 0, longitude: 0 } },
                  symbol: { type: 'simpleMarker', color: '#FFF' },
                  attributes: { bad: Infinity },
                },
              ],
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects duplicate graphics overlay ids', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISTopographic',
          graphicsOverlays: [
            { id: 'dup', graphics: [] },
            { id: 'dup', graphics: [] },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a viewshed and a line-of-sight analysis', () => {
    const result = validateSceneSource({
      basemap: 'arcGISImagery',
      analyses: [
        {
          type: 'viewshed',
          location: { latitude: 45, longitude: 6.9, altitude: 1200 },
          headingDegrees: 20,
          pitchDegrees: 70,
          horizontalAngleDegrees: 45,
          verticalAngleDegrees: 30,
          minDistanceMeters: 50,
          maxDistanceMeters: 1500,
        },
        {
          type: 'lineOfSight',
          observer: { latitude: 45, longitude: 6.9, altitude: 1200 },
          target: { latitude: 45.01, longitude: 6.91, altitude: 1100 },
        },
      ],
    });
    expect(result.analyses?.[0]).toMatchObject({ type: 'viewshed', maxDistanceMeters: 1500 });
    expect(result.analyses?.[1]).toMatchObject({ type: 'lineOfSight' });
  });

  it('normalizes geoelement analyses and a distance measurement', () => {
    const result = validateSceneSource({
      basemap: 'arcGISImagery',
      analyses: [
        {
          type: 'geoElementViewshed',
          location: { latitude: 48.4, longitude: -4.5, altitude: 100 },
          headingDegrees: 20,
          pitchDegrees: 70,
          horizontalAngleDegrees: 45,
          maxDistanceMeters: 1000,
        },
        {
          type: 'geoElementLineOfSight',
          observer: { latitude: 48.39, longitude: -4.5, altitude: 60 },
          target: { latitude: 48.4, longitude: -4.5, altitude: 40 },
        },
        {
          type: 'distanceMeasurement',
          startLocation: { latitude: 48.39, longitude: -4.5, altitude: 20 },
          endLocation: { latitude: 48.4, longitude: -4.5, altitude: 80 },
          unitSystem: 'imperial',
        },
      ],
    });
    expect(result.analyses?.[0]).toMatchObject({
      type: 'geoElementViewshed',
      maxDistanceMeters: 1000,
      horizontalAngleDegrees: 45,
    });
    expect(result.analyses?.[1]).toMatchObject({ type: 'geoElementLineOfSight' });
    expect(result.analyses?.[2]).toMatchObject({
      type: 'distanceMeasurement',
      unitSystem: 'imperial',
    });
  });

  it('normalizes camera and interactive viewsheds', () => {
    const result = validateSceneSource({
      basemap: 'arcGISImagery',
      analyses: [
        {
          type: 'cameraViewshed',
          horizontalAngleDegrees: 90,
          verticalAngleDegrees: 60,
          maxDistanceMeters: 1200,
        },
        {
          type: 'interactiveViewshed',
          location: { latitude: 48.4, longitude: -4.5, altitude: 100 },
          headingDegrees: 20,
          pitchDegrees: 70,
          maxDistanceMeters: 1000,
        },
      ],
    });
    expect(result.analyses?.[0]).toMatchObject({
      type: 'cameraViewshed',
      maxDistanceMeters: 1200,
      verticalAngleDegrees: 60,
    });
    expect(result.analyses?.[1]).toMatchObject({
      type: 'interactiveViewshed',
      headingDegrees: 20,
      maxDistanceMeters: 1000,
    });
  });

  it('rejects an interactiveViewshed without finite heading/pitch', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISImagery',
          analyses: [
            {
              type: 'interactiveViewshed',
              location: { latitude: 0, longitude: 0 },
              headingDegrees: Number.NaN,
              pitchDegrees: 0,
              maxDistanceMeters: 1000,
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a geoElementViewshed without a positive maxDistanceMeters', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISImagery',
          analyses: [
            {
              type: 'geoElementViewshed',
              location: { latitude: 0, longitude: 0 },
              headingDegrees: 0,
              pitchDegrees: 0,
              maxDistanceMeters: -1,
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a distance measurement with an unknown unit system', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISImagery',
          analyses: [
            {
              type: 'distanceMeasurement',
              startLocation: { latitude: 0, longitude: 0 },
              endLocation: { latitude: 1, longitude: 1 },
              unitSystem: 'nautical' as never,
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a graphics overlay with orientation expressions', () => {
    const result = validateSceneSource({
      basemap: 'arcGISTopographic',
      graphicsOverlays: [
        {
          id: 'cones',
          renderer: {
            type: 'simple',
            symbol: { type: 'simpleMarkerScene', style: 'cone', color: '#FF0000' },
          },
          orientationExpressions: { headingExpression: '[HEADING]', pitchExpression: '[PITCH]' },
          graphics: [
            {
              id: 'c0',
              geometry: { type: 'point', point: { latitude: 0, longitude: 0 } },
              symbol: { type: 'simpleMarkerScene', style: 'cone', color: '#FF0000' },
              attributes: { HEADING: 45, PITCH: 20 },
            },
          ],
        },
      ],
    });
    expect(result.graphicsOverlays?.[0].orientationExpressions).toEqual({
      headingExpression: '[HEADING]',
      pitchExpression: '[PITCH]',
    });
  });

  it('rejects orientation expressions without a renderer', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISTopographic',
          graphicsOverlays: [
            {
              id: 'cones',
              orientationExpressions: { headingExpression: '[HEADING]' },
              graphics: [],
            } as never,
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes an animated image overlay', () => {
    const result = validateSceneSource({
      basemap: 'arcGISOceans',
      imageOverlays: [
        {
          id: 'radar',
          imagePaths: ['/tmp/a.png', '/tmp/b.png'],
          extent: {
            minLatitude: 32,
            minLongitude: -120,
            maxLatitude: 48,
            maxLongitude: -102,
          },
          framesPerSecond: 15,
          opacity: 0.65,
        },
      ],
    });
    expect(result.imageOverlays?.[0]).toMatchObject({
      id: 'radar',
      framesPerSecond: 15,
      opacity: 0.65,
    });
    expect(result.imageOverlays?.[0].imagePaths).toEqual(['/tmp/a.png', '/tmp/b.png']);
  });

  it('rejects an image overlay with empty imagePaths', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISOceans',
          imageOverlays: [
            {
              id: 'radar',
              imagePaths: [],
              extent: { minLatitude: 0, minLongitude: 0, maxLatitude: 1, maxLongitude: 1 },
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects an image overlay opacity out of range', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISOceans',
          imageOverlays: [
            {
              id: 'radar',
              imagePaths: ['/tmp/a.png'],
              extent: { minLatitude: 0, minLongitude: 0, maxLatitude: 1, maxLongitude: 1 },
              opacity: 2,
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('normalizes a scene feature layer with extrusion and labels', () => {
    const result = validateSceneSource({
      basemap: 'arcGISTopographic',
      featureLayers: [
        {
          id: 'states',
          url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3',
          renderer: { type: 'simple', symbol: { type: 'simpleFill', color: '#0000FF80' } },
          extrusion: { expression: '[POP2007] / 10', mode: 'baseHeight' },
        },
      ],
    });
    expect(result.featureLayers?.[0]).toMatchObject({
      id: 'states',
      extrusion: { expression: '[POP2007] / 10', mode: 'baseHeight' },
    });
  });

  it('rejects a scene feature layer extrusion without a renderer', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISTopographic',
          featureLayers: [
            {
              id: 'x',
              url: 'https://x/FeatureServer/0',
              extrusion: { expression: '[h]' },
            } as never,
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a viewshed without a positive maxDistanceMeters', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISImagery',
          analyses: [
            {
              type: 'viewshed',
              location: { latitude: 0, longitude: 0 },
              headingDegrees: 0,
              pitchDegrees: 90,
              maxDistanceMeters: 0,
            },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects an unknown analysis type', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISImagery',
          analyses: [{ type: 'heatmap' } as never],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('accepts a mobile scene package path alone', () => {
    expect(validateSceneSource({ mobileScenePackagePath: '/data/philadelphia.mspk' })).toEqual({
      mobileScenePackagePath: '/data/philadelphia.mspk',
    });
  });

  it('rejects a mobile scene package combined with a basemap', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISImagery',
          mobileScenePackagePath: '/data/philadelphia.mspk',
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a mobile scene package combined with a web scene', () => {
    expect(
      caught(() =>
        validateSceneSource({
          webSceneItemId: 'deadbeef',
          mobileScenePackagePath: '/data/philadelphia.mspk',
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('accepts a local point-cloud layer by path', () => {
    const result = validateSceneSource({
      basemap: 'arcGISImagery',
      sceneLayers: [{ id: 'pc', type: 'pointCloud', path: '/data/balboa.slpk' }],
    });
    expect(result.sceneLayers?.[0]).toEqual({
      id: 'pc',
      type: 'pointCloud',
      path: '/data/balboa.slpk',
    });
  });

  it('accepts a point-cloud layer by service url', () => {
    const result = validateSceneSource({
      basemap: 'arcGISImagery',
      sceneLayers: [{ id: 'pc', type: 'pointCloud', url: 'https://x/SceneServer' }],
    });
    expect(result.sceneLayers?.[0].url).toBe('https://x/SceneServer');
  });

  it('rejects a point-cloud layer with both url and path', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISImagery',
          sceneLayers: [
            { id: 'pc', type: 'pointCloud', url: 'https://x/SceneServer', path: '/data/x.slpk' },
          ],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a point-cloud layer with neither url nor path', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISImagery',
          sceneLayers: [{ id: 'pc', type: 'pointCloud' }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });

  it('rejects a path on a non-point-cloud scene layer', () => {
    expect(
      caught(() =>
        validateSceneSource({
          basemap: 'arcGISImagery',
          sceneLayers: [{ id: 's', url: 'https://x/SceneServer', path: '/data/x.slpk' }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});

describe('validateFeatureQueryOptions select', () => {
  it('normalizes select flag', () => {
    expect(validateFeatureQueryOptions({ layerId: 'x', select: true }).select).toBe(true);
  });
  it('rejects non-boolean select', () => {
    expect(
      caught(() => validateFeatureQueryOptions({ layerId: 'x', select: 1 as never })).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});

describe('validateQueryStatisticsOptions', () => {
  it('normalizes statistics, where clause and group-by', () => {
    const result = validateQueryStatisticsOptions({
      layerId: 'states',
      statistics: [
        { field: 'POP', type: 'sum', outName: 'total_pop' },
        { field: 'POP', type: 'average' },
      ],
      whereClause: 'REGION = 1',
      groupByFields: ['SUB_REGION'],
    });
    expect(result.statistics).toHaveLength(2);
    expect(result.statistics[0]).toEqual({ field: 'POP', type: 'sum', outName: 'total_pop' });
    expect(result.groupByFields).toEqual(['SUB_REGION']);
  });

  it('rejects an empty statistics array and an unknown statistic type', () => {
    expect(
      caught(() => validateQueryStatisticsOptions({ layerId: 'x', statistics: [] })).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(
      caught(() =>
        validateQueryStatisticsOptions({
          layerId: 'x',
          statistics: [{ field: 'F', type: 'median' as never }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});

describe('validateGeometryEditorOptions', () => {
  it('normalizes type + tool + snap', () => {
    expect(
      validateGeometryEditorOptions({
        geometryType: 'polygon',
        tool: 'freehand',
        snapEnabled: true,
      })
    ).toEqual({ geometryType: 'polygon', tool: 'freehand', snapEnabled: true });
  });

  it('accepts just a geometry type', () => {
    expect(validateGeometryEditorOptions({ geometryType: 'point' })).toEqual({
      geometryType: 'point',
    });
  });

  it('accepts the reticle tool', () => {
    expect(validateGeometryEditorOptions({ geometryType: 'polygon', tool: 'reticle' })).toEqual({
      geometryType: 'polygon',
      tool: 'reticle',
    });
  });

  it('rejects an invalid geometry type or tool', () => {
    expect(
      caught(() => validateGeometryEditorOptions({ geometryType: 'blob' as never })).code
    ).toBe('E_INVALID_ARGUMENT');
    expect(
      caught(() =>
        validateGeometryEditorOptions({ geometryType: 'polygon', tool: 'laser' as never })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});

describe('validateKmlTourOptions', () => {
  it('normalizes a valid tour action', () => {
    expect(validateKmlTourOptions({ layerId: 'kml', action: 'play' })).toEqual({
      layerId: 'kml',
      action: 'play',
    });
  });

  it('rejects a missing layerId or unknown action', () => {
    expect(caught(() => validateKmlTourOptions({ layerId: '', action: 'play' })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
    expect(
      caught(() => validateKmlTourOptions({ layerId: 'kml', action: 'stop' as never })).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});

describe('validateCreateKmlFileOptions', () => {
  it('normalizes placemarks and tracks', () => {
    const result = validateCreateKmlFileOptions({
      path: '/tmp/out.kmz',
      placemarks: [{ name: 'A', point: { latitude: 1, longitude: 2 } }],
      tracks: [
        {
          points: [
            { latitude: 0, longitude: 0 },
            { latitude: 1, longitude: 1 },
          ],
        },
      ],
    });
    expect(result.path).toBe('/tmp/out.kmz');
    expect(result.placemarks?.[0]).toMatchObject({ name: 'A' });
    expect(result.tracks?.[0].points).toHaveLength(2);
  });

  it('rejects a file with neither placemarks nor tracks', () => {
    expect(caught(() => validateCreateKmlFileOptions({ path: '/tmp/out.kmz' })).code).toBe(
      'E_INVALID_ARGUMENT'
    );
  });

  it('rejects a track with fewer than two points', () => {
    expect(
      caught(() =>
        validateCreateKmlFileOptions({
          path: '/tmp/out.kmz',
          tracks: [{ points: [{ latitude: 0, longitude: 0 }] }],
        })
      ).code
    ).toBe('E_INVALID_ARGUMENT');
  });
});
