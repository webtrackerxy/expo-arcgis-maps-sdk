# Augmented Reality

`ArcgisArView` renders an ArcGIS scene in augmented reality. It is a **rendering mode of the scene
view**, not a new transport: it reuses the same declarative scene props (`scene`, `layers`,
`graphics`, `onSingleTap`) and the same native scene-reconciliation code as `ArcgisSceneView`, and
stays fully within the non-negotiable architecture (Expo Modules API views, Swift + Kotlin, no
C++/JNI/ObjC++/JSI, no native objects across the bridge).

The AR integration ships in the **ArcGIS Maps SDK toolkits**, which provide ready-made AR scene
views; our existing scene-view architecture is the correct host for them. No AR-specific host-app
integration is required.

## Three AR modes

| Mode         | What it does                                      | Reuses                                                            |
| ------------ | ------------------------------------------------- | ----------------------------------------------------------------- |
| `worldScale` | Anchors the scene to the real world at 1:1 scale  | scene layers, elevation/subsurface, `onSingleTap`, route graphics |
| `tabletop`   | Pins the scene to a real-world surface as a model | scene, layers, graphics                                           |
| `flyover`    | Frees the camera to fly over the scene            | scene, layers                                                     |

## Public TypeScript contract

A **dedicated `ArcgisArView` component**, not an `arMode` prop on `ArcgisSceneView`: AR carries its
own lifecycle (camera/AR session, tracking state, calibration, runtime capability + permission
gating), so a separate view keeps the "survive mount/unmount/remount without duplicate observers"
rule clean while still reusing the declarative scene props.

```ts
/** World-scale positioning strategy. `'geo'` uses VPS/geospatial anchoring where available. */
export type ArTrackingMode = 'world' | 'geo';

/** AR tracking lifecycle state, emitted (throttled) via onTrackingStateChange. */
export type ArTrackingState = 'initializing' | 'tracking' | 'paused' | 'unavailable';

export type ArcgisArViewProps = SceneContentProps & {
  /** Which AR experience to render. */
  mode: 'worldScale' | 'tabletop' | 'flyover';

  /** worldScale only. Defaults to 'world'. */
  trackingMode?: ArTrackingMode;
  /** tabletop only — real-world anchor the scene is pinned to (required for tabletop). */
  anchor?: GeographicPoint;
  /** tabletop/flyover — scene metres per real-world metre of device travel. */
  translationFactor?: number;
  /** flyover only — starting camera position. */
  initialCamera?: GeographicPoint;
  /** Clip the scene to N metres around the camera (perf / occlusion). */
  clippingDistanceMeters?: number;
  /** worldScale only — show the toolkit calibration control. Defaults true. */
  calibrationVisible?: boolean;

  onTrackingStateChange?: (event: { state: ArTrackingState }) => void;
  onArError?: (event: ArcgisError) => void;
};
```

Imperative actions via `ArcgisArViewRef`: `resetTracking()`, `setClippingDistance(m)`,
`getCurrentCamera(): Promise<GeographicPoint>`, and world-scale calibration nudges
`setHeadingOffset(deg)` / `setElevationOffset(m)`.

Capability probe as a module function:

```ts
export function isArSupported(): Promise<{ supported: boolean; reason?: string }>;
```

On a device without ARKit/ARCore this resolves `{ supported: false }`, and constructing an
`ArcgisArView` there emits `onArError` with `E_UNSUPPORTED` rather than crashing.

**Serializability.** Every prop/return value is a string, number, boolean, or an existing
serializable DTO (`GeographicPoint`, `ArcgisError`). No `Point`, `Camera`, `ARSession`, or other
native type crosses the bridge. **Events are throttled** — tracking-state and camera changes are
high-frequency, so only meaningful state transitions are emitted.

## Documented platform differences

The AR toolkit surfaces differ between platforms; the common API resolves them as follows:

| Concern                   | iOS                                                       | Android                                             | Common API resolution                                                                      |
| ------------------------- | --------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Scene wiring              | AR view wraps our built `SceneView` via a builder closure | AR composable takes `ArcGISScene` + params directly | Same DTO-level scene/layer/graphics reconciliation; native wiring differs internally only. |
| Geo-tracking name         | `TrackingMode.geoTracking`                                | `WorldScaleTrackingMode.Geospatial`                 | TS `trackingMode: 'world' \| 'geo'` maps to each.                                          |
| `preferGeo` auto-fallback | `.preferGeoTracking` exists                               | no equivalent                                       | **Not exposed** in the common API — `'geo'` only, to stay symmetric.                       |
| Calibration UI            | built-in `CalibrationView` overlay                        | opt-in `scope.CalibrationView()` in content         | `calibrationVisible` prop toggles it on both.                                              |

`ArTrackingReason` (the AR tracking-failure reason on `onTrackingStateChange`) is granular on iOS
(ARKit exposes `insufficientFeatures`, `excessiveMotion`, `relocalizing`, `initializing`) and coarse
on Android (finer ARCore reasons are not exposed by the toolkit). See `src/types/arView.ts`.

## Native implementation

- **iOS** (`ios/ExpoArcgisArView.swift`) — an `ExpoView` hosting one of the toolkit AR views
  (`WorldScaleSceneView` / `TableTopSceneView` / `FlyoverSceneView`) in a `UIHostingController`,
  exactly like the non-AR scene view. Its `sceneViewBuilder` closure returns the same `SceneView` the
  existing scene view model builds, so all scene/layer/graphics reconciliation is reused unchanged.
  All AR types are `#if os(iOS)` and macCatalyst-unavailable, guarded accordingly.
- **Android** (`android/.../ExpoArcgisArView.kt`) — an `ExpoView` hosting the AR composable via a
  `ComposeView`, reusing the scene reconciliation already present in `ExpoArcgisSceneView`. ARCore
  arrives transitively through `arcgis-maps-kotlin-toolkit-ar`; the capability probe wraps
  `ArCoreApk.checkAvailability`.

Both platforms keep DTO conversion local (no shared core) and release the AR session, camera, and
scene references on disposal.

## Config plugin additions

| Platform | Addition                                                                                                                                                                                    | Reason                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| iOS      | `NSCameraUsageDescription`, `NSLocationWhenInUseUsageDescription`                                                                                                                           | Camera passthrough; world-scale geo-tracking needs location.                      |
| Android  | `CAMERA` permission; ARCore `<meta-data android:name="com.google.ar.core" android:value="optional"/>`; `<uses-feature android:name="android.hardware.camera.ar" android:required="false"/>` | Camera; ARCore declared **optional** so the app still installs on non-AR devices. |

**ARCore is `optional`, not `required`** — an SDK others consume must not silently filter its
consumers' Play Store audience; the runtime `isArSupported()` gate (→ `E_UNSUPPORTED`) is the
capability boundary instead. All additions are idempotent across repeated `expo prebuild` runs and
covered by Gradle / Xcode fixture tests.

## Platform verification note

AR is the one area where on-device verification differs by platform:

- **Android** — ARCore runs in the emulator's virtual AR scene (Google Play system image), so Android
  AR is end-to-end verifiable on an emulator.
- **iOS** — **ARKit does not run in the iOS Simulator.** The iOS AR screens are compile-verified;
  on-device confirmation requires a physical iPhone.

The support tables mark iOS AR accordingly — it is not claimed as fully device-verified on both
platforms.
