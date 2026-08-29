# Independent verification 11 — FAIL

Date: 2026-08-29
Verifier work order: `critical-alert-lane-verify-11`
Candidate commit: `33cf5318c50e9c14b2b017cbd3cf6242a955a535`
Live URL: <https://critical-alert-lane.sociobot.in>

## Decision

**FAIL — P1 Android update-signing break.**

The prior deployment-only quality-gate failure is repaired: every declared
claim test is now runnable and passes from this clean checkout, the live web
deployment byte-matches this candidate, and the PWA/browser quality checks are
healthy. The release is still not acceptable as an Android product because the
published v1.0.4 APK cannot update the previously published v1.0.3 app.

## Release blocker

### P1 — published APK changes the Android signing identity

The two still-public artifacts have the same application ID
`in.sociobot.criticalalertlane`, but different signer certificates:

| APK | Version | SHA-256 | signer SHA-256 |
| --- | --- | --- | --- |
| `critical-alert-lane-1.0.3.apk` | 1.0.3 / code 4 | `06382ba158e7cd4a28222e14a81174150b574daabe17af9be62cac91213e3c16` | `F6:A9:CA:54:D7:38:5C:9D:00:5B:81:DE:04:7D:49:37:F6:C4:47:60:2E:9F:A8:19:4C:F0:F8:70:FC:53:26:5C` (`CN=Sociobot Factory Android Signing`) |
| `critical-alert-lane-1.0.4.apk` | 1.0.4 / code 5 | `2af8e0b60ce77aa729b82e465626d9b37778e38f22b4665c80e6301bcd6327bf` | `55:97:0A:15:27:D3:E5:CF:10:C9:D7:46:65:5E:AC:0F:47:DA:22:F3:0F:6D:D1:22:D8:ED:01:20:6D:EA:94:84` (`CN=Critical Alert Lane Release`) |

The certificate records were extracted fresh from `META-INF/CRITICAL.RSA` and
`META-INF/CERT.RSA` with OpenSSL. Android requires an update to be signed by
the same signing identity; therefore a device with the factory-signed v1.0.3
cannot install v1.0.4 as an update. This also violates the Android release
contract requiring the factory keystore for signed release builds. Rebuild and
republish v1.0.4 (or a higher version) with the factory signing key, then
verify the signer continuity before release.

## Claims — run first from the demo entry point

`.factory/claims.json` exists and contains 15 claims. After a clean `npm ci`,
the browser claim suite was executed against its self-started production demo
entry point; **24 Chromium claim tests passed**. This covers every browser
claim tag: `offline-reload`, `safe-import`, `free-limit`, `local-private`,
`repeat-until-handled`, `demo-isolation`, `data-portability`, `rolling-score`,
`schedule-and-undo`, `quiet-hours`, `apk-download`, and `one-time-license`.

The three exact native claim commands also passed from the clean checkout:

| Claim | Command | Result |
| --- | --- | --- |
| `native-background-repeat` | `npm run test:android:claim` | PASS — fresh native sync, 26 embedded assets, published APK digest, source fingerprints, and repeat receiver symbols verified |
| `lifecycle-recovery` | `npm run test:android:lifecycle-claim` | PASS — boot, clock, and time-zone receiver/compiled-symbol evidence verified |
| `apk-source-identity` | `npm run test:android:artifact` | PASS — all 26 APK web assets match the just-synced native bundle |

No claim test failed. This removes the failure reported in verification 10;
the signing continuity issue above is separate and release-blocking.

## Fresh live-product evidence

- **First read: PASS.** A cold uncached page says it keeps critical Android
  reminders repeating, names Android users overwhelmed by notifications, and
  says medicine, deadlines, and calls stay visible until handled. The first
  action is the one-click **Try it with sample data** link. `/demo` immediately
  shows three realistic reminders and the persistent **Demo — sample data,
  nothing is saved** banner with Reset demo and Start for real.
- **Core flow and recovery: PASS.** On fresh desktop and 390×844 contexts the
  due sample acknowledged and undid correctly; invalid quiet hours announced
  “Enter both a start and end time for quiet hours,” valid quiet hours saved,
  and Add reminder opened/closes from the keyboard. The complete local
  Playwright suite also covers create/persist/reload, recurrence, snooze,
  import validation/replacement, free limit, licensing fixture, and demo exit
  isolation.
- **Accessibility: PASS.** `scripts/verify-url.sh` passed live `/`, `/demo`,
  `/privacy/`, and `/terms/`. Fresh axe scans of live `/demo` at desktop and
  390 px returned zero violations (zero serious/critical). All visible tested
  controls were at least 44 px, keyboard focus was a visible 4 px yellow
  outline, and reduced-motion computed transition duration was `0.00001s` with
  `scroll-behavior: auto`.
- **Privacy/network: PASS for ordinary use.** Cold and exercised live demo
  flows requested only the product document, JS, CSS, and hero image from
  `critical-alert-lane.sociobot.in`; there were no analytics, tracking,
  third-party fonts, scripts, or ordinary-data requests. Billing is reachable
  only after explicit purchase/restore action.
- **Rate allowance: PASS.** Fresh invalid-license checks to
  `https://api.sociobot.in/api/v1/products/critical-alert-lane/verify` returned
  HTTP 200 for attempts 1–30. Attempt 31 returned **429** with
  `Retry-After: 3`; observed allowance is 30 requests per client window.
- **PWA/update: PASS.** `npm run test:update` passed standalone, reporting
  `cal-v8 detected an update and the updated demo reloaded offline.` The
  offline-reload claim passed after service-worker control.
- **Deployment identity: PASS.** Fresh production build hashes equal live:
  `main-BGocQITe.js` SHA-256
  `1299f1fbccfa319c0f0a856c991a68c17023db49fed4fa7175de5325379e099c`,
  root HTML `d75b42ed4d966c1456769ebf67e60eb8188650d5a2f8ea1dff2582c666948cdc`,
  service worker `47039e972f359d16261e4f807259dfa99fb54224f5128a25401b1f3928d8d410`,
  and v1.0.4 APK
  `2af8e0b60ce77aa729b82e465626d9b37778e38f22b4665c80e6301bcd6327bf`.
- **Headers/caching/budgets: PASS.** Live HTML has CSP including response-header
  `frame-ancestors 'none'`, HSTS, nosniff, strict referrer policy,
  restrictive Permissions Policy, COOP/CORP, and DENY framing. Hashed assets
  and APK are immutable for one year, the worker is no-store, and unknown
  routes return HTTP 404. Main JS is 39.91 kB raw / 14.20 kB gzip and app CSS
  is 13.32 kB raw / 3.75 kB gzip, within static budgets.

## Local quality gates

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 148 packages installed, 0 vulnerabilities |
| `npm test` | PASS — 18 tests across 3 files |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — deployable `dist/` produced |
| `npm run test:e2e` | PASS — 46 desktop/Pixel 5 tests |
| `npm run test:update` | PASS |
| `npm run test:android:claim` | PASS |
| `npm run test:android:lifecycle-claim` | PASS |
| `npm run test:android:artifact` | PASS |
| `npm run test:android:full` | Not runnable in this supplied `deploy: none` worker: it stops with `A JDK is required for Android checks.` This is an environment limitation, not a failed declared claim; the SDK-less published-artifact checks above passed. |

## Required resolution

Use the factory signing key to produce and publish a version-bumped APK whose
certificate matches v1.0.3, update the displayed digest and release record,
then independently re-run the APK identity and signer-continuity checks. Do
not release the current v1.0.4 APK as the update path.
