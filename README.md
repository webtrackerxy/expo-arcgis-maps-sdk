# expo-arcgis-maps-sdk

Community-maintained ArcGIS Maps SDK bindings for Expo and React Native.

`expo-arcgis-maps-sdk` renders native ArcGIS maps through:

- [ArcGIS Maps SDK for Swift](https://developers.arcgis.com/swift/) on iOS
- [ArcGIS Maps SDK for Kotlin](https://developers.arcgis.com/kotlin/) on Android
- [Expo Modules API](https://docs.expo.dev/modules/overview/) for the React Native interface

> [!IMPORTANT]
> This project is an independent community package. It is not affiliated with, maintained by,
> endorsed by, or supported by Esri. ArcGIS is a trademark of Esri.

## Try the example app

The `example/` app is published to Google Play, so you can see the module running on a real
device without building it yourself.

<a href="https://play.google.com/store/apps/details?id=uk.co.sincetech.expo.arcgis.maps.sdk">
  <img
    src="https://raw.githubusercontent.com/webtrackerxy/expo-arcgis-maps-sdk/main/docs/assets/google-play-badge.png"
    alt="Get it on Google Play"
    height="48"
  />
</a>

## Project status

Early development. The public API may change before `1.0.0`.

The first milestone deliberately targets a small, production-testable 2D API. Advanced ArcGIS
capabilities will be added incrementally after the native view, lifecycle, error handling and
cross-platform behaviour are stable.

## Why this architecture?

ArcGIS Maps SDK is distributed as separate Swift and Kotlin SDKs. It is not a shared C++ library,
so this project does not place C++ or custom JSI bindings between React Native and ArcGIS.

```text
TypeScript API
    |
    v
Expo Modules API
    |-----------------------------|
    v                             v
Swift native view                 Kotlin native view
ArcGIS Maps SDK for Swift         ArcGIS Maps SDK for Kotlin
```

Expo Modules API provides native views, asynchronous functions and events while supporting React
Native's New Architecture. Native SDK objects remain on their native platform; only stable,
serializable DTOs cross the JavaScript/native boundary.

## Scope

The project began as a small 2D milestone and has since grown well beyond it. The
public API and the Expo example app (one screen per capability) now cover:

**Views**

- Native 2D `ArcgisMapView` on iOS and Android
- 3D `ArcgisSceneView` (local and global scenes, scene/3D-tiles/integrated-mesh layers)
- Augmented reality via `ArcgisArView` — world-scale, tabletop and flyover — with
  `isArSupported` and AR tracking state/failure-reason events

**Display and configuration**

- API-key configuration and authentication (API key, OAuth, token, enterprise)
- ArcGIS basemap styles; web maps and web scenes from portal item IDs
- Initial viewpoint and imperative viewpoint changes

**Data and layers**

- Feature service layers, graphics overlays, and layer/graphics reconciliation by ID
- Feature editing, attachments, feature forms, the geometry editor and branch versioning
- Offline map generation, vector-tile and mobile-geodatabase export
- Real-time dynamic entities

**Query, search and analysis**

- `identify`, feature queries, geocoding, routing and service areas
- Utility-network tracing; geometry, coordinate and line-of-sight operations

**Cross-cutting**

- Map load / error / single-tap / viewpoint-change and AR tracking events
- Stable typed errors and explicit cancellation/disposal for long-running native work
- TypeScript types, a Jest mock, and an Expo example application

Not supported:

- **Web.** This package binds the native Swift and Kotlin SDKs; for web, use the
  [ArcGIS Maps SDK for JavaScript](https://developers.arcgis.com/javascript/).

## Requirements

The initial implementation targets ArcGIS Maps SDK `300.0.0`.

| Platform     | Minimum                                              |
| ------------ | ---------------------------------------------------- |
| Expo         | SDK 54 or newer                                      |
| React Native | New Architecture enabled                             |
| iOS          | iOS 17, Xcode 26 and iOS 26 SDK                      |
| Android      | Android 9 / API 28                                   |
| Development  | An ArcGIS Location Platform or ArcGIS Online account |

ArcGIS Maps SDK 300.0 supports Android API 28 through API 36. Some advanced analysis APIs have
higher hardware and OS requirements. Consult Esri's current
[Swift system requirements](https://developers.arcgis.com/swift/system-requirements/system-requirements-for-300-0/)
and [Kotlin system requirements](https://developers.arcgis.com/kotlin/system-requirements/system-requirements-for-300-0/)
before changing the native SDK version.

This package contains native code and does not work in Expo Go. Use a development build.

## Create the project

```bash
npx create-expo-module expo-arcgis-maps-sdk
cd expo-arcgis-maps-sdk
yarn
```

Keep the generated example application. It is the integration test host for both native platforms.

## Intended installation

The following commands describe the intended consumer experience after the first package release:

```bash
npx expo install expo-arcgis-maps-sdk
npx expo prebuild --clean
npx expo run:ios
# or
npx expo run:android
```

During local development, run the package's generated example app instead.

## Config plugin

Add the config plugin to your app config so `expo prebuild` applies the native requirements that
autolinking cannot express:

```json
{
  "expo": {
    "plugins": ["expo-arcgis-maps-sdk"]
  }
}
```

The plugin is idempotent across repeated prebuilds and:

- **Android** — adds Esri's Maven repository to the root `build.gradle` (`allprojects`), raises
  `android.minSdkVersion` to 28 and `android.compileSdkVersion` to 36 _only when your values are
  lower_, and pins the Kotlin Gradle plugin to **2.2.21**. (ArcGIS Maps SDK for Kotlin 300.0 ships
  Kotlin metadata 2.3.0, which Expo SDK 57 / RN 0.86's default Kotlin 2.1.x cannot read; 2.2.x reads
  it and stays under Expo's `< 2.3.0` support ceiling.)
- **iOS** — raises the iOS deployment target to 17.0 (Podfile **and** the Xcode app target) when
  lower, and wires **both** ArcGIS Swift Packages (pinned `300.0.0`) into the project via a Podfile
  `post_install` hook — no manual Xcode step. The **ArcGIS Maps SDK for Swift Toolkit** is added to
  the Pods project and linked to this module's pod (the pod does `import ArcGISToolkit`, and gets
  `import ArcGIS` transitively); the binary **ArcGIS** framework is linked to the app target; and the
  Toolkit is _also_ referenced from the app project (reference only, not linked there) so a headless
  `xcodebuild` resolves it — `xcodebuild` resolves Swift packages referenced by the app project but
  ignores ones referenced only from `Pods.xcodeproj`.

### iOS Swift Packages (automatic)

No manual Xcode step is required. During `pod install` (run by `expo prebuild`), the config plugin
adds the ArcGIS Maps SDK for Swift and its Toolkit (both pinned `300.0.0`) and links them so the
module and app build directly. Because this is a native module, iOS requires a **dev build /
`expo prebuild`** — it does not run in Expo Go.

## API

The API below is implemented as of v0.1.0. It is pre-1.0, so it may change between minor versions.

```tsx
import { ArcgisMapView, configureArcgis, type ArcgisMapViewRef } from 'expo-arcgis-maps-sdk';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';

export default function MapScreen() {
  const mapRef = useRef<ArcgisMapViewRef>(null);

  useEffect(() => {
    configureArcgis({
      apiKey: process.env.EXPO_PUBLIC_ARCGIS_API_KEY!,
    });
  }, []);

  return (
    <ArcgisMapView
      ref={mapRef}
      style={styles.map}
      map={{
        basemap: 'arcGISTopographic',
        initialViewpoint: {
          center: { latitude: 51.4123, longitude: -0.3007 },
          scale: 50_000,
        },
        featureLayers: [
          {
            id: 'incidents',
            url: 'https://services.arcgis.com/.../FeatureServer/0',
          },
        ],
      }}
      onMapLoad={({ nativeEvent }) => {
        console.log('Map loaded', nativeEvent);
      }}
      onMapError={({ nativeEvent }) => {
        console.error(nativeEvent.code, nativeEvent.message);
      }}
      onSingleTap={({ nativeEvent }) => {
        console.log(nativeEvent.mapPoint);
      }}
    />
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
```

Imperative operations are exposed through a typed ref:

```ts
await mapRef.current?.setViewpoint(
  {
    center: { latitude: 51.4123, longitude: -0.3007 },
    scale: 10_000,
  },
  { durationMs: 500 }
);

const results = await mapRef.current?.identify({
  screenPoint: { x: 160, y: 320 },
  tolerance: 12,
  maximumResults: 20,
});
```

## API design principles

1. **Cross-platform first.** A public API is released only when both platforms implement and test
   the same documented behaviour.
2. **Native ownership.** ArcGIS SDK objects never cross into JavaScript. TypeScript receives plain
   DTOs and opaque numeric handles only where a persistent native resource is necessary.
3. **Explicit lifecycle.** Long-running jobs are cancellable. Persistent handles expose `release()`,
   and native views release observers, coroutines, tasks and SDK references when unmounted.
4. **Small boundary payloads.** Pass configuration and results through Expo Modules API. Keep large
   datasets inside native feature layers or files instead of serialising them through JavaScript.
5. **Stable errors.** Native errors become documented `{ code, message, details? }` values. Do not
   expose raw platform exception text as the only error contract.
6. **Secure configuration.** API keys embedded in mobile apps are recoverable. Use narrowly scoped
   ArcGIS credentials and the restrictions supported by your ArcGIS account.

## Proposed project structure

```text
expo-arcgis-maps-sdk/
├── src/
│   ├── ArcgisMapView.tsx
│   ├── ExpoArcgisMapsSdkModule.ts
│   ├── index.ts
│   ├── types/
│   └── __mocks__/
├── ios/
│   ├── ExpoArcgisMapsSdkModule.swift
│   ├── ExpoArcgisMapView.swift
│   ├── MapViewModel.swift
│   └── ExpoArcgisMapsSdk.podspec
├── android/src/main/java/expo/modules/arcgismapssdk/
│   ├── ExpoArcgisMapsSdkModule.kt
│   ├── ExpoArcgisMapView.kt
│   ├── ArcgisMapViewModel.kt
│   └── dto/
├── plugin/
│   └── src/
├── example/
├── CLAUDE.md
└── README.md
```

The SDK is intended to gain an optional, pure-React UI companion package
(`expo-arcgis-maps-toolkit`) once the 2D core is stable — mirroring Esri's own core/toolkit split.
The boundary, the "RN-by-default, native-wrap by exception" build rule, and the gate for the split
are documented in [`docs/architecture.md`](docs/architecture.md#core-vs-toolkit-boundary). The
physical split is deliberately deferred; toolkit-candidate components incubate in `example/` for now.

## Native dependency strategy

### Android

- Resolve `com.esri:arcgis-maps-kotlin:300.0.0` from Esri's Maven repository.
- Resolve the ArcGIS Maps SDK for Kotlin **Toolkit** (`com.esri:arcgis-maps-kotlin-toolkit-*:300.0.0`,
  via the toolkit BOM) for the Compose-based components (e.g. the scale bar). The module enables
  Jetpack Compose and hosts these composables in a `ComposeView`; they resolve from the same Esri
  Maven repository the config plugin adds.
- The config plugin must add the repository idempotently.
- The config plugin must raise `minSdk` only when the consumer's value is lower than the required
  minimum and must fail with an actionable message when configuration cannot be applied safely.
- Never use dynamic ArcGIS dependency versions.

### iOS

- Resolve the exact `300.0.0` ArcGIS Swift package.
- Resolve the exact `300.0.0` ArcGIS Swift **Toolkit** package (`arcgis-maps-sdk-swift-toolkit`). It
  is a source Swift Package, so the config plugin wires it as a build-order dependency of the
  module's pod (`plugin/src/withArcgisPodfile.ts`) rather than relying on framework search paths.
- Ensure the `ArcGIS` binary framework is linked and embedded in Debug and Release archives.
- Validate a physical-device Release archive, not only a simulator Debug build.
- Keep framework embedding changes idempotent and compatible with other config plugins.

## Development workflow

```bash
# Install dependencies
yarn

# Build TypeScript
yarn build

# Run static checks
yarn check

# Recreate native example projects after dependency/config-plugin changes
cd example
npx expo prebuild --clean

# Run the native example app. Each platform uses its own dedicated Metro port so
# iOS and Android (and other RN projects on the default 8081) never collide.
yarn ios       # expo run:ios --device --port 8006
yarn android   # expo run:android --port 8007
```

The example includes an **AR diagnostics & device sensors** screen (under the
Augmented Reality category) for on-device debugging: it shows AR support, live
tracking state and failure reason, camera pose, every device-motion sensor with
its measured update rate, and a 3D orientation cube driven by device motion.

The repository should define `yarn check` as the single required local quality gate:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --max-warnings 0",
    "prettier-check": "prettier --check .",
    "test": "jest",
    "check": "yarn typecheck && yarn lint && yarn prettier-check && yarn test"
  }
}
```

Native changes also require successful iOS and Android example builds. TypeScript checks alone are
not sufficient for a native package.

## Testing strategy

- **TypeScript unit tests:** prop normalisation, validation, error mapping and public exports.
- **Jest mock tests:** consumers can test without loading native code.
- **Swift unit tests:** DTO conversion, map construction and error mapping.
- **Kotlin unit tests:** DTO conversion, map construction and error mapping.
- **Example integration tests:** map load, viewpoint change, tap, feature layer and unmount/remount.
- **Release validation:** Android release build and iOS physical-device archive.
- **Parity tests:** the same fixtures and expected results on iOS and Android.

## Roadmap

### Milestone 1 — foundation

- Scaffold with `create-expo-module` ✅
- Add exact native ArcGIS dependencies ✅
- Implement config plugin ✅
- Render a native `MapView` ✅
- Configure API key and basemap ✅
- CI and Jest mock ✅
- Web maps ✅
- Feature layers ✅
- Graphics overlays ✅
- Viewpoint commands ✅
- Tap and viewpoint events ✅
- Identify ✅
- Feature queries ✅
- Feature editing ✅
- Authentication challenge handling ✅
- Credential persistence ✅
- Geocoding and routing ✅
- Cancellable offline-map jobs ✅
- Download progress and storage management ✅
- Geodatabase synchronisation ✅
- `ArcgisSceneView` and scene layers ✅ (minimal 3D foundation: basemap + world
  elevation + scene layers + camera; compile-verified, not device-verified)
- `ArcgisArView` — world-scale, tabletop and flyover AR, with tracking-state and
  failure-reason events ✅

## Anatomy of a feature

Every SDK capability is added the same way: **design the TypeScript contract first**, then
implement both native platforms, then add tests and an example screen. Using **offline maps** as
the worked example, a feature touches these layers:

1. **TypeScript contract**
   - `src/types/offline.ts` — serializable DTOs (`OfflineMapJobOptions`, result types). Strings,
     numbers, booleans and plain objects only; never native types such as `Job` or `PortalItem`.
   - `src/offline.ts` — the public function, e.g. `startOfflineMapJob(options)`.
   - Re-export the types from `src/types/index.ts` and the function from `src/index.ts`.
   - Long-running work uses the shared job handle — `src/jobs.ts` (`makeJobHandle`) and
     `src/types/job.ts` (`Job`: an opaque `jobId`, `onProgress`, `cancel()`, a typed result).
     The promise settles exactly once and cancellation is a typed outcome, not an exception.

2. **Validation** — normalise inputs and reject bad ones with a stable error (e.g.
   `validateOfflineMapJobOptions` in `src/validation.ts`, throwing `E_INVALID_ARGUMENT`).

3. **iOS (Swift)** — implement the `AsyncFunction` (or view) in
   `ios/ExpoArcgisMapsSdkModule.swift`, converting DTOs ↔ ArcGIS types in a `Record`
   (e.g. `ios/MapRecords.swift`), mapping native errors to package codes, and cancelling the
   `Task`/job on disposal.

4. **Android (Kotlin)** — the matching `AsyncFunction` in
   `android/src/main/java/expo/modules/arcgismapssdk/ExpoArcgisMapsSdkModule.kt`, with DTO
   conversion in `android/src/main/java/expo/modules/arcgismapssdk/dto/MapRecords.kt`, and the
   coroutine/job cancelled on disposal.

5. **Tests** — TypeScript (`src/__tests__/offline.test.ts`: validation and error mapping) plus the
   Jest mock in `src/__mocks__/`, and Swift/Kotlin DTO-conversion tests.

6. **Example screen** — a deterministic screen under `example/components/screens/`
   (`OfflineScreen.tsx`) that demonstrates both the success and failure paths, registered in
   `example/components/screens/index.ts`.

7. **Config plugin** — only when the feature needs consumer-project setup (permissions,
   entitlements): add an idempotent, tested modifier under `plugin/`.

8. **Docs** — document any platform difference and update the relevant note in [`docs/`](./docs).

The feature is done when every layer above is present, `yarn check` passes, and both native example
builds succeed.

## Contributing

Issues and pull requests are welcome after the repository is published. Every feature pull request
must include:

- TypeScript types and documentation
- iOS and Android implementations, or an explicit platform-support decision
- Tests for successful and failing paths
- Example-app coverage
- Confirmation that native resources are cancelled and released correctly

## Licensing

The wrapper source is intended to be released under the MIT License.

Use of ArcGIS Maps SDKs, ArcGIS services, basemaps and data is governed by Esri's applicable
licenses and terms. Consumers are responsible for their ArcGIS account, credentials, service costs,
data rights, attribution and deployment licensing.
