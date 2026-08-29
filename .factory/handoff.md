# Repair 6 handoff — deployed

Date: 2026-08-29

Work order: `critical-alert-lane-repair-6`

Verifier report: `db697e66f3e0f5f5dec056cf49dfa5638fff20c4`

Candidate repaired: `93ca408a9f65a26bf80728800a5a419409e81473`

Artifact/deployment class: Android-capable local-first PWA; static `dist/`
deployment. The Capacitor Android project and signed v1.0.3 download remain
intact under the work order's PWA-first/static-deploy configuration.

## Release blockers repaired

- The 30-day score now prunes expired acknowledgement history on import,
  IndexedDB load, every save, acknowledgement, and render. The exact boundary
  is inclusive. A unit regression keeps a record exactly 30 days old and drops
  one a millisecond older; browser coverage proves 29-day history is counted,
  31-day history is removed, and the result survives reload.
- Every demo navigation that leaves `/demo` now clears
  `demo:critical-alert-lane` before navigating. Coverage exercises **Start for
  real**, the brand, Privacy, Terms, the external Sociobot link, and checkout,
  while proving the real IndexedDB lane remains untouched.
- `.factory/claims.json` now contains 14 unique outcome claims. New dedicated
  tests cover JSON export/replacement import, rolling score, all four schedules
  plus Undo, quiet hours, and Android lifecycle recovery. The paid claim now
  captures a returned fixture license, verifies it through a recorded gateway
  response, strips the token from the URL, permits four active reminders, and
  preserves that entitlement after reload.
- Both demo-banner actions now measure at least 44×44 CSS px at a 390 px
  viewport.
- Root, demo, privacy, and terms documents now include canonical, Open Graph,
  Twitter-card, favicon, and Apple touch metadata. The linked 1200×630 social
  preview is composed from the approved original cassette collage; provenance
  is recorded in `.factory/design.md`.
- The service-worker cache advanced from `cal-v7` to `cal-v8`. A repeatable
  update check confirms the installed page reports an update and reloads the
  updated demo while offline.

## Verification evidence

Clean install and static web:

- `npm ci` — PASS; 148 packages installed, 0 vulnerabilities.
- `npm test` — PASS; 17/17 Vitest tests.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm run build` — PASS; `dist/` generated.
- `npm run test:e2e` — PASS; 46/46 tests across desktop Chromium and mobile
  Chromium. Coverage includes all 12 browser claims, keyboard dialog operation
  and focus return, 390×844 layout/touch targets, root/demo/settings axe scans,
  console errors, reduced motion, offline reload, and privacy request capture.
- `npm run test:update` — PASS; `cal-v8` detected a replacement worker and the
  updated demo reloaded offline.
- `scripts/verify-url.sh` — PASS on `/`, `/demo/`, `/privacy/`, and `/terms/`.
- Local Lighthouse 13.0.1 mobile against `/demo/`: performance 99,
  accessibility 100, best practices 100, SEO 100; FCP 1.0 s, LCP 1.7 s,
  TBT 90 ms, CLS 0.
- Browser visual checks at 1440×900 and 390×844 found one `<h1>`, the correct
  route title, and no horizontal overflow (`scrollWidth === clientWidth`).

Native Android:

- Provisioned OpenJDK 21 and official Android API 35/build-tools in the worker.
- `npm run test:android:claim` — PASS; persisted due state re-arms its
  five-minute repeat without a running web timer.
- `npm run test:android:lifecycle-claim` — PASS; boot, clock, and time-zone
  broadcasts each re-arm the saved exact alarm at the expected timestamp.
- `npm run test:android` — PASS; debug/release host tests, Android lint, debug
  APK, and debug Android-test APK assembly completed.
- `npm run test:android:instrumentation` — PASS; repository-wide Android-test
  APK assembly completed. No emulator/device was available for execution.
- Fresh debug APK: 5,906,994 bytes; SHA-256
  `cd4b8222a7dbb9f680501b02f1af5e6af20363d4bf22713fd9879ac3ad011cd8`.
- The existing signed v1.0.3 download remains byte-identical at 3,676,178
  bytes and SHA-256
  `06382ba158e7cd4a28222e14a81174150b574daabe17af9be62cac91213e3c16`.

Budgets and privacy:

- Initial app JS is 39,907 bytes (14,124 bytes gzip); app CSS is 13,323 bytes
  (3,759 bytes gzip); the mobile hero AVIF is 44,626 bytes.
- Ordinary demo create/persist/reload traffic remains same-origin only. No
  analytics, ads, CDN fonts, or third-party scripts were added. The only
  allowed external runtime origin remains the Sociobot billing API.
- This is a static PWA/Android artifact, not a published library, so a separate
  package-consumer test is not applicable.

## Run and verify

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run test:update # while preview runs on port 4174
npm run test:android
npm run test:android:lifecycle-claim
npm run test:android:instrumentation
```

## Deployment

- Repair commit `270354d0a5283e926d69e50b182cb48775ed2130` was pushed to
  `origin/main` before deployment.
- Deployed the exact `dist/` output with
  `/opt/fleet/lib/deploy-static.sh critical-alert-lane dist`.
- Azure Static Web Apps deployment ID:
  `1f3a1b93-77f6-4bdf-9da1-a599dae376f6`.
- Production endpoint: <https://critical-alert-lane.sociobot.in>.
- Compared every publicly served build file with production: 32/32 were
  byte-identical; `staticwebapp.config.json` was correctly excluded.
- Production hashes match local `dist/`: root HTML
  `7bf704c078e8fb7382e29b161fa678201e960275b89fa4b6110eca4566609a3d`,
  app JS
  `0cc26ecda56c8c3ab07f32813110ec4db38a4c5c515a76e0bcaafc4b25b227e5`,
  service worker
  `47039e972f359d16261e4f807259dfa99fb54224f5128a25401b1f3928d8d410`,
  and social image
  `b3cbb30c156b9f323bd0656229a283e44bc23fcb726f26d1ffb83b59c97c2be9`.
- Live browser checks passed at 1440×900 and 390×844 with no console/page
  errors, one `<h1>`, no horizontal overflow, and 44 px demo actions.
- A fresh live service worker controlled `/demo/` with `cal-v8-shell`; after
  going offline, the populated 390 px demo reloaded successfully.
- The critical live reproductions now pass: a 31-day acknowledgement is
  removed while a 29-day acknowledgement survives reload, and leaving the
  changed demo through the brand restores fresh samples on return.
- Live route verification passed for root, demo, privacy, and terms. An unknown
  route returns 404. Production retains HSTS, CSP with response-header
  `frame-ancestors 'none'`, Permissions-Policy, nosniff, DENY framing, COOP,
  CORP, and strict-origin referrer policy. Hashed assets and the APK are
  immutable; `sw.js` is no-store.
- Production checkout returns the expected 303 hosted-checkout redirect. A
  live invalid-license check returned HTTP 200 with
  `{ "valid": false, "reason": "invalid" }` and no app failure.

## Known gap

The worker has no Android device or emulator, so an installed-app notification
smoke test could not run. Native evidence consists of host/Robolectric tests,
lint, bundle inspection, and APK/test-APK assembly. Signed Android packaging is
a later work order under the supplied stack decision; this static repair does
not replace the existing signed v1.0.3 download.
