import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  withGradleProperties,
  withProjectBuildGradle,
} from 'expo/config-plugins';

import {
  ANDROID_COMPILE_SDK_VERSION,
  ANDROID_KOTLIN_VERSION,
  ANDROID_MIN_SDK_VERSION,
} from './constants';
import {
  addEsriMavenRepository,
  ensureMinimumGradleProperty,
  ensureMinimumVersionProperty,
  forceKotlinGradlePluginVersion,
} from './gradle';

type AndroidManifest = AndroidConfig.Manifest.AndroidManifest;

/**
 * Add the camera permission, an `optional` ARCore declaration, and the AR
 * camera feature (not required) to the Android manifest for the augmented-
 * reality view. ARCore is declared **optional** so the app still installs on
 * devices without it — the runtime `isArSupported` probe gates AR instead.
 *
 * Pure and idempotent: re-running never duplicates an entry.
 */
export function addArCoreToAndroidManifest(androidManifest: AndroidManifest): AndroidManifest {
  const manifest = androidManifest.manifest;

  manifest['uses-permission'] = manifest['uses-permission'] ?? [];
  if (
    !manifest['uses-permission'].some((p) => p.$?.['android:name'] === 'android.permission.CAMERA')
  ) {
    manifest['uses-permission'].push({ $: { 'android:name': 'android.permission.CAMERA' } });
  }

  manifest['uses-feature'] = manifest['uses-feature'] ?? [];
  if (
    !manifest['uses-feature'].some((f) => f.$?.['android:name'] === 'android.hardware.camera.ar')
  ) {
    manifest['uses-feature'].push({
      $: { 'android:name': 'android.hardware.camera.ar', 'android:required': 'false' },
    });
  }

  const application = manifest.application?.[0];
  if (application) {
    application['meta-data'] = application['meta-data'] ?? [];
    if (!application['meta-data'].some((m) => m.$?.['android:name'] === 'com.google.ar.core')) {
      application['meta-data'].push({
        $: { 'android:name': 'com.google.ar.core', 'android:value': 'optional' },
      });
    }
  }

  return androidManifest;
}

/**
 * Android configuration for ArcGIS Maps SDK 300.0:
 * - Ensure `android.minSdkVersion` >= 28 and `android.compileSdkVersion` >= 36,
 *   raising only when the consumer's value is lower.
 * - Add Esri's Maven repository to the root `build.gradle` (`allprojects`).
 *
 * All steps are idempotent across repeated `expo prebuild`.
 */
export const withArcgisAndroid: ConfigPlugin = (config) => {
  config = withGradleProperties(config, (cfg) => {
    ensureMinimumGradleProperty(cfg.modResults, 'android.minSdkVersion', ANDROID_MIN_SDK_VERSION);
    ensureMinimumGradleProperty(
      cfg.modResults,
      'android.compileSdkVersion',
      ANDROID_COMPILE_SDK_VERSION
    );
    // ArcGIS Maps SDK for Kotlin 300.0 is built with Kotlin metadata 2.3.0;
    // the default Expo/RN Kotlin (2.1.0) cannot read it. 2.2.x can, and stays
    // under Expo's <2.3.0 ceiling.
    ensureMinimumVersionProperty(cfg.modResults, 'android.kotlinVersion', ANDROID_KOTLIN_VERSION);
    return cfg;
  });

  config = withProjectBuildGradle(config, (cfg) => {
    const language = cfg.modResults.language === 'kt' ? 'kt' : 'groovy';
    let contents = addEsriMavenRepository(cfg.modResults.contents, language);
    contents = forceKotlinGradlePluginVersion(contents, ANDROID_KOTLIN_VERSION, language);
    cfg.modResults.contents = contents;
    return cfg;
  });

  // Camera permission + optional ARCore declaration for the AR view.
  config = withAndroidManifest(config, (cfg) => {
    cfg.modResults = addArCoreToAndroidManifest(cfg.modResults);
    return cfg;
  });

  return config;
};
