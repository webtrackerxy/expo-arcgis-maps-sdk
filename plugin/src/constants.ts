/**
 * Single source of truth for the versions/requirements the config plugin
 * enforces. These must match the native dependency pins in `android/build.gradle`
 * and `ios/ExpoArcgisMapsSdk.podspec` (see CLAUDE.md "Native dependency policy").
 */

/** Pinned ArcGIS Maps SDK release, identical on both platforms. */
export const ARCGIS_MAPS_VERSION = '300.0.0';

/** Esri's Maven repository that hosts the ArcGIS Maps SDK for Kotlin. */
export const ESRI_MAVEN_URL = 'https://esri.jfrog.io/artifactory/arcgis';

/** Minimum Android API level required by ArcGIS Maps SDK 300.0. */
export const ANDROID_MIN_SDK_VERSION = 28;

/** Android compile SDK for the initial ArcGIS 300.0 integration. */
export const ANDROID_COMPILE_SDK_VERSION = 36;

/**
 * Minimum Kotlin version for ArcGIS Maps SDK for Kotlin 300.0.
 *
 * The ArcGIS artifacts are compiled with Kotlin metadata version 2.3.0, so the
 * project's Kotlin compiler must be able to read it. A 2.2.x compiler reads up
 * to 2.3.0 metadata, and — crucially — Expo's Gradle plugin rejects Kotlin
 * >= 2.3.0 ("not supported by Expo modules"). 2.2.21 satisfies both (and has a
 * matching KSP in Expo's lookup). Expo SDK 57 / RN 0.86 otherwise defaults to
 * Kotlin 2.1.0, which is too old.
 */
export const ANDROID_KOTLIN_VERSION = '2.2.21';

/** Minimum iOS deployment target for ArcGIS Maps SDK 300.0. */
export const IOS_DEPLOYMENT_TARGET = '17.0';

/** The ArcGIS Maps SDK for Swift package (added manually — see README). */
export const ARCGIS_SWIFT_PACKAGE_URL = 'https://github.com/Esri/arcgis-maps-sdk-swift';

/**
 * The ArcGIS Maps SDK for Swift Toolkit package. Unlike the binary ArcGIS
 * framework, the toolkit is a *source* Swift Package, so the config plugin wires
 * it as a build-order dependency of this module's pod (see `withArcgisPodfile`).
 */
export const ARCGIS_TOOLKIT_SWIFT_PACKAGE_URL =
  'https://github.com/Esri/arcgis-maps-sdk-swift-toolkit';
