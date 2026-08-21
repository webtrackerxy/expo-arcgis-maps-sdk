import {
  ConfigPlugin,
  withInfoPlist,
  withPodfileProperties,
  withXcodeProject,
} from 'expo/config-plugins';

import { IOS_DEPLOYMENT_TARGET } from './constants';
import { ensureMinimumDeploymentTarget } from './ios';

/** Default iOS usage descriptions required by the augmented-reality view. */
export const IOS_AR_USAGE_DESCRIPTIONS: Record<string, string> = {
  NSCameraUsageDescription: 'This app uses the camera to display an augmented-reality map view.',
  NSLocationWhenInUseUsageDescription:
    'This app uses your location to align augmented reality with the real world.',
};

/**
 * Add the augmented-reality usage descriptions to an Info.plist object without
 * overwriting any a consumer has already set. Pure and idempotent so it can be
 * unit-tested against a fixture.
 */
export function ensureIosUsageDescriptions(
  infoPlist: Record<string, unknown>,
  descriptions: Record<string, string> = IOS_AR_USAGE_DESCRIPTIONS
): Record<string, unknown> {
  for (const [key, value] of Object.entries(descriptions)) {
    if (typeof infoPlist[key] !== 'string' || (infoPlist[key] as string).length === 0) {
      infoPlist[key] = value;
    }
  }
  return infoPlist;
}

/**
 * iOS configuration for ArcGIS Maps SDK 300.0:
 * - Ensure the iOS deployment target is at least 17.0 (never lowered).
 *
 * The ArcGIS Maps SDK for Swift ships as a Swift Package / binary xcframework,
 * not a CocoaPod. It (and the toolkit) are wired into the Xcode project
 * automatically by {@link withArcgisPodfile} during `pod install` — no manual
 * Xcode step is required. This module only enforces the deployment target and
 * the augmented-reality usage descriptions. Runs during `expo prebuild` for iOS.
 */
export const withArcgisIos: ConfigPlugin = (config) => {
  // Augmented-reality camera + location usage descriptions (never overwritten).
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults = ensureIosUsageDescriptions(cfg.modResults) as typeof cfg.modResults;
    return cfg;
  });

  config = withPodfileProperties(config, (cfg) => {
    const current = cfg.modResults['ios.deploymentTarget'];
    cfg.modResults['ios.deploymentTarget'] = ensureMinimumDeploymentTarget(
      current,
      IOS_DEPLOYMENT_TARGET
    );
    return cfg;
  });

  // The Podfile platform only governs pod targets; the app target (and, through
  // it, the CocoaPods aggregate target) has its own IPHONEOS_DEPLOYMENT_TARGET.
  // Raise every build configuration that declares one so it is at least 17.0,
  // matching the module's podspec. Only raises — never lowers.
  config = withXcodeProject(config, (cfg) => {
    const section = cfg.modResults.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(section)) {
      const buildSettings = section[key]?.buildSettings;
      const current = buildSettings?.IPHONEOS_DEPLOYMENT_TARGET;
      if (typeof current === 'string') {
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET = ensureMinimumDeploymentTarget(
          current.replace(/"/g, ''),
          IOS_DEPLOYMENT_TARGET
        );
      }
    }
    return cfg;
  });

  return config;
};
