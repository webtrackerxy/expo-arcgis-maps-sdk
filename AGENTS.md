# CLAUDE.md

This file defines the engineering contract for AI-assisted work in `expo-arcgis-maps-sdk`.
Follow it for every change unless a maintainer gives a more specific instruction.

## Mission

Build a reliable, typed, community-maintained Expo module that exposes selected ArcGIS Maps SDK
capabilities consistently across iOS and Android.

Native implementations:

- iOS: ArcGIS Maps SDK for Swift
- Android: ArcGIS Maps SDK for Kotlin
- React Native integration: Expo Modules API

The goal is not to expose every ArcGIS class directly. The goal is a small, stable and idiomatic
React Native API with predictable cross-platform behaviour.

## Non-negotiable architecture

1. Use Expo Modules API native views and async functions.
2. Implement iOS in Swift and Android in Kotlin.
3. Do not add C++, JNI, Objective-C++ or custom JSI bindings for ArcGIS features.
4. Do not use ArcGIS Maps SDK for JavaScript inside a WebView.
5. Do not pass native ArcGIS objects to JavaScript.
6. Do not expose a feature on one platform under the common API without documenting and testing the
   platform difference.

The reusable RN-to-C++ study supplied at project inception informs lifecycle, cancellation, typed
boundaries, capability reporting and testing. Its C++/JSI transport is intentionally not used:
ArcGIS supplies separate Swift and Kotlin APIs, and Expo Modules API is the appropriate binding
layer for this project.

## Initial scope

Work in this order unless the issue explicitly targets a later milestone:

1. Native `ArcgisMapView` renders and unmounts safely.
2. Global ArcGIS configuration and API key.
3. Basemap and initial viewpoint.
4. Map load/error events.
5. Viewpoint commands and viewpoint-change events.
6. Feature layers.
7. Graphics overlays.
8. Single-tap and identify.
9. Authentication.
10. Queries, editing, routing, offline jobs and 3D.

Do not implement broad 3D, offline, utility-network or real-time APIs before the 2D foundation is
stable on both platforms.

## Naming

Use these canonical names:

| Purpose         | Name                         |
| --------------- | ---------------------------- |
| npm package     | `expo-arcgis-maps-sdk`       |
| Expo module     | `ExpoArcgisMapsSdk`          |
| React component | `ArcgisMapView`              |
| React ref       | `ArcgisMapViewRef`           |
| iOS module      | `ExpoArcgisMapsSdkModule`    |
| iOS view        | `ExpoArcgisMapView`          |
| Android package | `expo.modules.arcgismapssdk` |
| Android module  | `ExpoArcgisMapsSdkModule`    |
| Android view    | `ExpoArcgisMapView`          |

Use `ArcGIS` in prose when referring to Esri's product. Use `Arcgis` in exported TypeScript symbols
to avoid inconsistent all-caps word handling in PascalCase.

## Repository layout

```text
src/                         Public TypeScript API and serializable types
ios/                         Swift implementation
android/                     Kotlin implementation
plugin/                      Expo config plugin
example/                     Integration host and manual test screens
docs/                        Design notes and supported API tables
```

Keep platform DTO conversion close to the platform implementation. Do not create a shared C++ core.

## Public API rules

### Design the TypeScript contract first

Before native implementation:

1. Add or update the TypeScript DTO.
2. Document nullability, defaults, units and error behaviour.
3. Confirm it can be represented by Expo Modules API-supported values.
4. Define matching Swift and Kotlin conversion tests.

Public values must be serializable:

- strings, numbers and booleans
- arrays and plain objects
- documented string unions
- opaque numeric IDs only for persistent native resources

Do not expose platform types such as `AGSPoint`, `Point`, `UIColor`, `Color`, `Task`, `Job` or
`PortalItem` through the TypeScript API.

### Prefer domain DTOs

Good:

```ts
export type GeographicPoint = {
  latitude: number;
  longitude: number;
  altitude?: number;
  spatialReference?: SpatialReference;
};
```

Bad:

```ts
export type NativeArcgisObject = Record<string, unknown>;
```

Avoid untyped `object`, `Record<string, any>` and `any`. Use `unknown` only at an external parsing
boundary and validate it immediately.

### Keep props declarative and commands imperative

