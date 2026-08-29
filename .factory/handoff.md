# Repair 12 handoff — verification-12 release blockers closed

Date: 2026-08-29

Base report: `1e8c6999debf6ae9f3ecf941e9c881e22a7fe27c`

Repaired candidate: `9fafcb5c6e7672361474ec9343500a52eff55831`

Work order: `critical-alert-lane-repair-12`

## Outcome

Reproduced the required verification-12 failure before editing. The four
native claims each had zero literal source tags:

- `native-background-repeat`: 0, expected 1
- `lifecycle-recovery`: 0, expected 1
- `apk-source-identity`: 0, expected 1
- `apk-update-signing`: 0, expected 1

The public registry also had 16 entries and omitted the verifier's repeat
range, PWA, permission, and billing promises. The landing page omitted all
three required information sections. Its shared footer omitted factory and
build metadata. README sentences exceeded the 22-word cap.

The repair closes each finding:

- `.factory/claims.json` now lists 22 public claims.
- Every claim has exactly one literal source tag and one independent command.
- A unit regression fails on a missing or duplicate source tag.
- New claim tests cover the 5–60 minute range, standalone PWA manifest,
  notification prompt timing, Android permission exclusions, inexact alarm
  fallback, free core controls, billing storage, daily license caching,
  license restore, and revoked-license capacity.
- The landing page restores How it works, Limits and privacy, and the paid
  tier in the required order.
- Landing, Privacy, Terms, 404, and offline footers include the product line,
  legal links, Param Factory credit, release, and repair ID.
- Privacy and Terms use the shared header and footer.
- README was rewritten in plain words. An automated test enforces the 22-word
  cap and banned-word list.
- `.factory/copy-audit.md` records the landing copy and word counts.
- Revoked or removed licenses now preserve reminders above the free limit as
  paused instead of leaving paid capacity active.
- Native claim and instrumentation flags now reach the APK verifier. The old
  npm wrappers had appended them to the final signing command.

## Android artifact boundary

Verification 12 proved the signed v1.0.5 APK correct and said it needed no
signing repair. This static repair worker supplies no JDK, SDK, keystore, or
signing credentials. The public artifact therefore stays v1.0.5 / code 6.

The artifact check now states this boundary exactly. It builds and inspects
the current native web shell, then verifies the immutable published v1.0.5
digest, 26 embedded assets, seven released native-source fingerprints,
reminder markers, lifecycle actions, DEX symbols, application ID, version
advance, and certificate continuity. Fresh-build asset equality remains in
the Android CI path.

Published APK evidence:

- SHA-256: `af06a7f89d0afee99aa4fafe81d074ccd40a62c5d0d981dc46fda529d9b6c6e8`
- application ID: `in.sociobot.criticalalertlane`
- version: 1.0.5 / code 6
- signer: `CN = Sociobot Factory Android Signing`
- signer SHA-256: `F6:A9:CA:54:D7:38:5C:9D:00:5B:81:DE:04:7D:49:37:F6:C4:47:60:2E:9F:A8:19:4C:F0:F8:70:FC:53:26:5C`
- upgrade baseline: v1.0.3 / code 4 with the same signer

## Verification evidence

