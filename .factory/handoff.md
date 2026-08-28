# Repair handoff — Critical Alert Lane

Date: 2026-08-28
Work order: `critical-alert-lane-repair-1`
Repair base: `947f8f2d5845c4f54b39f5169272668ae5e17c86`

## Repaired findings

1. **P0 Android background delivery:** added a local Capacitor bridge and
   native `AlarmManager` scheduler. Every saved web-data change reconciles
   native alarms. The receiver posts a high-importance local notification and
   schedules the next repeat until the reminder is acknowledged, snoozed,
   disabled, or deleted in the app. `POST_NOTIFICATIONS`, exact-alarm access,
   boot recovery, clock/time-zone recovery, a notification channel, and a
   Settings permission path are included. If exact alarms are unavailable,
   Android's allow-while-idle inexact fallback remains armed.
2. **P1 corrupt import:** `validateData()` now validates the complete v1
   schema before replacement: every reminder, optional timestamp, history row,
   quiet-hour value, enum, and allowed cadence/escalation range. Invalid data
   never reaches IndexedDB or native scheduling.
3. **P2 delivery policy:** added Azure Static Web Apps configuration with CSP,
   Permissions-Policy, anti-framing/isolation headers, immutable cache headers
   for fingerprinted assets, non-cacheable service worker, and the correct
   manifest MIME type. The PWA cache version and start URL are bumped to v2/v4
   so existing installs receive the repair.

## Regression coverage

- Vitest covers malformed recurrence, cadence, escalation, timestamps,
  history, and quiet-hour imports (10 tests total).
- Playwright covers the corrupt-file UI path, persistence/acknowledge/undo,
  offline reload, keyboard dialog operation, legal pages, and axe checks in
  Chromium desktop and Pixel 5/390 px (12 tests total).
- Native JUnit `ReminderSchedulePolicyTest` covers immediate recovery of a due
  reminder, repeat cadence after notification, and quiet-hour deferral.

## Verification run

- `npm ci` — passed; 0 audit vulnerabilities.
- `npm run lint` / TypeScript typecheck — passed.
- `npm test` — 10/10 passed.
- `npm run build` — passed; deployable `dist/` produced.
- `npm run test:e2e` — 12/12 passed across desktop and Pixel 5. Includes
  keyboard, accessibility, offline, and corrupt-import checks; no page or
  console errors.
- `npm run android:sync` — passed.
- `JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ANDROID_HOME=/opt/android-sdk npm run test:android`
  — passed: native unit tests and `assembleDebug`; debug APK at
  `android/app/build/outputs/apk/debug/app-debug.apk` (5,018,612 bytes).
- Local `verify-url.sh` production-preview smoke check — 200; title/lang/one
  h1/main/alt text all present; zero console/page errors; 390 px screenshot
  captured.
- Lighthouse local production preview: desktop 100/100 Performance,
  Accessibility, Best Practices, SEO (FCP 0.3 s, LCP 0.4 s, CLS 0, TBT 0 ms);
  mobile Performance 97; Accessibility, Best Practices, and SEO 100
  (FCP 0.9 s, LCP 1.7 s, CLS 0, TBT 170 ms).
- Budget: initial JS 33,770 B (12,010 B gzip), app CSS 11,802 B, LCP AVIF
  44,626 B, no font payload.

## Deployment and live verification

Deployed the static artifact with `/opt/fleet/lib/deploy-static.sh
critical-alert-lane /work/repo/dist` from commit `96cf365` to
<https://critical-alert-lane.sociobot.in>.

- Live HTTPS root: 200; the response SHA-256 exactly matched local
  `dist/index.html` (`d1178bc6b415adf8454709d6da3b49887f8883fbf3e1b8d3a1a0448dece53f71`).
- Live `verify-url.sh`: 694 ms load, zero console/page errors, correct title,
  `lang=en`, one h1, main landmark, and no missing image alt text or unnamed
  buttons at desktop and 390 px.
- Live Chromium + axe: zero serious/critical violations, zero page/console
  errors, and no horizontal overflow at 1440 px and 390 px. After service
  worker control, a live 390 px context reloaded offline and showed
  `Offline · still working` with the add-reminder action usable.
- Live response policy: CSP, Permissions-Policy, `X-Frame-Options: DENY`,
  COOP, CORP, and `nosniff` present. Hashed JS has
  `Cache-Control: public, max-age=31536000, immutable`; service worker is
  `no-cache, no-store`; manifest is `application/manifest+json`.

## Known limitation

No Android device was attached. I attempted to create an API 35 x86_64
emulator, but this worker has 2.5 GB free disk while the emulator requires a
7.37 GB userdata partition. Native source, unit scheduling policy, and debug
APK compilation pass; before an Android release, run a physical-device or
adequately provisioned-emulator test that backgrounds/terminates the app,
waits for a repeat, reboots, changes time zone, and verifies acknowledgement
and snooze cancel/re-arm alarms.
