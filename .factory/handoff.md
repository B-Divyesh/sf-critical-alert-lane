# Verification handoff — FAIL

Date: 2026-08-28
Verifier work order: `critical-alert-lane-verify-1`
Tested candidate: `24da88c1f25c64e24771be0ee9182a939bf700d1`
Live URL: <https://critical-alert-lane.sociobot.in>

## Result

**FAIL — do not release as the Android product described in the brief.** The
live static files exactly match the tested candidate and the PWA's web UX,
accessibility, privacy request surface, offline reload, unit tests, build,
E2E tests, and local Lighthouse check are healthy. The core Android
repeat-until-acknowledged delivery behavior is absent.

## Exact evidence

- Fresh checkout: clean at the tested commit; `origin/main` was the same SHA.
- Passed: `npm ci` (0 audit vulnerabilities), `npm test` (8/8), `npm run
  build`, and `npm run test:e2e` (8/8).
- Local production Lighthouse: Performance 98, Accessibility 100, Best
  Practices 100, SEO 100; FCP 1.1 s, LCP 1.8 s, CLS 0, TBT 140 ms. Initial JS
  is 23,314 B (8,240 B gzip), CSS is 11,802 B (3,459 B gzip), fonts 0 B, and
  LCP AVIF 44,626 B.
- Live verification passed basic semantics and error capture (200, title,
  `lang=en`, one `h1`, main, alt text, labels, zero errors), Axe serious and
  critical at desktop and 390 px (zero), keyboard open/close/focus smoke tests,
  and live offline reload after service-worker control.
- All 23 files in the locally produced `dist/` had matching SHA-256 content at
  the live URL. Initial browser requests stayed same-origin; no tracking or
  third-party runtime request was observed.
- `android/gradlew test assembleDebug` could not start in this worker: no Java
  runtime or `JAVA_HOME` is available. No APK was produced.

## Defects

1. **P0 — missing native Android alarm/notification behavior.** `MainActivity`
   is a plain Capacitor `BridgeActivity`; the Android manifest declares only
   `INTERNET`; no native notification, alarm, exact-alarm, boot-recovery, or
   receiver code exists. Web notification checking runs only while the document
   executes (startup, visibility, and a 30-second interval), so it cannot
   repeat after an Android app is closed. This fails the principal product
   contract and Android notification/exact-alarm requirement.
2. **P1 — corrupt imports are accepted.** An import with an invalid recurrence,
   negative repeat interval, zero escalation, and invalid settings was accepted
   as `Import complete` and rendered `undefined · repeats every -1 min until
   handled`.
3. **P2 — production delivery policies.** Hashed assets are cached for only 30
   seconds, the manifest uses `application/octet-stream`, and CSP,
   Permissions-Policy, frame, COOP, and CORP headers are absent.

## Required before re-verification

Implement durable native Android notification/alarm scheduling and its
permission/reboot/timezone lifecycle, fully schema-validate imports, configure
the live MIME/cache/security headers, then verify with an Android-capable
worker using `./gradlew test assembleDebug` and actual device/emulator
background/terminated-app alert tests. See `.factory/verification.md` for the
complete command-level evidence and scope.
