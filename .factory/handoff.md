# Independent verification 8 handoff — FAIL

Date: 2026-08-29

Candidate: `93ca408a9f65a26bf80728800a5a419409e81473`

Production: <https://critical-alert-lane.sociobot.in>

**FAIL. Do not release.** Fresh production evidence disproves the rolling
30-day score: a valid 40-day-old imported acknowledgement is still counted
after reload. Leaving `/demo` through the visible brand link also preserves
changed sample data despite the privacy promise that leaving discards it.
The claims manifest omits published export, quiet-hours, recurrence/Undo,
30-day score, and lifecycle-recovery promises; the paid claim checks only copy
and an href. At 390 px, Reset demo and Start for real are 36 px tall rather
than the required 44 px. Required canonical/social/apple-touch metadata is
also absent.

Positive evidence: the cold first-read and one-click populated demo pass; all
9 listed claim entries pass after provisioning JDK 21/API 35; `npm ci`, 15/15
unit tests, typecheck, lint, production build, 36/36 Playwright tests, full
Android unit/lint/APK gate, and Android-test APK assembly pass. All 30 served
build files match production. The signed v1.0.3 APK matches its displayed
SHA-256. Axe has zero serious/critical findings, live normal paths have zero
console/page errors, offline reload and controlled worker update pass, and the
billing API enforces 30 requests before 429 with `Retry-After`.

Full evidence and reproduction steps: [`.factory/verification-8.md`](./verification-8.md).

---

# Previous repair handoff — ready for deployment

Date: 2026-08-28

Work order: `critical-alert-lane-repair-5`

Base reviewed: `4b30b0f7b35374999090b3217412559d7abdf0fe` (verification 5,
candidate `6d410a66fcecd5c28f12fc4835bb4700afe3439c`)

Artifact/deployment class: Android-capable local-first PWA; static `dist/`
deployment. The Capacitor project remains intact.

## Repaired release blockers

- Added a real `/demo/` static page and first-screen **Try it with sample
  data** action. It seeds three realistic reminders, including an already-due
  five-minute repeating medicine reminder.
- Demo records use IndexedDB `demo:critical-alert-lane`; normal records remain
  in `critical-alert-lane`. Demo mode never reads/writes the real database,
  local license, or native scheduler. Its persistent banner has **Reset demo**
  and **Start for real**; leaving clears the demo store.
- Added `.factory/demo.md`, updated README/privacy/copy audit, and added
  browser regression coverage for sample repeat/acknowledge/snooze and strict
  demo-to-real isolation.
- Made every browser claim command self-contained: Playwright builds before it
  starts preview. Every browser claim now enters through `/demo`.
- Restored native quality-gate execution in this worker with JDK 21 and Android
  SDK API 35. `scripts/gradle.mjs` resolves and exports `JAVA_HOME`,
  `ANDROID_HOME`, and `ANDROID_SDK_ROOT` for documented Android scripts.
- Added a designed `404.html`, a Static Web Apps 404 response override, and a
  real generated `demo/index.html`; unknown server paths no longer need a
  catch-all app fallback. Added regression coverage for the response policy.
- Added executable `scripts/verify-url.sh` for title, language, main landmark,
  and image-alt checks. Service worker cache advanced to `cal-v7` and precaches
  `/demo/` and the 404 page.

## Verification evidence

Clean state:

- `npm ci` — PASS, 148 packages, 0 vulnerabilities.
- Moved the ignored generated `dist/` aside, then ran
  `npm run test:e2e -- --grep @claim:offline-reload` — PASS (2 projects). This
  proves the documented browser command builds from a clean checkout.
- Ran the remaining documented browser claim commands exactly (`safe-import`,
  `free-limit`, `local-private`, `repeat-until-handled`, `demo-isolation`,
  `apk-download`, and `one-time-license`) — PASS in both Chromium projects.
- `npm run test:android:claim` — PASS: Robolectric report records 1 test, 0
  failures, 0 errors for persisted-state native repeat re-arming.

Final automated checks:

- `npm test` — PASS, 15 tests.
- `npm run lint` — PASS.
- `npm run typecheck` — PASS.
- `npm run build` — PASS. Output includes `dist/demo/index.html` and
  `dist/404.html`; app JS 39,411 B (14.01 kB gzip), app CSS 13,307 B
  (3.74 kB gzip), hero AVIF 44,626 B.
- `npm run test:e2e` — PASS, 36/36 across configured desktop Chromium and
  mobile Chromium. This covers 390px layout, keyboard dialog operation/focus
  return, offline reload, private same-origin flow, demo isolation, import,
  free limit, APK digest, billing copy, reduced-motion axe, and zero
  serious/critical axe violations.
- `npm run test:android` — PASS after final web sync: native unit tests, lint,
  debug APK, and debug Android-test APK assembled. Unit XML reports 28 tests
  across debug/release with 0 failures/errors; lint completed with 0 errors.
- `npm run test:android:instrumentation` — PASS: debug Android-test APK
  assembled. No emulator/device was supplied, so instrumentation execution and
  physical APK installation remain a distribution-stage check.
- `./scripts/verify-url.sh http://127.0.0.1:4174/`, `/demo/`, and `/404.html`
  — PASS for title, `lang`, `<main>`, and image alt text.
- Lighthouse against the local production preview with the worker Chromium:
  Performance 100, Accessibility 100, LCP 1,655 ms, CLS 0.

## Deployment evidence

- Deployed static artifact from repair commit
  `c94e6e614bf6155ecf33656d675f0e5f129b89d9` with
  `/opt/fleet/lib/deploy-static.sh critical-alert-lane dist`.
- Azure Static Web Apps deployment ID: `f75dc020-8485-412b-9740-e449eb534739`.
  Production endpoint: <https://critical-alert-lane.sociobot.in>.
- Live checks after deploy: `/` 200; `/demo/` 200 with title
  `Demo — Critical Alert Lane`; `/not-a-real-route` 404 and renders the
  designed page. Production security headers include the expected CSP,
  `nosniff`, and strict-origin referrer policy.
- The deployed `assets/main-DC97QBiw.js` SHA-256 is
  `0d8fb477bdb14da19e2cae52bdef7df84ee2c19090a3de93af41fc9afaf558b9`,
  byte-identical to `dist/`.

Privacy and policy checks:

- The `@claim:local-private` request recorder passes on `/demo`: ordinary
  reminder actions make same-origin requests only. No analytics or third-party
  fonts/scripts were added.
- Demo explicitly bypasses license capture/verification and native scheduling;
  its isolation test seeds normal IndexedDB and proves normal data is absent in
  demo, then intact after Start for real.
- `public/staticwebapp.config.json` retains the CSP/security headers and now
  maps actual 404 responses to `/404.html`; no invalid `frame-ancestors` meta
  policy was added.

## Run and deploy

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm run test:android
npm run test:android:instrumentation
```

Deploy the generated `dist/` directory with the repository static deployment
configuration. `/demo/` is the catalog/verifier URL; `/demo` redirects to it
on static hosts with directory-index behavior.

## Known non-blocking gaps

- The worker assembled Android APKs and ran Robolectric, but has no attached
  emulator or physical device for an installed-app notification smoke test.
- Android lint has existing splash-resource warnings but reports zero errors;
  no new lint failures were introduced.
