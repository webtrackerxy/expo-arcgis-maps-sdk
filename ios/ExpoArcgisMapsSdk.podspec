Pod::Spec.new do |s|
  s.name           = 'ExpoArcgisMapsSdk'
  s.version        = '0.1.1'
  s.summary        = 'Community-maintained ArcGIS Maps SDK bindings for Expo and React Native.'
  s.description    = 'Native ArcGIS 2D map view for Expo, backed by the ArcGIS Maps SDK for Swift.'
  s.author         = 'webtrackerxy'
  s.homepage       = 'https://github.com/webtrackerxy/expo-arcgis-maps-sdk'
  s.license        = { type: 'MIT' }
  # ArcGIS Maps SDK 300.0 targets iOS 17 (Xcode 26 / iOS 26 SDK).
  s.platforms      = {
    :ios => '17.0'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # NOTE: The ArcGIS Maps SDK for Swift is distributed as a Swift Package /
  # binary xcframework, NOT a CocoaPod, so it cannot be declared here. The config
  # plugin (Phase 3) adds the `arcgis-maps-sdk-swift` Swift Package (pinned to
  # 300.0.0) to the consumer Xcode project and ensures `ArcGIS` is linked and
  # embedded in Debug and Release. Until then, iOS will not compile the ArcGIS
  # imports below.

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    # ArcGIS (binary xcframework) and the ArcGIS Maps SDK for Swift Toolkit
    # (source Swift Package → `ArcGISToolkit.swiftmodule`) build into the shared
    # workspace products dir. Point this pod there so it can resolve both
    # `import ArcGIS` (framework) and `import ArcGISToolkit` (swiftmodule).
    'FRAMEWORK_SEARCH_PATHS' => '$(inherited) "${PODS_CONFIGURATION_BUILD_DIR}"',
    'SWIFT_INCLUDE_PATHS' => '$(inherited) "${PODS_CONFIGURATION_BUILD_DIR}"',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
  # Unit tests import XCTest and must not be compiled into the app target; they
  # run in a dedicated XCTest target (see ios/Tests).
  s.exclude_files = "Tests/**/*"
end