Use props for durable state:

- map source
- basemap
- layers
- graphics
- interaction settings

Use the component ref for actions:

- animate to viewpoint
- identify
- export an image
- cancel a job

Do not trigger one-time actions by toggling magic props.

### Stable errors

All public failures must map to:

```ts
export type ArcgisError = {
  code: ArcgisErrorCode;
  message: string;
  details?: Record<string, unknown>;
};
```

Use stable package-owned codes such as:

- `E_NOT_CONFIGURED`
- `E_INVALID_ARGUMENT`
- `E_MAP_LOAD_FAILED`
- `E_LAYER_LOAD_FAILED`
- `E_AUTHENTICATION_FAILED`
- `E_JOB_CANCELLED`
- `E_UNSUPPORTED`
- `E_NATIVE_FAILURE`

Preserve useful native information in `details`; never make raw native exception text the API.
Never include access tokens, API keys or private URLs in errors or logs.

## Native view rules

### Lifecycle

Every view must:

- create ArcGIS objects on the UI thread where required
- retain observation/listener tokens explicitly
- cancel Swift tasks and Kotlin coroutines during disposal
- remove event listeners during disposal
- release map, overlay and layer references when unmounted
- survive mount, unmount and remount without duplicate observers
- ignore stale async completion after disposal

Never rely on JavaScript garbage collection to release native GIS resources.

### Threading

- UI changes remain on the main thread.
- Expensive or suspendable ArcGIS work uses Swift structured concurrency or Kotlin coroutines.
- Never block the JS thread, iOS main thread or Android main thread while waiting for network,
  loading, query or offline operations.
- Send events to JavaScript at a controlled rate.

Viewpoint events can be high frequency. Throttle or emit only meaningful changes; do not send every
render frame across the boundary.

### Source of truth

Treat JS props as the source of truth for declarative state. Apply minimal native diffs rather than
rebuilding the entire map for every prop update.

Use stable IDs for layers and graphics. Reconcile by ID:

- add missing items
- update changed items
- remove deleted items
- preserve unchanged native instances

Do not compare arbitrary native SDK objects for React reconciliation.

## Long-running jobs

Offline generation, synchronisation, routing and other long operations must use a job abstraction.

Each job requires:

- an opaque job ID
- status
- progress when the native SDK provides it
- a typed result
- `cancel()`
- guaranteed cleanup on completion, cancellation, module invalidation and app teardown

Promise settlement must occur exactly once. Cancellation is a normal typed outcome, not an
unhandled native exception.

Do not implement a generic job system before the first real long-running feature needs it.

## Native dependency policy

- Pin the same ArcGIS release on iOS and Android.
- Never use `+`, `latest`, version ranges or unpinned branches for native ArcGIS dependencies.
- Start with `300.0.0`.
- Read both Esri release notes and system requirements before upgrading.
- Record breaking requirements in README and the config plugin.
- Make dependency/config-plugin changes idempotent.

### iOS

- Use the official ArcGIS Maps SDK for Swift package.
- The initial deployment target is iOS 17.
- Build with Xcode 26 and the iOS 26 SDK for ArcGIS 300.0.
- Confirm `ArcGIS.framework` is linked and embedded in Debug and Release.
- Test simulator Debug, physical-device Debug and physical-device Release archive.
- Avoid build-phase ordering assumptions that conflict with crash-reporting or symbol-upload plugins.

### Android

- Use `com.esri:arcgis-maps-kotlin:300.0.0` from Esri's Maven repository.
- The initial minimum SDK is API 28.
- Compile against API 36 for the initial ArcGIS 300.0 integration.
- Do not use deprecated support libraries, JCenter or Bintray.
- Check APK/AAB ABI contents and size changes after native dependency updates.

## Config plugin

The config plugin owns consumer-project requirements that autolinking cannot express.

It must:

- add Esri's Maven repository on Android
- enforce the supported Android minimum/compile SDK values
- enforce the iOS deployment target
- apply iOS package/framework configuration when required
- support repeated `expo prebuild` runs without duplicate repositories, phases or frameworks
- provide actionable errors

It must not:

- silently lower a consumer setting
- overwrite unrelated build settings
- duplicate Xcode build phases
- log credentials
- assume it is the only config plugin modifying the project

