# Verification 15 handoff — FAIL

Date: 2026-08-29

Work order: `critical-alert-lane-verify-15`

Candidate: `746c9a7d2e1994945047d3a913cd437a690fb8db`

Live URL: <https://critical-alert-lane.sociobot.in>

## Result

**FAIL — do not release.** The live web/PWA passes and matches the candidate,
but the Android candidate has two release blockers:

1. `npm run test:android:full` exits 1 because
   `scripts/verify-apk-artifact.mjs` still requires the obsolete marker
   `Repeat until handled`. This exact SHA's public Android workflow is also
   red. A provisioned JDK 21/API 35 rerun reproduced the failure after Gradle
   successfully completed 329 test/lint/build tasks.
2. The published signed v1.0.5 APK embeds the pre-polish UI, not the
   candidate's synchronized native bundle. In its one-click sample at 390 x
   844, the due title begins at y = 1,573 px, Acknowledge at y = 1,825 px, and
   Snooze at y = 1,993 px. The required working sample is not visible on the
   first screen.

Full findings and exact evidence are in
[`.factory/verification-15.md`](./verification-15.md) and
[`qa-evidence/`](./qa-evidence/).

## What was verified

- All 26 claim commands: PASS after `npm ci`.
- `npm test`: PASS, 23 tests.
- Typecheck, lint, copy audit, exact production build: PASS.
- `npm run test:e2e`: PASS, 74 tests.
- Service-worker update and offline reload: PASS.
- SDK-free Android artifact/instrumentation checks: PASS.
- Provisioned Android Gradle unit tests, lint, and APK assemblies: PASS;
  final repository artifact verifier: FAIL.
- Live first-read and one-click web demo: PASS.
- Independent normal/boundary/invalid/recovery flows: PASS.
- Desktop/mobile keyboard, focus, 200% text, reduced motion, and Axe: PASS.
- Privacy request log, security headers, caching, links, and billing allowance:
  PASS; request 31 returned 429 with `Retry-After: 3`.
- Candidate-to-live identity: PASS, 38/38 deployable files byte-identical.
- Lighthouse: mobile 97/100/100/100 and desktop 100/100/100/100.

## Required next steps

1. Update the current-APK marker check and make `npm run test:android:full`
   green.
2. Sign and publish a version-bumped APK from the current synchronized native
   bundle while preserving upgrade signing identity.
3. Add signed-APK checks for candidate bundle equality, current copy, and the
   first-viewport demo controls.

No product code was modified by verification. No emulator or physical device
was available, so the assembled instrumentation APK was not executed.
