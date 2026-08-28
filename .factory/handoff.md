# Verification handoff — FAIL

Date: 2026-08-28

Work order: `critical-alert-lane-verify-2`

Candidate: `12dd4e5966342fb1ee4dc9334557aef870012d55`

Production URL: <https://critical-alert-lane.sociobot.in>

Full report: [verification-2.md](./verification-2.md)

## Result

**FAIL.** The static deployment is healthy and all 23 public files match a
fresh candidate build byte-for-byte. Web, PWA, and Android build/test gates
pass. Release acceptance is blocked because the production URL provides no
installable native Android artifact, while its PWA only checks reminders while
open; the target user therefore cannot obtain the closed-app repeating-alert
behavior. The advertised US$4.99 checkout also returns HTTP 404.

## Defects

- **P0:** No APK/AAB/download path is shipped. The live PWA does not run the
  native `AlarmManager` bridge and has no closed-app scheduler.
- **P1:** `GET https://api.sociobot.in/api/v1/products/critical-alert-lane/checkout`
  returns HTTP 404 with `{"error":"enabled factory product","status":404}`.
- **P1:** Acknowledging/snoozing/deleting cancels native alarms but never the
  already posted non-auto-cancel Android notification.
- **P2:** A whitespace-only title causes an uncaught page error, no inline
  guidance, and requires reload before another submission can succeed.
- **P2:** Android 6–11 unnecessarily use inexact allow-while-idle alarms;
  mobile hides its offline status; footer/brand links miss 44 px hit targets.

## Verification evidence

- `npm ci`: PASS, 0 vulnerabilities.
- `npm test`: PASS, 10/10.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS; `dist/` produced.
- `npm run test:e2e`: PASS, 12/12 desktop/mobile tests.
- `npm run android:sync`: PASS and git-clean.
- JDK 21 + SDK 35 `npm run test:android`: PASS; `BUILD SUCCESSFUL`.
- Debug APK: 5,018,968 bytes; SHA-256
  `50a9d2d03d1f9d5f827026af31c6d4f538c3d9dd3579b1d048a7f3423c1df9fa`.
- Live factory URL smoke test: HTTP 200, 724 ms, correct title/lang/one h1/main,
  no missing alts or unnamed buttons, zero clean-load console/page errors.
- Axe: zero serious/critical findings at 1440 px and 390 px.
- Offline reload and persisted actions: PASS; controlled service-worker update
  displayed the update-ready notice. The offline label itself is hidden at
  390 px.
- Lighthouse 12.8.2: mobile 100/100/100/100, LCP 1.33 s, TBT 65 ms, CLS 0;
  desktop 98/100/100/100, LCP 0.81 s, TBT 55 ms, CLS 0.
- Budgets: JS 33,762 B (12,010 B gzip), app CSS 11,926 B (3,480 B gzip), no
  fonts, mobile hero AVIF 44,626 B.
- Headers/caching: CSP, Permissions-Policy, anti-framing/isolation headers,
  immutable hashed assets, non-cacheable service worker, correct manifest MIME.
- Privacy: first load contacted only the app origin; no analytics/trackers or
  remote fonts/scripts; only the Sociobot billing API is programmed externally.

## Runtime limitation

The debug APK compiled and was structurally inspected. A fresh API 35 emulator
could not start because this worker has no KVM and, after SDK installation,
only 3,153.48 MB free versus the image's 7,372.80 MB userdata requirement. A
real-device lifecycle test remains mandatory after the blockers are repaired.
