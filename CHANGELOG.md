# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- The iOS config plugin now wires **both** ArcGIS Swift Packages (core `arcgis-maps-sdk-swift` and
  the toolkit, pinned `300.0.0`) into the consumer's Xcode project automatically during `pod install`.
  Adding the ArcGIS Swift Package by hand in Xcode is **no longer required** — a fresh consumer builds
  iOS after `expo prebuild` with no manual step. The obsolete manual-step warning has been removed.

## [0.1.0] - 2026-08-14

### Added

- Native 2D `ArcgisMapView`, 3D `ArcgisSceneView`, and augmented-reality `ArcgisArView`
  (world-scale, tabletop, flyover) for Expo and React Native, backed by the ArcGIS Maps SDK for
  Swift (iOS) and Kotlin (Android).
- API-key configuration and authentication, basemap styles, web maps and web scenes, initial and
  imperative viewpoint control.
- Feature layers, graphics overlays, `identify`, feature queries and editing, geocoding, routing and
  service areas, utility-network tracing, offline map generation, and real-time dynamic entities.
- AR tracking events with a tracking-failure reason (`ArTrackingReason`) and an `isArSupported`
  capability probe.
- Expo config plugin, stable typed errors, TypeScript types, a Jest mock, and an example
  application.

### Notes

- Pre-`1.0.0`: the public API may change between minor versions.
- The 3D scene foundation is compile-verified; broad 3D is a roadmap item.

[unreleased]: https://github.com/webtrackerxy/expo-arcgis-maps-sdk/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/webtrackerxy/expo-arcgis-maps-sdk/releases/tag/v0.1.0
