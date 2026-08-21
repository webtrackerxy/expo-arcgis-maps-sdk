# expo-arcgis-maps-sdk — example app

The integration host for `expo-arcgis-maps-sdk`. It exercises every public feature of the
module on real iOS and Android builds through a set of deterministic, self-running demo
screens grouped by capability.

Use it to:

- verify a feature renders and behaves the same on both platforms,
- reproduce the expected success **and** failure paths for each API,
- try the SDK against your own ArcGIS content.

## Prerequisites

- Node + Yarn, and the Expo prerequisites for the platform you target (Xcode 26 / iOS 17+
  simulator, or Android SDK with an API 28+ emulator).
- An ArcGIS **API key** with the privileges the demos use (basemaps, geocoding, routing).
  Some screens (e.g. closest-facility) need premium routing privileges your key may not have.

## Setup

```bash
# from the repo root
yarn install

cd example
cp .env.example .env
# then edit example/.env and set your key:
#   EXPO_PUBLIC_ARCGIS_API_KEY=<your-api-key>
```

`example/.env` is git-ignored. The key is inlined into the JS bundle at build time, so after
changing it restart Metro with `--clear`.

> Never commit an API key. Treat a mobile API key as recoverable even when shipped in an app;
> use a scoped key with ArcGIS usage restrictions.

## Run

```bash
# iOS (simulator or device)
yarn ios

# Android (emulator or device)
yarn android

# Web (subset of features; native views are not available on web)
yarn web
```

The home screen lists capability categories; each opens a list of demo screens that render the
feature and report load/success/error status on screen.

## Feature coverage

Coverage is measured against the official ArcGIS Maps SDK sample apps. **Shipped** features are
implemented on both iOS and Android with tests and a demo screen here.

**All 241 official samples are now covered — none remain out of scope.** The module started 2D-first
and extended category by category: 3D scenes, analysis, raster, KML depth, geoprocessing, the
utility-network subsystem, augmented reality, real-time custom feeds, ENC charts, and enterprise
authentication. A few features are
compile-verified rather than run on-device because they need hardware or infrastructure not
available here (ARKit AR needs a physical iPhone; IWA/PKI need protected portals; ENC needs its
data packages provisioned) — each is flagged where it appears.

| Category            | Shipped | Out of scope | Total |
| ------------------- | ------: | -----------: | ----: |
| Maps                |      33 |            0 |    33 |
| Layers              |      42 |            0 |    42 |
| Visualization       |      39 |            0 |    39 |
| Search & Query      |      18 |            0 |    18 |
| Analysis            |      17 |            0 |    17 |
| Edit & Manage Data  |      37 |            0 |    37 |
| Routing & Logistics |      10 |            0 |    10 |
| Cloud & Portal      |       8 |            0 |     8 |
| Scenes (3D)         |      24 |            0 |    24 |
| Augmented Reality   |       5 |            0 |     5 |
| Utility Networks    |       8 |            0 |     8 |
| **Total**           | **241** |        **0** | **241** |

Routing & Logistics and Scenes each mirror the official app's dedicated screens one-to-one (10
routing screens; 20 scene screens). A live, filterable version of this dashboard is maintained
alongside the project docs.

## Notes

- Run Metro on port **8085** for on-device end-to-end testing to avoid other projects' Metro
  instances on 8081 (`yarn start --port 8085`, then `adb reverse tcp:8081 tcp:8085`).
- Native views are not rendered on web; web screens fall back to informational placeholders.
- **Augmented Reality** screens compile on both platforms and are structurally complete, but a
  full on-device run is pending: ARKit does not run in the iOS Simulator (a physical iPhone is
  required), and ARCore needs a supported device or an AR-enabled emulator image. They gate on
  `isArSupported()` and show a notice where AR is unavailable. See
  [`docs/augmented-reality.md`](../docs/augmented-reality.md).
