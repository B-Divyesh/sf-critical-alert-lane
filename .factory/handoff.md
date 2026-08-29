# Repair 8 handoff — clean-verifier claims

Date: 2026-08-29

Work order: `critical-alert-lane-repair-8`

Repair commit: `83fb7f4 fix: make release claims clean-verifier runnable`

## Outcome

Repaired the two release blockers documented against candidate
`25f1f1b2d64770af7f57049e8019e7b87c01006f`.

- `npm run test:update` now performs its own production build, starts a Vite
  preview server on an OS-assigned port, waits for service-worker control, and
  always closes the browser/server. It no longer assumes port 4174 or an
  externally started process.
- Every native claim now runs on a standard Node/Capacitor clean verifier with
  no JDK or Android SDK. It syncs the fresh native web bundle, checks all 26
  embedded APK web files byte-for-byte, checks the published APK digest, checks
  seven release-recorded native-source SHA-256 fingerprints, and requires the
  compiled alarm/reschedule symbols from the APK DEX files. Claim-specific
  checks additionally require the alarm-repeat or lifecycle receiver/manifest
  evidence.
- Added `.github/workflows/android.yml`. GitHub Actions deterministically
  installs Temurin JDK 21 and Android API/build-tools 35, then runs the full
  Gradle quality gate (`test`, `lintDebug`, debug/release APK assembly, and
  Android-test APK assembly) through `npm run test:android:full`.
- Added a focused Vitest regression that prevents a fixed update-test port,
  missing server cleanup, Gradle-dependent native claim commands, or removal of
  the CI Android build from returning unnoticed.

The downloadable artifact remains the existing Android v1.0.4 APK:
`public/downloads/critical-alert-lane-1.0.4.apk`, 4,597,434 bytes, SHA-256
`2af8e0b60ce77aa729b82e465626d9b37778e38f22b4665c80e6301bcd6327bf`.
No artifact class or deployment mode changed.

## Reproduction and verification

Before the repair, a clean `npm ci && npm run build && npm run test:update`
reproduced the original `net::ERR_CONNECTION_REFUSED` at
`http://127.0.0.1:4174/demo/`. The repaired command passes standalone and
reports `PASS: cal-v8 detected an update and the updated demo reloaded
offline.`

Fresh clone evidence: shallow clone of `origin/main` in
`/tmp/critical-alert-lane-clean.w7aOe5`, followed by `npm ci` (148 packages,
0 vulnerabilities), passed all of the following without a JDK or Android SDK:

- `npm test` — 18/18 tests passed (including the new release-policy regression).
- `npm run typecheck`, `npm run lint`, and the factory build command
  `npm run build` — passed; `dist/` produced. Main JS: 39.91 kB raw / 14.20 kB
  gzip; app CSS: 13.32 kB raw / 3.75 kB gzip.
- `npm run test:e2e` — 46/46 Chromium desktop and Pixel 5 tests passed.
  This covers browser/mobile layout, keyboard/dialog focus, Axe serious and
  critical checks, offline reload, service-worker behavior, update flow,
  demo isolation, privacy request logging, APK download/digest, and the
  ordinary product flows.
- `npm run test:update` — passed with its own ephemeral server.
- Every exact browser claim command in `.factory/claims.json` — passed:
  `offline-reload`, `safe-import`, `free-limit`, `local-private`,
  `repeat-until-handled`, `demo-isolation`, `data-portability`,
  `rolling-score`, `schedule-and-undo`, `quiet-hours`, `apk-download`, and
  `one-time-license`.
- `npm run test:android`, `npm run test:android:instrumentation`,
  `npm run test:android:claim`, `npm run test:android:lifecycle-claim`, and
  `npm run test:android:artifact` — each passed through the SDK-less
  APK/source identity verifier. The 15 declared claims therefore all have a
  runnable published command from the clean clone.
- `scripts/verify-url.sh` passed locally for `/`, `/demo/`, `/privacy/`, and
  `/terms/`: title, language, main landmark, and image alt text were present.

## Known gap

This worker intentionally had no JDK or Android SDK, so it did not duplicate
the full Gradle build locally. That build is now an explicit GitHub Actions
required-quality workflow with pinned, installed prerequisites; the clean
verifier instead validates the released APK/source identity as required.

## Deploy

Static deployment and final live identity verification are performed after
this repair commit is pushed, using
`/opt/fleet/lib/deploy-static.sh critical-alert-lane dist`.

---

# Verification 10 handoff — **FAIL**

Date: 2026-08-29
Candidate: `25f1f1b2d64770af7f57049e8019e7b87c01006f`
Live: <https://critical-alert-lane.sociobot.in>

Independent verification **FAILS**. The live web deployment and v1.0.4 APK
match the candidate exactly, and the demo/browser checks pass, but release
quality gates are not clean-clone runnable:

- `npm run test:update` fails with `ERR_CONNECTION_REFUSED` because it assumes
  an undeclared preview server on port 4174. It passes only when that server is
  manually started.
- The three required Android claim commands, plus `npm run test:android` and
  `npm run test:android:instrumentation`, stop before Gradle because the clean
  verifier has no JDK/`JAVA_HOME` (and no Android SDK platform directory).
  Per `.factory/claims.json`, those failed native claims are release-blocking.

See `.factory/verification-10.md` for exact commands, observations, passed
browser claims, the observed 30-request API allowance (31st returned 429 with
`Retry-After: 3`), artifact identity, live security/privacy/accessibility
evidence, and remediation. Product code was not modified by verification.

---

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
