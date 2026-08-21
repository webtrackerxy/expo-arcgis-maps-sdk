import { AndroidConfig } from 'expo/config-plugins';

import { addArCoreToAndroidManifest } from '../withArcgisAndroid';
import { ensureIosUsageDescriptions, IOS_AR_USAGE_DESCRIPTIONS } from '../withArcgisIos';

type AndroidManifest = AndroidConfig.Manifest.AndroidManifest;

function emptyManifest(): AndroidManifest {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      application: [{ $: { 'android:name': '.MainApplication' } }],
    },
  } as AndroidManifest;
}

describe('ensureIosUsageDescriptions', () => {
  it('adds the camera and location usage strings when absent', () => {
    const plist = ensureIosUsageDescriptions({});
    expect(plist.NSCameraUsageDescription).toBe(IOS_AR_USAGE_DESCRIPTIONS.NSCameraUsageDescription);
    expect(plist.NSLocationWhenInUseUsageDescription).toBe(
      IOS_AR_USAGE_DESCRIPTIONS.NSLocationWhenInUseUsageDescription
    );
  });

  it("never overwrites a consumer's own usage string", () => {
    const plist = ensureIosUsageDescriptions({ NSCameraUsageDescription: 'Custom reason' });
    expect(plist.NSCameraUsageDescription).toBe('Custom reason');
    // The one it does not set is still added.
    expect(plist.NSLocationWhenInUseUsageDescription).toBe(
      IOS_AR_USAGE_DESCRIPTIONS.NSLocationWhenInUseUsageDescription
    );
  });
});

describe('addArCoreToAndroidManifest', () => {
  it('adds the camera permission, optional ARCore meta-data, and AR feature', () => {
    const manifest = addArCoreToAndroidManifest(emptyManifest()).manifest;
    expect(manifest['uses-permission']).toContainEqual({
      $: { 'android:name': 'android.permission.CAMERA' },
    });
    expect(manifest['uses-feature']).toContainEqual({
      $: { 'android:name': 'android.hardware.camera.ar', 'android:required': 'false' },
    });
    expect(manifest.application?.[0]['meta-data']).toContainEqual({
      $: { 'android:name': 'com.google.ar.core', 'android:value': 'optional' },
    });
  });

  it('is idempotent — a second run does not duplicate entries', () => {
    let manifest = addArCoreToAndroidManifest(emptyManifest());
    manifest = addArCoreToAndroidManifest(manifest);
    const m = manifest.manifest;
    expect(m['uses-permission']).toHaveLength(1);
    expect(m['uses-feature']).toHaveLength(1);
    expect(m.application?.[0]['meta-data']).toHaveLength(1);
  });

  it('declares ARCore optional, not required, so the app still installs everywhere', () => {
    const manifest = addArCoreToAndroidManifest(emptyManifest()).manifest;
    const metaData = manifest.application?.[0]['meta-data']?.find(
      (m) => m.$['android:name'] === 'com.google.ar.core'
    );
    expect(metaData?.$['android:value']).toBe('optional');
  });
});
