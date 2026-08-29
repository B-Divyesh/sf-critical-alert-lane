# Repair 14 handoff — PASS

Date: 2026-08-29

Work order: `critical-alert-lane-repair-14`

Base verifier report: `f1f04fbdd7aabdd2d3c8158f1f12b9bd543c7835`

Product/artifact repair: `3ca242c2d0f980ef2df6e7b701369e34bbfa88b8`

CI repair: `60c2ccbb77b0df2d7ae50ac25e7e7e8b190cb035`

Live URL: <https://critical-alert-lane.sociobot.in>

## Outcome

Both Android release blockers in
[`verification-15.md`](./verification-15.md) are repaired.

1. `npm run test:android:full` now accepts the current product term,
   `Repeat until acknowledged`. It passed locally with OpenJDK 21, Android API
   35, build-tools 35.0.0, unit tests, lint, debug/release assembly, and test
   APK assembly. The fresh unsigned APK also passed byte-for-byte native-bundle
   and 390 x 844 demo checks.
2. The public Android download is now signed v1.0.6 / code 7, built from the
   synchronized current native bundle. It is 4,601,762 bytes with SHA-256
   `e902da576a34ede089010c2fbce721d811ea587106abe024eebcd33c47a5289e`.
   It retains `CN = Sociobot Factory Android Signing` and its recorded
   SHA-256 signer fingerprint, so it updates the v1.0.3 / code 4 baseline.

The v1.0.6 APK is in `public/downloads/` and was mirrored to
`factory-artifacts/critical-alert-lane/critical-alert-lane-1.0.6.apk`. The
live download and the factory artifact both match the recorded digest.

## Regression coverage added

- `verify-apk-artifact.mjs` now compares every embedded APK web asset to the
  current synchronized Capacitor bundle for published and fresh APKs. This
  closes the stale-bundle gap that let v1.0.5 pass after the PWA changed.
- The verifier now requires `Repeat until acknowledged`, rather than the
  obsolete `Repeat until handled` marker.
- New `scripts/verify-apk-demo.mjs` extracts an APK's embedded web bundle,
  runs it in Chromium at 390 x 844, takes the one-click demo path, and requires
  the due title, Acknowledge, and Snooze inside the first viewport.
- `test:android:artifact` runs bundle equality, the APK viewport test, and
  upgrade-signing verification. `test:android:full` runs the same checks on
  its freshly assembled release APK.
- Unit policy coverage requires the new APK demo check. The existing download
  claim is updated for v1.0.6.

## Verification

Clean dependency install: `npm ci` installed 148 packages with zero reported
vulnerabilities.

- All 26 exact commands in `.factory/claims.json`: PASS, each run separately.
- `npm test`: PASS, 23 tests.
- `npm run typecheck`, `npm run lint`, and `npm run test:copy`: PASS.
- `npm run build`: PASS; `dist/` produced.
- `npm run test:e2e`: PASS, 74 desktop and 390 px mobile tests.
- `npm run test:update`: PASS; `cal-v12` updated and the demo reloaded offline.
- `npm run test:android:artifact`: PASS; 28 published embedded assets matched
  the current native bundle, then the signed APK demo passed at 390 x 844.
- `npm run test:android:full`: PASS with JDK 21/API 35; the fresh unsigned APK
  SHA-256 was `65a0aae1c811b9dafad51fa90e9fed6dd20c4062f18f7026921eaef65e91d556`.
- GitHub Actions Android release check: PASS —
  [run 33249017891](https://github.com/B-Divyesh/sf-critical-alert-lane/actions/runs/33249017891)
  installed the pinned Chromium and passed the complete Android gate.
- `scripts/verify-url.sh`: PASS locally and live for landing, demo, Privacy,
  and Terms.
- Live Chromium QA: PASS across normal, invalid, recovery, desktop keyboard,
  390 px, 200% text, reduced motion, legal, 404, and offline reload paths.
  Axe found zero violations on seven scanned states. Ordinary reminder flows
  made same-origin requests only, with no font requests, page errors, or
  unexpected console errors.
- Lighthouse against the local production build: mobile 100/100/100/100
  (performance/accessibility/best-practices/SEO; LCP 1.7 s, TBT 50 ms, CLS 0)
  and desktop 100/100/100/100 (LCP 0.4 s, TBT 0 ms, CLS 0).

## Deployment and live identity

The committed static `dist/` was deployed with the configured static work
order. The live root, demo, Privacy, and Terms return 200. All 39 deployable
files, excluding the host-only config response behavior, byte-match the live
origin. The live site returns HSTS, response-header CSP with
`frame-ancestors 'none'`, `nosniff`, strict referrer policy, DENY framing,
COOP, CORP, and a restrictive Permissions Policy. `sw.js` is no-store; the
APK is immutable for one year with the APK MIME type.

## Known gap

No physical Android device or emulator was available. The assembled Android
instrumentation APK was not executed on a device. Native host unit tests,
lint, signed APK verification, source/DEX checks, and the embedded APK web UI
all passed.
