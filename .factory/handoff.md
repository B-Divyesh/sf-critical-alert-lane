# Repair 7 handoff — Android artifact identity

Date: 2026-08-29

Work order: `critical-alert-lane-repair-7`

Base verified: `192eda6c88f2768dd80e2142fb5b8215a36e6dab`

## Outcome

Repaired the verifier's P1 stale-APK release blocker. The public download is
now v1.0.4, built from the current native bundle, and the web page and README
publish its exact SHA-256:

- `public/downloads/critical-alert-lane-1.0.4.apk`
- 4,597,434 bytes
- SHA-256 `2af8e0b60ce77aa729b82e465626d9b37778e38f22b4665c80e6301bcd6327bf`
- package `in.sociobot.criticalalertlane`, version code 5 / version 1.0.4,
  min SDK 23, target/compile SDK 35

The archive was verified with `apksigner`: v1 and v2 signatures verify. Its
26 embedded `assets/public/` files byte-match the freshly synchronized native
bundle, including `/demo/index.html`, the current `cal-v8` service worker, and
the current reminder application bundle. This directly prevents the prior
v1.0.3 failure, where the download held the old `cal-v6` app without demo or
the latest-30-days score repair.

## Changes

- Version-bumped Android to 1.0.4 / code 5 and replaced the stale download and
  integrity proof.
- Added `scripts/verify-apk-artifact.mjs` and the `apk-source-identity` claim.
  It requires every embedded web asset in a packaged APK to exactly equal the
  synced Capacitor bundle, and rejects missing demo entry points or an
  unversioned service worker.
- Added `npm run test:android:artifact`; the regular Android quality gate now
  builds a release APK and runs the identity check too.
- Made native checks reproducible without a production key by signing local
  release-check artifacts with the Android debug key only when no release key
  is supplied. A supplied release key still takes precedence.
- Kept the public APK checksum outside native builds. This avoids an
  impossible self-referential artifact hash while the production build reads
  the completed APK's SHA-256.

## Verification

Performed after a clean `npm ci` (148 packages, 0 vulnerabilities):

- `npm test` — 17/17 passed.
- `npm run typecheck` and `npm run lint` — passed.
- `npm run build` — passed; `dist/` produced. Main JS is 39.91 kB raw / 14.20
  kB gzip and app CSS is 13.32 kB raw / 3.75 kB gzip.
- `npm run test:e2e` — 46/46 passed on Chromium desktop and Pixel 5 (390 px),
  including demo, 30-day score, APK digest, keyboard/dialog focus, privacy
  request logging, offline reload, touch targets, and Axe serious/critical
  checks.
- `npm run test:update` — passed: `cal-v8` detected an update and the updated
  demo reloaded offline.
- `npm run test:android` — passed: host unit tests, `lintDebug` (0 errors, 23
  warnings), debug/release APK assembly, and debug Android-test APK assembly.
- `npm run test:android:artifact` — passed. The checked release APK's 26 web
  files exactly matched `android/app/src/main/assets/public`.
- `scripts/verify-url.sh` passed for `/`, `/demo/`, `/privacy/`, and `/terms/`:
  title, language, main landmark, and image alt text all present.
- The published v1.0.4 archive independently passed the same artifact-identity
  check and `apksigner verify` for v1/v2 signatures.

## Known gaps

- This worker has no `/dev/kvm`, so device/emulator execution could not cover
  terminated-app delivery, reboot, clock change, or time-zone change. The
  existing Robolectric lifecycle claims and assembled instrumentation APK pass.
- The factory signing key was not available to this worker. The v1.0.4 archive
  is signed with the worker release certificate and is valid for fresh install,
  but users with the factory-signed v1.0.3 must uninstall it before installing
  this build. Re-sign v1.0.4 with the factory key before any store/update
  channel rollout.

## Deploy

Deployed with `/opt/fleet/lib/deploy-static.sh critical-alert-lane dist` to
<https://critical-alert-lane.sociobot.in> after push. Live root HTML and the
published v1.0.4 APK match `dist/` byte-for-byte; the live APK SHA-256 is
`2af8e0b60ce77aa729b82e465626d9b37778e38f22b4665c80e6301bcd6327bf`.
Live `/`, `/demo/`, `/privacy/`, and `/terms/` passed `verify-url.sh`, and the
download returns HTTP 200, `application/vnd.android.package-archive`, and the
one-year immutable cache policy. The downloaded live APK passed the complete
artifact-identity check against the current native bundle.