Any plugin change requires tests against representative Gradle and Xcode project fixtures and a
clean example-app prebuild.

## Authentication and secrets

- Never commit API keys, OAuth client secrets, access tokens or refresh tokens.
- Use `.env.example` with placeholder values only.
- Treat a mobile API key as recoverable even if placed in `Info.plist`, resources or app config.
- Recommend scoped credentials and available ArcGIS restrictions.
- Store user credentials with the secure native credential mechanisms supported by ArcGIS and the
  operating system.
- Redact credentials from errors, analytics, snapshots and test fixtures.

## Testing requirements

Every change must be tested at the lowest sensible layer.

### TypeScript

- public type and export tests
- validation and normalisation tests
- error mapping tests
- Jest mock behaviour

### Swift

- DTO conversion
- invalid input
- native error conversion
- state reconciliation
- cancellation/disposal where testable

### Kotlin

- DTO conversion
- invalid input
- native error conversion
- state reconciliation
- cancellation/disposal where testable

### Integration example

Maintain deterministic screens for:

- basemap load
- web map load
- feature layer
- graphics
- viewpoint animation
- tap and identify
- unmount/remount
- expected authentication/load failure

For each public feature, test both platforms before marking it supported.

## Required commands

Use Yarn consistently.

Before completing a TypeScript-only change:

```bash
yarn check
```

`yarn check` must run:

```bash
yarn typecheck && yarn lint && yarn prettier-check && yarn test
```

Before completing native or config-plugin work, also run the relevant clean native builds:

```bash
cd example
npx expo prebuild --clean
npx expo run:ios
npx expo run:android
```

For release-related changes, additionally verify:

- iOS physical-device Release archive
- Android release AAB
- npm package contents
- installation into a clean consumer fixture

If a required check cannot run, report exactly which check was not run and why. Never describe an
untested change as verified.

## Code quality

- TypeScript strict mode is required.
- No `any` in production code.
- No ignored TypeScript or lint errors without a documented, narrow reason.
- Prefer small focused files and pure DTO conversion functions.
- Keep native platform implementations structurally similar when practical, but do not force one
  platform's idioms onto the other.
- Comments explain constraints and reasons, not obvious syntax.
- Public APIs require TSDoc and README examples.
- New dependencies require a clear need, compatible license and maintenance assessment.

## Performance

- Keep large feature datasets native; prefer service layers, local ArcGIS packages or file paths.
- Do not send full layer contents through JS props.
- Reconcile layers and graphics incrementally by stable ID.
- Batch graphics updates.
- Throttle continuous events.
- Measure before adding low-level optimisations.
- Do not add custom JSI solely because ArcGIS rendering is performance sensitive; rendering already
  occurs natively.

## Git and release discipline

- Keep commits focused.
- Use Conventional Commits.
- Do not commit generated example native projects unless repository policy explicitly changes.
- Do not commit build outputs, SDK binaries, credentials or local environment files.
- Update the changelog for user-visible changes.
- Treat all pre-1.0 public API changes as deliberate and documented.
- Publish with npm provenance when the release workflow supports it.

## Definition of done

A feature is complete only when:

1. The TypeScript API is strict, documented and exported intentionally.
2. iOS and Android behaviours match or documented platform differences are approved.
3. Native lifecycle and cancellation are handled.
4. Stable errors are mapped.
5. Unit tests pass.
6. The example app demonstrates success and failure paths.
7. `yarn check` passes.
8. Relevant native Debug builds pass.
9. Release builds are verified when build configuration or native dependencies changed.
10. README and support tables are updated.

## Working method for AI agents

Before editing:

1. Read this file and the relevant README sections.
2. Inspect existing types and both native implementations.
3. Check current Esri/Expo documentation when SDK behaviour or requirements may have changed.
4. State the smallest cross-platform implementation plan.

While editing:

1. Preserve unrelated user changes.
2. Change the TypeScript contract and both platforms together.
3. Keep native resource ownership explicit.
4. Add tests with the implementation.
5. Avoid speculative abstractions for roadmap features.

Before handing off:

1. Run proportional checks.
2. Review the diff for credentials and generated files.
3. Report the outcome first.
4. List checks run and any checks not run.
5. Call out API or platform differences clearly.
