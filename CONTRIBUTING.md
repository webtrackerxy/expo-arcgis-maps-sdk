# Contributing

Thanks for your interest in `expo-arcgis-maps-sdk`. This guide covers the local checks every change
must pass and how to drive the example app on a real simulator/emulator to confirm a feature actually
renders.

## Ground rules

The engineering contract is [`CLAUDE.md`](./CLAUDE.md) — read it before making changes. In short:

- Design the **TypeScript contract first**; change the contract and both native platforms together.
- Public values are serializable; no native ArcGIS types cross the bridge.
- No `any` in production code; TypeScript strict mode; stable `E_*` error codes.
- Add tests with the implementation. Keep native resource ownership explicit (cancel on disposal).
- Use [Conventional Commits](https://www.conventionalcommits.org/) and update the changelog for
  user-visible changes.

## Required checks

Use Yarn. Before completing a TypeScript-only change:

```bash
yarn run check      # typecheck ×2 + lint + prettier-check + jest
```

> Use `yarn run check`, **not** `yarn check` (a Yarn 1 builtin). Fix formatting with the local
> Prettier binary (`./node_modules/.bin/prettier --write .`) to avoid version drift.

Before completing native or config-plugin work, also run a clean native build:

```bash
yarn build:plugin
cd example
npx expo prebuild --clean
npx expo run:ios
npx expo run:android
```

For release-related changes, additionally verify an iOS device Release archive, an Android release
AAB, the npm package contents, and installation into a clean consumer app.

If a required check cannot run, say exactly which one and why. Never describe an untested change as
verified.

## End-to-end device verification

Unit tests and a clean build prove code compiles and DTO logic is correct. They do **not** prove the
map renders the feature. This is how to drive the example app on a booted simulator/emulator and
visually confirm it — the last step of the Definition of Done.

### Prerequisites

- A **booted iOS Simulator** — `xcrun simctl list devices booted` prints its UDID.
- A **running Android emulator** — `adb devices` prints its serial (e.g. `emulator-5554`).
- **Metro** running for the example.
- The example built + installed at least once.

Substitute your own IDs throughout:

```sh
IOS_UDID=$(xcrun simctl list devices booted | sed -n 's/.*(\([0-9A-F-]\{36\}\)).*Booted.*/\1/p' | head -1)
AND_SERIAL=$(adb devices | awk 'NR==2{print $1}')
APP=expo.modules.arcgismapssdk.example   # iOS bundle id == Android package id
```

### Metro

Both apps load JS from Metro. Start it **watching** (no `CI=1`) so edits hot-reload:

```sh
cd example && npx expo start --clear
```

- **`CI=1` disables file watching.** Metro started with `CI=1` (as `expo run:ios/android` do
  internally) will not see newly-added screens or changed assets. For iterative work, run a separate
  watching Metro and rebuild/reload against it.
- Metro asset URLs are content-hashed. After changing an image, restart Metro with `--clear`.
- Free a stuck port: `lsof -ti tcp:8081 | xargs kill`.

### iOS

The iOS Simulator has no command-line tap, so synthesize mouse clicks with AppleScript at
coordinates computed from a device-screen fraction.

```sh
# Build / install / launch
cd example && CI=1 npx expo run:ios --device "$IOS_UDID"
xcrun simctl launch booted "$APP"       # (re)launch; JS state resets to Home
xcrun simctl terminate booted "$APP"    # stop

# Screenshot (a ~100 KB PNG is usually a blank/splash frame; a content screen is 2 MB+)
xcrun simctl io booted screenshot /tmp/ios.png
```

Tap at a device-screen fraction `(fx, fy)` — measure the target's pixel centre off a screenshot and
divide by the image width/height:

```sh
tap_ios() { # $1=fx $2=fy
  osascript <<EOF
tell application "System Events" to tell process "Simulator"
  set p to position of window 1
  set s to size of window 1
end tell
set wx to item 1 of p
set wy to item 2 of p
set ww to item 1 of s
set wh to item 2 of s
set titleBar to 28
tell application "Simulator" to activate
delay 0.3
tell application "System Events" to click at {wx + ($1 * ww), wy + titleBar + ($2 * (wh - titleBar))}
EOF
}
```

Reload JS (reset to Home / pick up bundle):

```sh
osascript -e 'tell application "Simulator" to activate' -e 'delay 0.3' \
  -e 'tell application "System Events" to keystroke "r" using command down'
```

When a UI result is hard to see (an exported image, an overlay behind a dev toast), inspect what the
native side wrote to the app's data container:

```sh
DATA=$(xcrun simctl get_app_container booted "$APP" data)
find "$DATA/tmp" "$DATA/Library/Caches" -name 'map-*.png'
```

### Android

Android is fully deterministic — `adb` has real tap/swipe/screencap/logcat.

```sh
# Build / install / launch
cd example && CI=1 npx expo run:android
adb -s "$AND_SERIAL" reverse tcp:8081 tcp:8081     # let the app reach Metro
adb -s "$AND_SERIAL" shell am start -n "$APP/.MainActivity"
adb -s "$AND_SERIAL" shell am force-stop "$APP"    # stop

# Screenshot / tap / swipe (coordinates are device pixels; `adb shell wm size` prints the resolution)
adb -s "$AND_SERIAL" exec-out screencap -p > /tmp/and.png
adb -s "$AND_SERIAL" shell input tap <x> <y>
adb -s "$AND_SERIAL" shell input swipe <x1> <y1> <x2> <y2> 400

# Logs
adb -s "$AND_SERIAL" logcat -c
adb -s "$AND_SERIAL" logcat -d | grep -iE 'FATAL|AndroidRuntime|<YourTag>'
```

### Navigating the example app

The example opens on a **Categories** grid → a category's sample list → the sample. The **All**
category lists every sample and is the quickest route to a specific screen.

### Gotchas learned the hard way

- **A "rendered" screenshot ≠ a working feature.** Confirm the actual element is on screen; if it is
  hidden, verify via the file the native side wrote (iOS container) or a temporary `Log.d` (Android).
- **The LogBox dev toast** ("Open debugger to view warnings.") covers bottom-anchored overlays (scale
  bar, status text). Dismiss it or reload JS to see what is under it.
- **Compose in a React Native view** needs the lifecycle/`ViewModelStore`/`SavedStateRegistry` owners
  and a **bounded size** (a `MATCH_PARENT` overlay, not `wrap_content`) or it can measure 0×0 and
  never draw.
