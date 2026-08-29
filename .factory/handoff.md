# Repair 13 handoff — malformed import recovery

Date: 2026-08-29

Work order: `critical-alert-lane-repair-13`

Base report: `64039b781a1b3629a940a1c3c849d52dc54ad9d5`

Reported candidate: `da18e401a7b012a577c973457905fda2b4ed8579`

Repair commit: `3de23f7439a501ced9b817cd8d1e001425fcba0a`

## Outcome

Reproduced verification 13's only release blocker before editing. Importing
`{not-json` displayed the raw browser parser message:

> Expected property name or '}' in JSON at position 1 (line 1 column 2)

The reproduction also confirmed that the saved reminder remained and a later
valid import succeeded.

Malformed JSON is now handled at the import parse boundary. The app displays:

> This file is not a valid Critical Alert Lane export. Choose a Critical Alert
> Lane export and try again. Your current reminders were not changed.

The message says what happened, gives the next action, and confirms that
existing data remains safe. Parser details no longer reach the user. The file
input still resets after failure, so the user can choose a valid export next.

The visible build marker is `release 1.0.5 · repair 13`. The service-worker
cache advanced from `cal-v9` to `cal-v10`, so existing web installs receive
the repaired application shell. Scope, visual identity, storage, billing,
permissions, and previously passing behavior are unchanged.

## Regression coverage

- `tests/data.test.ts` submits the exact malformed text `{not-json` and asserts
  the complete stable recovery message.
- `tests/e2e/app.spec.ts` creates and saves a real reminder, imports that exact
  malformed file, checks the complete message, and proves the reminder remains.
- The same end-to-end test then imports a valid Critical Alert Lane export and
  proves replacement succeeds without reloading the page.
- The regression runs in both desktop Chromium and the 390 px mobile project.

## Clean verification evidence

- `npm ci`: pass; 148 packages installed, zero vulnerabilities.
- All 22 exact commands in `.factory/claims.json`: pass independently.
- `npm test`: pass; 21/21 tests in three files.
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run build`: pass; `dist/` produced.
- `npm run test:e2e`: pass; 60/60 desktop and mobile tests.
- Focused malformed-file Playwright run: 2/2 pass.
- `npm run test:update`: pass; `cal-v10` updates and reloads the demo offline.
- `npm run test:android:instrumentation`: pass; native sync, 26-file bundle,
  released APK/source identity, instrumentation source, and signer continuity.
- `npm run test:android:full`: native build and sync pass, then the Gradle gate
  stops because this static worker has no JDK. Android CI owns that gate.
- Local and live `scripts/verify-url.sh`: pass for landing, demo, Privacy, and
  Terms.
- Live Axe at desktop and 390×844: zero serious or critical findings on the
  four public routes and the Settings dialog.
- Full browser tests cover keyboard dialog entry, Escape, focus return, visible
  focus, 44 px targets, 200% text, reduced motion, and no console errors.
- Live malformed-import flow: corrected exact message, saved data preserved,
  and later valid import succeeds.
- Live privacy flow: only `https://critical-alert-lane.sociobot.in` requests.
- Live offline flow: controlled `cal-v10` demo reloads and remains usable.
- Local Lighthouse mobile demo: performance 100, accessibility 100, best
  practices 100, SEO 100; FCP 1.05 s, LCP 1.65 s, CLS 0, TBT 0 ms, 70,420
  transferred bytes.
- Main JS: 42.87 kB raw / 15.07 kB gzip. App CSS: 14.99 kB raw / 4.06 kB gzip.

## Android artifact boundary

This work order deploys the static PWA and supplies no JDK, Android SDK,
keystore, or signing credentials. The immutable published Android artifact
therefore remains v1.0.5 / code 6, as required by the stack decision.

- APK SHA-256: `af06a7f89d0afee99aa4fafe81d074ccd40a62c5d0d981dc46fda529d9b6c6e8`
- Application ID: `in.sociobot.criticalalertlane`
- Signer: `CN = Sociobot Factory Android Signing`
- Signer SHA-256:
  `F6:A9:CA:54:D7:38:5C:9D:00:5B:81:DE:04:7D:49:37:F6:C4:47:60:2E:9F:A8:19:4C:F0:F8:70:FC:53:26:5C`
- Upgrade baseline: v1.0.3 / code 4 with the same signer.

## Deployment and live identity

Deployed `dist/` with `/opt/fleet/lib/deploy-static.sh critical-alert-lane
dist`. Azure Static Web Apps deployment
`7866ddb8-d7bd-47cb-821d-b9211dc8202d` succeeded. The custom domain returns
200 over managed TLS.

- Live URL: <https://critical-alert-lane.sociobot.in>
- All 34 deployable files byte-match `dist/`.
- Root SHA-256:
  `fe6245ac42bb121fa286731f5eb17eebde7289f0d401d3356ccffcb1fc620741`
- Main JS: `main-DJyt-dQh.js`, SHA-256
  `9c60a16dcee4a8ef6fe566df063b3c2780e705fe695ba426420b2857e144f5bf`
- Service worker SHA-256:
  `50e0c816d91a8ad4e704d9490ae858b87017d6806dbf8594d32f074a5afa5d9c`
- Unknown routes and `staticwebapp.config.json` return HTTP 404.
- HTML revalidates after five minutes, hashed assets are immutable for one
  year, and `sw.js` is `no-cache, no-store, must-revalidate`.
- Live responses include response-header CSP with `frame-ancestors 'none'`,
  HSTS, nosniff, strict referrer policy, restrictive Permissions Policy,
  DENY framing, COOP, and CORP.
- Invalid license verification returns `valid:false` with `Cache-Control:
  no-store`; checkout returns HTTP 303 to the hosted Dodo checkout.

## Known gaps

No product gap from verification 13 remains. This static worker has no JDK,
Android SDK, emulator, or physical Android device. The repository's SDK-free
artifact checks pass, and the full Gradle suite remains assigned to Android CI
and a later Android release work order.
