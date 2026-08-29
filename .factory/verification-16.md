# Independent verification 16 — PASS

Date: 2026-08-29  
Work order: `critical-alert-lane-verify-16`  
Candidate: `59169d4eb9a8a3a2dfe43ed14134919cbf919d6e`  
Live URL: <https://critical-alert-lane.sociobot.in>

## Verdict

**PASS.** The deployed PWA and downloadable Android APK match the candidate,
all declared claims and available quality gates pass, and the previous Android
artifact/layout failure is repaired in v1.0.6.

## Mandatory first gates

- Clean `npm ci`: 148 packages installed; audit reported 0 vulnerabilities.
- `.factory/claims.json` exists and contains 26 claims. Every exact command
  was run from this checkout using the demo entry point where applicable; the
  full 74-test desktop/mobile Playwright suite and all native claim commands
  passed. Claim IDs: `offline-reload`, `safe-import`, `free-limit`,
  `local-private`, `repeat-until-handled`, `demo-isolation`, `demo-ready`,
  `data-portability`, `rolling-score`, `schedule-and-undo`, `quiet-hours`,
  `repeat-range`, `pwa-installable`, `android-permission-boundary`,
  `timing-limits`, `core-free`, `native-background-repeat`,
  `lifecycle-recovery`, `apk-download`, `apk-source-identity`,
  `apk-update-signing`, `repo-no-signing-secrets`, `one-time-license`,
  `billing-data-boundary`, `billing-processor-refunds`, and
  `license-recovery`.
- Cold live first-read: **PASS**. The first screen says it keeps critical
  Android reminders repeating, names Android users overwhelmed by
  notifications, and offers **Try it with sample data** with the plain
  explanation “Opens three isolated sample reminders.” One click reaches
  `/?demo=1` with three realistic records and visible Acknowledge/Snooze.

## Clean-checkout gates

| Check | Result |
| --- | --- |
| `npm test` | PASS — 23 tests |
| `npm run typecheck`, `npm run lint`, `npm run test:copy` | PASS |
| `npm run build` | PASS — production `dist/` created |
| `npm run test:e2e` | PASS — 74 tests, desktop and 390 px mobile |
| `npm run test:update` | PASS — `cal-v12` update and offline demo reload |
| `npm run test:android:claim`, `:lifecycle-claim`, `:artifact`, `:update-signing`, `:repo-secrets` | PASS |
| `npm run test:android:full` | PASS with independently provisioned JDK 21, Android API 35, and build-tools 35.0.0 |

The fresh unsigned release APK passed native/source identity with 28 embedded
web assets and SHA-256
`65a0aae1c811b9dafad51fa90e9fed6dd20c4062f18f7026921eaef65e91d556`.
Its embedded demo put the due reminder, Acknowledge, and Snooze controls inside
the 390 x 844 viewport after one click. The signed v1.0.6 update check passed:
code 4 to code 7 with the same Sociobot Factory Android Signing certificate.
The exact candidate’s GitHub Android workflow is also green:
[run 33249229654](https://github.com/B-Divyesh/sf-critical-alert-lane/actions/runs/33249229654).

## Independent live product QA

- Normal real-lane flow added a past-due daily reminder, persisted it across
  reload, acknowledged it, and restored it with Undo. Whitespace-only titles
  received the actionable validation error and recovery worked.
- Desktop and 390 px demo flows had three samples, a visible due reminder,
  working acknowledgement/undo, no page or console errors, and no serious or
  critical Axe findings. Keyboard Tab traversal reached the visible skip link,
  navigation, demo action, add action, and due controls with `:focus-visible`.
- Reduced motion computed to 0.01 ms transition/animation durations and
  `scroll-behavior: auto`. A service-worker-controlled demo reloaded offline
  and displayed “Offline · still working.”
- Ordinary demo flows made only same-origin requests; no cookies, third-party
  fonts, analytics, ads, or trackers were observed. Billing is only reached by
  its explicit Sociobot flow. No sign-in exists, so Entra tenant validation is
  not applicable.
- `/privacy/` and `/terms/` returned 200 with route titles and one h1; an
  intentional missing route returned the designed 404. `verify-url.sh` passed
  live root and demo.

## Deployment, headers, budgets, and allowance

- The live APK SHA-256 equals the candidate file:
  `e902da576a34ede089010c2fbce721d811ea587106abe024eebcd33c47a5289e`.
- Fresh `dist/` comparison found **39/39 deployable files byte-identical** to
  the live origin; the one excluded file is host-only
  `staticwebapp.config.json`, correctly not served as a public asset.
- Response headers include HSTS, a response-header CSP with
  `frame-ancestors 'none'`, `nosniff`, DENY framing, strict referrer policy,
  COOP/CORP, and restrictive Permissions Policy. Hashed JS is immutable for a
  year; `sw.js` is no-store.
- Initial JavaScript is 46,105 bytes raw / 15,903 bytes gzip, CSS is 17,147 /
  4,471 bytes, and the hero AVIF is 44,626 bytes: all within the stated static
  budgets.
- The Sociobot verification endpoint allowed 30 invalid requests from this
  client; request 31 returned **429** with `Retry-After: 0`. Observed allowance:
  **30 requests/client**.

## Defects and limitation

| Severity | Finding |
| --- | --- |
| P0–P2 | None found. |
| P3 | No physical Android device/emulator was available, so instrumentation APK execution on-device was not performed. Host unit tests, lint, fresh APK assembly, source/DEX identity, signing continuity, and the APK’s embedded browser demo all passed. |
