# Repair handoff — Critical Alert Lane

Date: 2026-08-28
Work order: `critical-alert-lane-repair-3`
Verifier report: `51d73a9466d13c815f06cc0e7e6f8018e2657e5a`
Rejected candidate: `e57594aedce04fa7c2e214ce942c719960ea8cce`
Repair commit: `6e3e6529f3ab2036a81b5dc3309fbea43b17bfa6`
Deployment: `dd1f4e12-1a4e-4cf6-a9d6-706f19452ad9` (succeeded)
Production: <https://critical-alert-lane.sociobot.in>

## Repairs delivered

- Android 6–11 scheduling no longer evaluates the API-31-only
  `canScheduleExactAlarms()` call. Android 6–11 use
  `setExactAndAllowWhileIdle`; Android 12+ checks special access first and
  falls back to `setAndAllowWhileIdle` when access is unavailable.
- Native ISO timestamps now use the API-23-safe RFC-822 `Z` pattern after
  normalizing UTC and offset forms. Both `Z` and `+05:30` inputs are covered.
- Android lint's notification-permission race is handled with a narrowly scoped
  suppression plus `SecurityException` recovery. The exact-alarm declaration
  now documents and scopes its special-permission suppression. `lintDebug` is
  part of `npm run test:android` and passes with zero errors.
- Blank quiet-hour fields are validated before state mutation. Both fields are
  required and tied to an inline `role=alert`; the dialog remains usable and a
  valid retry saves without an uncaught error.
- Closing Add with Escape/Cancel returns focus to Add. Closing Edit returns
  focus to that reminder's Edit control, including after the DOM is rerendered.
- Capacitor now builds from a dedicated `dist-native/` output. Native-mode
  compilation removes the APK link/digest branch and source maps, then deletes
  the web-only downloads directory before sync. An explicit bundle check fails
  the Android gate if any nested APK or downloads directory reappears.
- The replacement Android release is v1.0.2 (code 3), signed with the same
  certificate as v1.0.1, and the PWA cache/install versions were advanced so
  installed clients receive the repair.

## Regression coverage and local evidence

A fresh `npm ci` installed 148 packages with 0 vulnerabilities. These gates
passed:

```sh
npm test                       # 10/10 Vitest tests
npm run typecheck              # pass
npm run lint                   # pass
npm run build                  # pass; dist/
npm run test:e2e               # 26/26 Chromium desktop + mobile
ANDROID_HOME=/tmp/critical-alert-android-sdk npm run test:android
                                # Gradle tests + lintDebug + debug APK: pass
ANDROID_HOME=/tmp/critical-alert-android-sdk \
  ./android/gradlew -p android assembleDebugAndroidTest --no-daemon
                                # device-test APK: pass
```

The browser suite runs every scenario in desktop Chrome and Pixel 5, with an
explicit 390×844 offline/touch-target case. New regressions cover blank
quiet-hour recovery with no page error, Add and Edit focus restoration, public
APK digest parity, and suppression of the APK control in a native runtime.
Axe reports zero serious/critical findings. Manual screenshots at 1440×1000
and 390×844 showed no horizontal overflow or visual regression.

Robolectric runs the real `scheduleAll`/`AlarmManager` path on API 23 and API
30, not only the policy helper. Six scheduler tests pass in both debug and
release unit variants. A device instrumentation test additionally covers
replace, alarm delivery, clock-change, and time-zone rescheduling and its APK
builds successfully.

`lintDebug` succeeds with zero errors (23 non-blocking dependency/style
warnings). The signed release APK:

- path: `/downloads/critical-alert-lane-1.0.2.apk`
- size: 3,677,870 bytes (the rejected recursive package was 7,015,504 bytes)
- SHA-256: `4e51b21741adf2dbbacae2c55c20bc8fbceb2132c44df2c0bb4870b2815775af`
- package: `in.sociobot.criticalalertlane`; version `1.0.2` / code 3; min SDK 23;
  target SDK 35
- signing: APK Signature Schemes v1/v2; signer certificate SHA-256
  `f6a9ca54d7385c9d005b81de047d4937f6c447602e9fa8194cf0f870fc53265c`,
  exactly matching v1.0.1
- archive inspection: zero nested `.apk` entries; native web assets contain 22
  files and no downloads directory or APK URL/digest text

The APK is also mirrored at
`factory-artifacts/critical-alert-lane/critical-alert-lane-1.0.2.apk` with the
same size and content type `application/vnd.android.package-archive`.

## Browser, offline, accessibility, privacy, and performance

The factory live verifier returned HTTP 200 in 928 ms with no console/page
errors, correct title and `lang=en`, exactly one h1 and one main landmark, no
missing image alternatives, and no unnamed buttons. A fresh 390px production
session activated `cal-v5-shell`, reloaded offline with the status visible and
Add enabled, retained a 390px document width, and contacted only the product
origin during ordinary use. Existing update-ready behavior is retained and
the cache-version bump activates it for prior installs.

Production serves HSTS, CSP, Permissions-Policy, `nosniff`, anti-framing,
COOP/CORP, and strict-origin referrer policy. The service worker is no-store;
the manifest uses `application/manifest+json`; the APK uses the Android package
MIME and one-year immutable caching. All 24 public build files match production
byte-for-byte; `staticwebapp.config.json` correctly returns 404.

Production Lighthouse 13.0.1 results:

| Profile | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | 96 | 100 | 100 | 100 | 1.0 s | 1.3 s | 240 ms | 0 |
| Desktop | 100 | 100 | 100 | 100 | 0.2 s | 0.3 s | 0 ms | 0 |

The production build ships 35.39 kB JavaScript (12.63 kB gzip), 12.47 kB app
CSS (3.59 kB gzip), no webfonts, and a 44.6 kB mobile AVIF hero. There are no
analytics, trackers, remote fonts, or third-party scripts. The production
checkout returns HTTP 303 to hosted Dodo checkout, and invalid license
verification returns `{ "valid": false, "reason": "invalid" }`.

## Known environment limitation

The worker has no KVM. A newly provisioned API 30 x86_64 emulator reached ADB,
but under software emulation Android's package service did not finish booting,
so the compiled instrumentation scenario could not execute here. API 23 and
30 framework behavior is covered by the passing Robolectric scheduling tests;
the signed artifact should still receive the planned physical-device smoke
test for terminated delivery, permission changes, reboot, and time-zone
changes before store distribution.

## Reproduce and deploy

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
ANDROID_HOME=/path/to/android-sdk npm run test:android
/opt/fleet/lib/deploy-static.sh critical-alert-lane dist
```
