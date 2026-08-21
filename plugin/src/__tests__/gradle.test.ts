import { ESRI_MAVEN_URL } from '../constants';
import {
  addEsriMavenRepository,
  compareVersionStrings,
  ensureMinimumGradleProperty,
  ensureMinimumVersionProperty,
  forceKotlinGradlePluginVersion,
  type GradlePropertiesItem,
} from '../gradle';

describe('ensureMinimumGradleProperty', () => {
  it('adds the property when absent', () => {
    const props: GradlePropertiesItem[] = [];
    ensureMinimumGradleProperty(props, 'android.minSdkVersion', 28);
    expect(props).toContainEqual({ type: 'property', key: 'android.minSdkVersion', value: '28' });
  });

  it('raises a lower existing value', () => {
    const props: GradlePropertiesItem[] = [
      { type: 'property', key: 'android.minSdkVersion', value: '24' },
    ];
    ensureMinimumGradleProperty(props, 'android.minSdkVersion', 28);
    expect(props[0]).toEqual({ type: 'property', key: 'android.minSdkVersion', value: '28' });
  });

  it('never lowers an equal or higher existing value', () => {
    const props: GradlePropertiesItem[] = [
      { type: 'property', key: 'android.compileSdkVersion', value: '35' },
    ];
    ensureMinimumGradleProperty(props, 'android.compileSdkVersion', 34);
    expect(props[0]).toEqual({ type: 'property', key: 'android.compileSdkVersion', value: '35' });
  });
});

describe('compareVersionStrings', () => {
  it('orders dotted versions component-wise', () => {
    expect(compareVersionStrings('2.2.21', '2.1.0')).toBeGreaterThan(0);
    expect(compareVersionStrings('2.2.0', '2.2.21')).toBeLessThan(0);
    expect(compareVersionStrings('2.2.21', '2.2.21')).toBe(0);
    expect(compareVersionStrings('2.10.0', '2.9.0')).toBeGreaterThan(0);
  });
});

describe('ensureMinimumVersionProperty', () => {
  it('adds android.kotlinVersion when absent', () => {
    const props: GradlePropertiesItem[] = [];
    ensureMinimumVersionProperty(props, 'android.kotlinVersion', '2.2.21');
    expect(props).toContainEqual({
      type: 'property',
      key: 'android.kotlinVersion',
      value: '2.2.21',
    });
  });

  it('raises a lower Kotlin version', () => {
    const props: GradlePropertiesItem[] = [
      { type: 'property', key: 'android.kotlinVersion', value: '2.1.0' },
    ];
    ensureMinimumVersionProperty(props, 'android.kotlinVersion', '2.2.21');
    expect(props[0]).toEqual({ type: 'property', key: 'android.kotlinVersion', value: '2.2.21' });
  });

  it('never lowers an equal or higher Kotlin version', () => {
    const props: GradlePropertiesItem[] = [
      { type: 'property', key: 'android.kotlinVersion', value: '2.2.21' },
    ];
    ensureMinimumVersionProperty(props, 'android.kotlinVersion', '2.2.20');
    expect(props[0].type === 'property' && props[0].value).toBe('2.2.21');
  });
});

describe('addEsriMavenRepository', () => {
  // Mirrors the Expo Android template's root build.gradle.
  const buildGradleWithBlock = `
buildscript {
  repositories { google(); mavenCentral() }
}
allprojects {
  repositories {
    google()
    mavenCentral()
    maven { url 'https://www.jitpack.io' }
  }
}
`;

  it('inserts the Esri repo into the allprojects repositories block', () => {
    const out = addEsriMavenRepository(buildGradleWithBlock);
    expect(out).toContain(`maven { url '${ESRI_MAVEN_URL}' }`);
    expect(out.indexOf(ESRI_MAVEN_URL)).toBeGreaterThan(out.indexOf('allprojects'));
    expect(out.indexOf(ESRI_MAVEN_URL)).toBeLessThan(out.lastIndexOf('mavenCentral()'));
  });

  it('is idempotent', () => {
    const once = addEsriMavenRepository(buildGradleWithBlock);
    const twice = addEsriMavenRepository(once);
    expect(once).toBe(twice);
    expect(twice.match(new RegExp(ESRI_MAVEN_URL.replace(/\//g, '\\/'), 'g'))).toHaveLength(1);
  });

  it('emits Kotlin DSL syntax when requested', () => {
    const out = addEsriMavenRepository(buildGradleWithBlock, 'kt');
    expect(out).toContain(`maven { url = uri("${ESRI_MAVEN_URL}") }`);
  });

  it('throws an actionable error when the block is missing', () => {
    expect(() => addEsriMavenRepository('rootProject.name = "x"')).toThrow(/allprojects/);
  });
});

describe('forceKotlinGradlePluginVersion', () => {
  const rootBuildGradle = `
buildscript {
  repositories { google(); mavenCentral() }
  dependencies {
    classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')
  }
}
`;

  it('injects a resolutionStrategy force into the buildscript block', () => {
    const out = forceKotlinGradlePluginVersion(rootBuildGradle, '2.2.21');
    expect(out).toContain(`force 'org.jetbrains.kotlin:kotlin-gradle-plugin:2.2.21'`);
    expect(out).toContain('configurations.classpath');
    expect(out.indexOf('resolutionStrategy')).toBeGreaterThan(out.indexOf('buildscript'));
  });

  it('is idempotent', () => {
    const once = forceKotlinGradlePluginVersion(rootBuildGradle, '2.2.21');
    const twice = forceKotlinGradlePluginVersion(once, '2.2.21');
    expect(once).toBe(twice);
  });

  it('emits Kotlin DSL syntax when requested', () => {
    const out = forceKotlinGradlePluginVersion(rootBuildGradle, '2.2.21', 'kt');
    expect(out).toContain(`force("org.jetbrains.kotlin:kotlin-gradle-plugin:2.2.21")`);
  });

  it('throws when no buildscript block exists', () => {
    expect(() => forceKotlinGradlePluginVersion('rootProject.name = "x"', '2.2.21')).toThrow(
      /buildscript/
    );
  });
});
