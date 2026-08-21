import { ESRI_MAVEN_URL } from './constants';

/**
 * Pure Gradle-file transforms used by the Android config-plugin mods. Kept
 * side-effect free and string-in/string-out so they can be unit-tested against
 * representative fixtures without running a prebuild.
 */

/** A `gradle.properties` item as modelled by `withGradleProperties`. */
export type GradlePropertiesItem =
  | { type: 'property'; key: string; value: string }
  | { type: 'comment'; value: string }
  | { type: 'empty' };

/**
 * Ensures `key` in `gradle.properties` is at least `minimum`.
 *
 * - Raises a lower existing value up to `minimum`.
 * - Leaves an equal/higher value untouched (never lowers a consumer setting).
 * - Adds the property when absent.
 *
 * Mutates and returns the same array (matching the `withGradleProperties`
 * contract).
 */
export function ensureMinimumGradleProperty(
  properties: GradlePropertiesItem[],
  key: string,
  minimum: number
): GradlePropertiesItem[] {
  const existing = properties.find(
    (item): item is Extract<GradlePropertiesItem, { type: 'property' }> =>
      item.type === 'property' && item.key === key
  );

  if (existing) {
    const current = Number.parseInt(existing.value, 10);
    // Only raise; never lower a value the consumer set intentionally.
    if (!Number.isNaN(current) && current >= minimum) {
      return properties;
    }
    existing.value = String(minimum);
    return properties;
  }

  properties.push({ type: 'property', key, value: String(minimum) });
  return properties;
}

/** Compares dotted version strings (e.g. `2.2.21`) numerically, component-wise. */
export function compareVersionStrings(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
}

/**
 * Ensures a version-valued `gradle.properties` entry (e.g.
 * `android.kotlinVersion`) is at least `minVersion`. Raises a lower value,
 * leaves an equal/higher one untouched, and adds it when absent. Mutates and
 * returns the same array.
 */
export function ensureMinimumVersionProperty(
  properties: GradlePropertiesItem[],
  key: string,
  minVersion: string
): GradlePropertiesItem[] {
  const existing = properties.find(
    (item): item is Extract<GradlePropertiesItem, { type: 'property' }> =>
      item.type === 'property' && item.key === key
  );

  if (existing) {
    if (compareVersionStrings(existing.value, minVersion) >= 0) {
      return properties;
    }
    existing.value = minVersion;
    return properties;
  }

  properties.push({ type: 'property', key, value: minVersion });
  return properties;
}

/**
 * Adds Esri's Maven repository to the `allprojects { repositories { … } }`
 * block of the root `build.gradle` (where the Expo Android template declares
 * project repositories).
 *
 * - Idempotent: a no-op when the repo URL is already present.
 * - Throws an actionable error when the expected block is absent, rather than
 *   guessing (per CLAUDE.md the plugin must fail with a clear message instead of
 *   corrupting an unexpected project shape).
 *
 * @param contents root build.gradle contents.
 * @param language `'groovy'` (default) or `'kt'` for the Kotlin DSL.
 */
export function addEsriMavenRepository(
  contents: string,
  language: 'groovy' | 'kt' = 'groovy'
): string {
  if (contents.includes(ESRI_MAVEN_URL)) {
    return contents;
  }

  const snippet =
    language === 'kt'
      ? `maven { url = uri("${ESRI_MAVEN_URL}") }`
      : `maven { url '${ESRI_MAVEN_URL}' }`;

  const anchor = /allprojects\s*\{[\s\S]*?repositories\s*\{/;
  const match = contents.match(anchor);
  if (!match || match.index === undefined) {
    throw new Error(
      `[expo-arcgis-maps-sdk] Could not find an "allprojects { repositories { … } }" ` +
        `block in the root build.gradle to add Esri's Maven repository (${ESRI_MAVEN_URL}). ` +
        `Add it manually inside that block: ${snippet}`
    );
  }

  const insertAt = match.index + match[0].length;
  const indented = `\n    ${snippet}`;
  return contents.slice(0, insertAt) + indented + contents.slice(insertAt);
}

const KOTLIN_PIN_MARKER = 'expo-arcgis-maps-sdk: pin Kotlin';

/**
 * Forces the Kotlin Gradle plugin version on the root `buildscript` classpath.
 *
 * `android.kotlinVersion` only changes stdlib/KSP dependency versions, not the
 * compiler that Expo's module plugin actually applies (pinned by React Native's
 * version catalog). ArcGIS 300.0 ships Kotlin metadata 2.3.0, which the default
 * 2.1.x compiler cannot read, so the plugin version must be forced here.
 *
 * - Idempotent (no-op if already pinned).
 * - Throws an actionable error if no `buildscript { }` block is found.
 */
export function forceKotlinGradlePluginVersion(
  contents: string,
  version: string,
  language: 'groovy' | 'kt' = 'groovy'
): string {
  if (contents.includes(KOTLIN_PIN_MARKER)) {
    return contents;
  }

  const coordinate = `org.jetbrains.kotlin:kotlin-gradle-plugin:${version}`;
  const force = language === 'kt' ? `force("${coordinate}")` : `force '${coordinate}'`;

  const anchor = /buildscript\s*\{/;
  const match = contents.match(anchor);
  if (!match || match.index === undefined) {
    throw new Error(
      `[expo-arcgis-maps-sdk] Could not find a "buildscript { }" block in the root build.gradle ` +
        `to pin the Kotlin Gradle plugin to ${version} (required to read ArcGIS 300.0 metadata).`
    );
  }

  const insertAt = match.index + match[0].length;
  const block =
    `\n  // ${KOTLIN_PIN_MARKER} to read ArcGIS Maps SDK 300.0 metadata (2.3.0).` +
    `\n  configurations.classpath {` +
    `\n    resolutionStrategy {` +
    `\n      ${force}` +
    `\n    }` +
    `\n  }`;
  return contents.slice(0, insertAt) + block + contents.slice(insertAt);
}
