import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

import {
  ARCGIS_MAPS_VERSION,
  ARCGIS_SWIFT_PACKAGE_URL,
  ARCGIS_TOOLKIT_SWIFT_PACKAGE_URL,
} from './constants';

/** Idempotency marker written into the consumer Podfile. */
const MARKER = '# expo-arcgis-maps-sdk: ArcGIS Swift Package wiring';

/** Native module (pod) name that imports the ArcGIS Swift packages. */
const POD_TARGET = 'ExpoArcgisMapsSdk';

/**
 * Ruby injected into the Podfile's `post_install` block. It wires up the two
 * ArcGIS Swift Packages the way the example project has them, but through the
 * reliable `Xcodeproj` Ruby API rather than the fragile JS `xcode` library:
 *
 * - **ArcGIS Toolkit** (`arcgis-maps-sdk-swift-toolkit`) is a *source* Swift
 *   Package. Our pod imports `ArcGISToolkit`, so it is added to the Pods project
 *   and linked to the `ExpoArcgisMapsSdk` pod target — this forces Xcode to build
 *   the toolkit before the pod compiles.
 * - **Core ArcGIS** (`arcgis-maps-sdk-swift`, the binary xcframework) is added to
 *   the consumer's *app* Xcode project **and linked** to the app target — exactly
 *   where the example has it. The pod picks up `ArcGIS` transitively through the
 *   toolkit it depends on.
 * - The **toolkit** is *also* referenced from the app project, but as a
 *   **package reference only — no product link on the app target**. This is what
 *   makes a headless `xcodebuild` work: `xcodebuild` only resolves
 *   `XCRemoteSwiftPackageReference`s reachable from the *app* project and ignores
 *   references that live in `Pods.xcodeproj`, so the Pods-project toolkit
 *   reference never resolves on its own and the build fails with
 *   `Missing package product 'ArcGISToolkit'`. A bare reference on the app project
 *   is enough to pull the toolkit (and its transitive `swift-markdown`/
 *   `swift-cmark`) into the workspace `Package.resolved`; the pod target's product
 *   dependency then finds the resolved product (SPM unifies by URL). Linking the
 *   toolkit *product* to the app target as well would statically link it twice
 *   (once via the pod) and fail with thousands of duplicate symbols — hence
 *   reference-only here.
 *
 * `installer.aggregate_targets` exposes each app's `user_project`/`user_targets`,
 * so we touch the app pbxproj safely from CocoaPods rather than via the fragile
 * JS `xcode` library.
 *
 * A helper lambda matches an existing `XCRemoteSwiftPackageReference` by exact
 * repository slug (so `arcgis-maps-sdk-swift` does not also match the toolkit),
 * creating the reference and the `XCSwiftPackageProductDependency` only when
 * absent. Everything is idempotent and guarded by {@link MARKER}. Uses `<<~`
 * (squiggly heredoc) so the leading indentation is stripped.
 */
function postInstallSnippet(): string {
  return `
    ${MARKER}
    # Adds an XCRemoteSwiftPackageReference to +project+ (once, matched by repo
    # slug). When +product_name+ is non-nil it also links that product to +target+;
    # pass nil to add a bare reference (used to make xcodebuild resolve a package
    # without linking it — see the toolkit-on-app-project case below).
    __arcgis_add_package = lambda do |project, target, repo_url, slug, product_name|
      __pkg = project.root_object.package_references.find do |ref|
        ref.respond_to?(:repositoryURL) &&
          ref.repositoryURL.to_s.sub(/\\.git$/, '').split('/').last == slug
      end
      unless __pkg
        __pkg = project.new(Xcodeproj::Project::Object::XCRemoteSwiftPackageReference)
        __pkg.repositoryURL = repo_url
        __pkg.requirement = { 'kind' => 'exactVersion', 'version' => '${ARCGIS_MAPS_VERSION}' }
        project.root_object.package_references << __pkg
      end
      if product_name && target &&
          target.package_product_dependencies.none? { |d| d.product_name == product_name }
        __dep = project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
        __dep.package = __pkg
        __dep.product_name = product_name
        target.package_product_dependencies << __dep
      end
    end

    # Toolkit -> Pods project + this module's pod target (build-order dependency).
    __arcgis_pods_project = installer.pods_project
    __arcgis_pod_target = __arcgis_pods_project.targets.find { |t| t.name == '${POD_TARGET}' }
    __arcgis_add_package.call(
      __arcgis_pods_project, __arcgis_pod_target,
      '${ARCGIS_TOOLKIT_SWIFT_PACKAGE_URL}', 'arcgis-maps-sdk-swift-toolkit', 'ArcGISToolkit'
    )
    __arcgis_pods_project.save

    # The consumer app project. xcodebuild only resolves Swift packages referenced
    # by the app project (never ones in Pods.xcodeproj), so both packages must be
    # referenced here for a headless build to find 'ArcGISToolkit'.
    #   - Core ArcGIS: reference + linked as a product on the app target.
    #   - Toolkit: reference ONLY (product_name nil) — linking it here too would
    #     duplicate every toolkit symbol against the pod's copy. The pod links it.
    installer.aggregate_targets.each do |__arcgis_aggregate|
      __arcgis_user_project = __arcgis_aggregate.user_project
      next unless __arcgis_user_project
      __arcgis_aggregate.user_targets.each do |__arcgis_user_target|
        next unless __arcgis_user_target.respond_to?(:product_type) &&
          __arcgis_user_target.product_type == 'com.apple.product-type.application'
        __arcgis_add_package.call(
          __arcgis_user_project, __arcgis_user_target,
          '${ARCGIS_SWIFT_PACKAGE_URL}', 'arcgis-maps-sdk-swift', 'ArcGIS'
        )
        __arcgis_add_package.call(
          __arcgis_user_project, __arcgis_user_target,
          '${ARCGIS_TOOLKIT_SWIFT_PACKAGE_URL}', 'arcgis-maps-sdk-swift-toolkit', nil
        )
      end
      __arcgis_user_project.save
    end
`;
}

/**
 * Splices the ArcGIS Swift Package wiring into a Podfile's existing
 * `post_install do |installer|` block and returns the new contents. A Podfile
 * supports only one `post_install` hook, so we inject into the block Expo
 * already generates rather than adding a second (which would silently overwrite
 * it). Idempotent: returns the input unchanged once the {@link MARKER} is
 * present. Throws if no `post_install` block exists to attach to. Pure — the
 * plugin below handles file IO.
 */
export function injectToolkitPostInstall(contents: string): string {
  if (contents.includes(MARKER)) {
    return contents;
  }
  const anchor = /post_install do \|installer\|\n/;
  if (!anchor.test(contents)) {
    throw new Error(
      '[expo-arcgis-maps-sdk] Could not find a `post_install do |installer|` block in the ' +
        'Podfile to attach the ArcGIS Swift Package wiring.'
    );
  }
  return contents.replace(anchor, (match) => match + postInstallSnippet());
}

/**
 * Injects the ArcGIS Swift Package wiring into the consumer Podfile. See
 * {@link injectToolkitPostInstall}. Runs during `expo prebuild` for iOS.
 */
export const withArcgisPodfile: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      const contents = fs.readFileSync(podfile, 'utf8');
      const next = injectToolkitPostInstall(contents);
      if (next !== contents) {
        fs.writeFileSync(podfile, next);
      }
      return cfg;
    },
  ]);