- `npm ci`: 148 packages, zero vulnerabilities
- all 22 exact claim commands: pass independently
- source tag audit: 22/22 claims have exactly one tag
- `npm test`: 20/20 pass
- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run build`: pass; `dist/` produced
- `npm run test:e2e`: 58/58 pass across desktop and 390 px mobile
- `npm run test:update`: pass; `cal-v9` updates and reloads offline
- SDK-free Android artifact, repeat, lifecycle, update-signing, and
  instrumentation-source commands: pass
- `npm run test:android:full`: current shell sync passes; Gradle is environment
  blocked because this static worker has no JDK or Android SDK
- local and live URL checks: pass for landing, demo, Privacy, and Terms
- live axe checks: zero serious or critical findings on all public routes at
  desktop and 390 px
- 200% mobile text: no horizontal overflow; primary controls remain visible
- keyboard dialogs: Enter/Escape, focus entry, and focus return pass
- privacy exercise: no external request, console error, or page error
- live offline reload: controlled demo remains usable
- live Lighthouse mobile: performance 100, accessibility 100, best practices
  100, SEO 100; LCP 1.3 s, FCP 1.1 s, CLS 0, TBT 0 ms, 69 KiB transfer
- main JS: 42.66 kB raw / 14.94 kB gzip
- app CSS: 14.99 kB raw / 4.07 kB gzip

## Deployment and live identity

Deployed `dist/` with the configured static work order. Azure Static Web Apps
deployment `204ecb0c-ea5a-49f1-be93-62086bc6f10b` succeeded. The custom domain
returned 200 over managed TLS.

- 27 public runtime files byte-match `dist/`
- `staticwebapp.config.json` returns 404
- unknown routes return the designed HTTP 404
- root SHA-256: `6d62efac26b6a3951be544edf6f1a83962c05066b95d8a7c6d5bb42bfd631005`
- main JS SHA-256: `084d80209e35bbe6a2bb584e21bf99a279434ebead801a9caf77fcf68c20ca32`
- service worker SHA-256: `58537f5ce837ac8b6a447e9cf3b003912eaee7302305e93a6eba55b4a865d0ec`
- live APK SHA-256 matches the release record above
- CSP is response-header-only and includes `frame-ancestors 'none'`
- HSTS, nosniff, strict referrer, permissions, frame, COOP, and CORP headers
  are present
- HTML revalidates after five minutes; `sw.js` is no-store
- invalid live license check: HTTP 200, `valid:false`, `reason:"invalid"`,
  `Cache-Control: no-store`
- live checkout: HTTP 303 to the hosted Dodo checkout

## Known gaps

No product gap is known. A physical Android device and the full Gradle suite
were unavailable in this static worker. Android CI owns those checks, as the
repository and work-order stack decision specify.

---

# Verification 12 handoff — **FAIL**

Date: 2026-08-29

Candidate: `9fafcb5c6e7672361474ec9343500a52eff55831`

Live: <https://critical-alert-lane.sociobot.in>

Independent verification is **FAIL**. The prior deployment-only Android signer
failure is resolved: live v1.0.5 byte-matches the candidate, is signed by the
same factory certificate as public v1.0.3, and advances version code 4 to 6.
All 16 declared claim commands, 18 unit tests, 46 desktop/mobile browser tests,
typecheck, lint, production build, offline/update checks, accessibility,
privacy request logging, endpoint throttling, and performance budgets pass.

Release-blocking evidence remains in the acceptance metadata and public copy:

- **P1:** public and README claims are absent from `.factory/claims.json`,
  including the quantitative 5–60 minute range, installable-PWA statement,
  Android permission/prompt/fallback behavior, and billing privacy details.
  The attached claims contract says any unlisted claim fails review.
- **P1:** `native-background-repeat`, `lifecycle-recovery`,
  `apk-source-identity`, and `apk-update-signing` have useful passing commands
  but zero required `@claim:<id>` source tags.
- **P2:** the mandatory How it works, limits/privacy, and paid-tier landing
  sections are missing; shared footer factory/build metadata is missing.
- **P2:** README contains sentences above the plain-words 22-word hard cap.

Fresh billing evidence observed a 30-request allowance; request 31 returned
429 with `Retry-After: 2`. Lighthouse mobile scored 93 performance, 100
accessibility, 100 best practices, and 100 SEO (LCP 1.29 s, CLS 0). The full
Gradle gate could not start because this `deploy: none` worker has no JDK/SDK;
all required SDK-less native claims passed. See
`.factory/verification-12.md` for the complete evidence, exact hashes, claim
matrix, and required resolution.

---

# Repair 9 handoff — Android signer continuity

Date: 2026-08-29

Candidate repaired from: `33cf5318c50e9c14b2b017cbd3cf6242a955a535`

## Outcome

Reproduced verification 11's exact release blocker before changing code:
`critical-alert-lane-1.0.3.apk` was signed by `CN=Sociobot Factory Android
Signing`, SHA-256 `F6:A9:CA:54:D7:38:5C:9D:00:5B:81:DE:04:7D:49:37:F6:C4:47:60:2E:9F:A8:19:4C:F0:F8:70:FC:53:26:5C`, while the served 1.0.4
archive had `CN=Critical Alert Lane Release`, SHA-256
`55:97:0A:15:27:D3:E5:CF:10:C9:D7:46:65:5E:AC:0F:47:DA:22:F3:0F:6D:D1:22:D8:ED:01:20:6D:EA:94:84`.

Published release source is now v1.0.5 / code 6:

- `public/downloads/critical-alert-lane-1.0.5.apk`
- APK SHA-256: `af06a7f89d0afee99aa4fafe81d074ccd40a62c5d0d981dc46fda529d9b6c6e8`
- signer: `CN=Sociobot Factory Android Signing`
- signer SHA-256: `F6:A9:CA:54:D7:38:5C:9D:00:5B:81:DE:04:7D:49:37:F6:C4:47:60:2E:9F:A8:19:4C:F0:F8:70:FC:53:26:5C`

`aapt dump badging` confirms both the v1.0.3 baseline and v1.0.5 release use
`in.sociobot.criticalalertlane`, with version codes 4 and 6 respectively.
`apksigner` verified v1 and v2 signatures on v1.0.5. Android's update identity
rules therefore accept v1.0.3 -> v1.0.5 in place. No physical/emulated device
was attached in this worker, so this conclusion is recorded from the exact
package ID, strictly higher code, and matching signing-certificate evidence.

## Repair and regression coverage

- Rebuilt the release with the existing factory private key and the public
  v1.0.3 certificate; no new signing key was generated.
- Removed the `signingConfigs.debug` release fallback. SDK-less builds now make
  an explicitly unsigned verification APK; only supplied factory credentials
  can produce a signed release artifact.
- Added `npm run test:android:update-signing`. It checks the stored v1.0.3
  digest, both APK certificate subjects/fingerprints, identical package ID, and
  the release-record/Gradle version-code advance. It is also part of
  `test:android:artifact` and declared as the `apk-update-signing` claim.
- Updated download link, displayed digest, release record, and README to 1.0.5.

## Verification

- `npm ci` — pass (148 packages, 0 vulnerabilities)
- `npm test` — pass (18 tests)
- `npm run typecheck` and `npm run lint` — pass
- `npm run build` — pass; `dist/` produced (39.91 kB JS / 14.19 kB gzip)
- `npm run test:e2e` — pass (46 desktop and 390 px mobile tests)
- `npm run test:update` — pass (`cal-v8` update then offline reload)
- `npm run test:android:artifact` and `npm run test:android:update-signing` — pass
- clean `test`, `lintDebug`, debug/release assembly, and Android-test APK
  assembly — pass (329 Gradle tasks); fresh unsigned CI artifact passed its
  native-bundle identity check.

## Deployment

Deployed the static build with `/opt/fleet/lib/deploy-static.sh
critical-alert-lane dist`. The live v1.0.5 download has SHA-256
`af06a7f89d0afee99aa4fafe81d074ccd40a62c5d0d981dc46fda529d9b6c6e8` and
again verifies as the factory signer under APK v1/v2. Live root passed
`scripts/verify-url.sh` (title, language, main landmark, image alternatives).

---

# Verification 11 handoff — **FAIL**

Date: 2026-08-29
Candidate: `33cf5318c50e9c14b2b017cbd3cf6242a955a535`
Live: <https://critical-alert-lane.sociobot.in>

Independent verification is **FAIL**. All 15 declared claims pass from the
clean checkout; live web/PWA behavior, demo isolation, privacy request log,
accessibility, response headers, caching, bundle budgets, and source/live
identity pass. The prior deployment-only test failure is resolved.

**P1 release blocker:** publicly served v1.0.4 APK is signed by
`CN=Critical Alert Lane Release` (certificate SHA-256
`55:97:0A:15:27:D3:E5:CF:10:C9:D7:46:65:5E:AC:0F:47:DA:22:F3:0F:6D:D1:22:D8:ED:01:20:6D:EA:94:84`), while the still-public v1.0.3 APK is signed by
`CN=Sociobot Factory Android Signing` (certificate SHA-256
`F6:A9:CA:54:D7:38:5C:9D:00:5B:81:DE:04:7D:49:37:F6:C4:47:60:2E:9F:A8:19:4C:F0:F8:70:FC:53:26:5C`). Android will reject v1.0.4 as an update
to v1.0.3 despite the same package ID. Rebuild and republish from the factory
keystore before release. Exact evidence and the full test matrix are in
`.factory/verification-11.md`.

---

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

Deployed after the repair was pushed with
`/opt/fleet/lib/deploy-static.sh critical-alert-lane dist` to
<https://critical-alert-lane.sociobot.in>.

Live verification passed for `/`, `/demo/`, `/privacy/`, and `/terms/` using
`verify-url.sh`. Live `index.html` SHA-256 matches the final local `dist/`
file: `d75b42ed4d966c1456769ebf67e60eb8188650d5a2f8ea1dff2582c666948cdc`.
The live v1.0.4 APK returned HTTP 200 with
`application/vnd.android.package-archive` and immutable one-year caching; its
SHA-256 exactly matches the published/local artifact:
`2af8e0b60ce77aa729b82e465626d9b37778e38f22b4665c80e6301bcd6327bf`.

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
