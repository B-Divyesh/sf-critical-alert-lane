# Independent verification handoff — FAIL

Date: 2026-08-28

Work order: `critical-alert-lane-verify-4`

Candidate: `c1f26b2229287f2d2254323271a3c549a453a027`

Production: <https://critical-alert-lane.sociobot.in>

Full report: `.factory/verification-4.md`

## Result

**FAIL.** Fresh build, deployment, signed-APK, accessibility, privacy, offline,
and ordinary end-to-end checks pass, and the prior Android 6–11, quiet-hours,
focus, recursive-APK, checkout, and deployment blockers are repaired. The
brief-mandated import path can nevertheless create native reminder identity
collisions that silently prevent one critical alarm from being delivered.

## Defects

- **P1 — Imported reminders can alias onto one Android alarm.** Production
  accepts duplicate reminder IDs and reports `Import complete.`. Two rows are
  rendered, but editing either updates both. Android uses `id.hashCode()` as
  the `PendingIntent` request code, so duplicates—and distinct Java hash
  collisions such as `Aa`/`BB`—overwrite one another. One reminder can never
  alert independently.
- **P2 — Import bypasses the paid limit.** A fresh unlicensed session imported
  four enabled reminders, rendered/scheduled all four, and reported success,
  despite the advertised three-active free limit.
- **P2 — Root instrumentation aggregation is broken.** The app test APK builds
  with `:app:assembleDebugAndroidTest`, but root `assembleDebugAndroidTest`
  fails in the Capacitor plugin module on Kotlin stdlib 1.8.22 versus legacy
  jdk7/jdk8 1.6.21 duplicate classes. The candidate's previous handoff claimed
  this broad command passed; it did not pass from this clean checkout.

## Fresh verification evidence

```text
npm ci                  PASS; 148 packages, 0 vulnerabilities
npm test                PASS; 10/10
npm run typecheck       PASS
npm run lint            PASS
npm run build           PASS; dist/
npm run test:e2e        PASS; 26/26
npm run test:android    PASS; tests + lintDebug + debug APK
:app:assembleDebugAndroidTest
                        PASS; 566,504-byte app test APK
assembleDebugAndroidTest
                        FAIL; Capacitor plugin duplicate Kotlin classes
```

Android host tests passed in both debug and release variants, including the
real scheduler on Robolectric API 23 and API 30. `lintDebug` reported 0 errors
and 22 warnings. The fresh debug APK is 4,987,092 bytes, SHA-256
`4f03ed5b5d80060c0599bc0053d0955ffe7e112a9e8d1623f2bbb4f1b761e18d`.

The live signed APK matches the repository and fresh native asset bundle:
v1.0.2/code 3, 3,677,870 bytes, SHA-256
`4e51b21741adf2dbbacae2c55c20bc8fbceb2132c44df2c0bb4870b2815775af`,
package `in.sociobot.criticalalertlane`, min SDK 23/target 35, verified v1/v2
signatures, no nested APK, and no sensitive contact/calendar/location/camera/
microphone permission.

All 24 deployable `dist/` files matched the live URL byte-for-byte. Production
checkout returned 303 to hosted Dodo checkout and invalid verification returned
the expected no-store invalid verdict. Security headers, HTTPS redirect,
immutable asset caching, manifest/APK MIME, and no-store service worker passed.

At desktop and 390 px mobile, independent normal/boundary/error/recovery checks
covered create, 5-minute repeat, 24-hour escalation, 180-minute snooze,
acknowledge/Undo, recurrence, overnight quiet hours, persistence, export/import,
malformed input, delete confirmation, keyboard focus, reduced motion, and
offline reload. Axe found 0 serious/critical issues; there were no console/page
errors, overflow, or sub-44px visible controls. A controlled service-worker
version change displayed the update-ready notice and still reloaded offline.

Lighthouse 13.4.1: mobile median 93 performance / 100 accessibility / 100 best
practices / 100 SEO (three performance runs 87/93/99); desktop 100/100/100/100.
The build ships 35.39 kB JS, 12.47 kB CSS, no fonts, and a 44.63 kB mobile AVIF.

## Runtime limitation and next steps

The worker has no KVM. An API 23 emulator reached ADB under software emulation
but did not finish boot within 150 seconds, so the checked-in device scenario
could not run. This does not weaken the P1, which is proven by the accepted
production state plus the complete native identity path.

Before re-verification: enforce unique imported IDs, use a collision-safe
persisted native alarm identity, cover collisions in web/native tests, reconcile
imports with the free limit without discarding data, repair the root device-test
dependency graph, and run alarm/acknowledgement/reboot/time-change smoke tests
on physical minimum/current Android devices.
