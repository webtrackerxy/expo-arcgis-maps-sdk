import { injectToolkitPostInstall } from '../withArcgisPodfile';

/** A minimal Podfile with the `post_install` block Expo generates. */
const PODFILE = `platform :ios, '17.0'

target 'consumerapp' do
  use_expo_modules!

  post_install do |installer|
    react_native_post_install(installer, config[:reactNativePath])
  end
end
`;

const MARKER = '# expo-arcgis-maps-sdk: ArcGIS Swift Package wiring';

describe('injectToolkitPostInstall', () => {
  it('splices the ArcGIS Swift Package wiring into the post_install block', () => {
    const out = injectToolkitPostInstall(PODFILE);
    expect(out).toContain(MARKER);
    // Injected right after the post_install opener, before the RN post-install call.
    const marker = out.indexOf(MARKER);
    const rnCall = out.indexOf('react_native_post_install');
    expect(marker).toBeLessThan(rnCall);
  });

  it('wires the toolkit into the Pods project and this module pod target', () => {
    const out = injectToolkitPostInstall(PODFILE);
    expect(out).toContain("t.name == 'ExpoArcgisMapsSdk'");
    expect(out).toContain('arcgis-maps-sdk-swift-toolkit');
    expect(out).toContain("'ArcGISToolkit'");
    expect(out).toContain('installer.pods_project');
  });

  it('wires core ArcGIS into the app project via aggregate targets', () => {
    const out = injectToolkitPostInstall(PODFILE);
    // Core is added to the consumer app project + app target, not the Pods project.
    expect(out).toContain('installer.aggregate_targets');
    expect(out).toContain('user_project');
    expect(out).toContain('user_targets');
    expect(out).toContain('com.apple.product-type.application');
    // Core is linked as a product on the app target (must not collide with the
    // toolkit slug — the core slug is a prefix of the toolkit slug).
    expect(out).toContain("'arcgis-maps-sdk-swift', 'ArcGIS'");
    // The toolkit is referenced on the app project so a headless xcodebuild
    // resolves it (it ignores package refs in Pods.xcodeproj), but with a nil
    // product so it is NOT linked to the app target (that would duplicate the
    // pod's copy of every toolkit symbol).
    expect(out).toContain("'arcgis-maps-sdk-swift-toolkit', nil");
  });

  it('is idempotent — re-running does not duplicate the snippet', () => {
    const once = injectToolkitPostInstall(PODFILE);
    const twice = injectToolkitPostInstall(once);
    expect(twice).toBe(once);
    const occurrences = twice.split(MARKER).length - 1;
    expect(occurrences).toBe(1);
  });

  it('throws when there is no post_install block to attach to', () => {
    const noHook = "target 'consumerapp' do\n  use_expo_modules!\nend\n";
    expect(() => injectToolkitPostInstall(noHook)).toThrow(/post_install/);
  });
});
