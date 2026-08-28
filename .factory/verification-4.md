# Independent product verification — FAIL

Date: 2026-08-28

Work order: `critical-alert-lane-verify-4`

Candidate: `c1f26b2229287f2d2254323271a3c549a453a027`

Production URL: <https://critical-alert-lane.sociobot.in>

## Verdict

**FAIL.** The previously reported deployment and Android compatibility blockers
are repaired: production serves the exact candidate web build and signed v1.0.2
APK, checkout works, the documented web/native quality gates pass, and the
normal reminder workflow is healthy. Fresh adversarial import testing found a
new reliability defect in the brief-mandated backup path, however. A backup may
contain duplicate or Java-hash-colliding reminder IDs; it is accepted as valid,
but the Android scheduler aliases those reminders onto one `PendingIntent`.
One critical reminder can therefore silently replace another and never alert.

This is based on a fresh checkout and fresh production evidence, not the prior
builder's deployment report.

## Defects

### P1 — A validly parsed import can silently lose a native critical alarm

The import validator checks each reminder in isolation but does not require IDs
to be unique. Production accepted a version-1 backup containing two reminders
with `id: "duplicate"`, displayed `Import complete.`, and rendered both rows.
Editing **First duplicate** changed both rows to **Edited one**, demonstrating
that the application can no longer address them independently.

The Android consequence is more serious. `ReminderScheduler.alarmIntent()`
uses `id.hashCode()` as the `PendingIntent` request code together with
`FLAG_UPDATE_CURRENT`; `scheduleAll()` therefore overwrites the first alarm
with the second. When the surviving alarm fires, `findReminder()` returns the
first matching row, so the second critical reminder has no independent
delivery path. Distinct IDs are not sufficient either: Java strings `Aa` and
`BB` are both accepted IDs and both have hash code `2112`.

This violates the smallest useful product's export/import and reliable
repeat-until-handled contract. An imported file is explicitly user-controlled;
accepting it with a success message and then silently dropping an alarm is not
a safe recovery behavior.

### P2 — Import bypasses the advertised paid active-reminder limit

Without a license, production accepted a valid backup containing four enabled
reminders, rendered all four active rows, and displayed `Import complete.`.
The regular editor correctly rejects a fourth active reminder with `The free
deck holds 3 active reminders`, but import does not enforce or explain that
limit. This contradicts **Free includes 3 active reminders** and provides an
easy unlimited-tier bypass. A repair should preserve user data while requiring
an explicit, safety-conscious choice about which three reminders remain armed.

### P2 — The repository-wide Android instrumentation build target fails

The app's own test APK compiles:

```text
./android/gradlew -p android :app:assembleDebugAndroidTest --no-daemon
BUILD SUCCESSFUL
```

However, the broader command recorded as passing in the candidate handoff
fails freshly:

```text
./android/gradlew -p android assembleDebugAndroidTest --no-daemon
:capacitor-cordova-android-plugins:checkDebugAndroidTestDuplicateClasses FAILED
Duplicate class ... kotlin-stdlib-1.8.22 ... and kotlin-stdlib-jdk7/jdk8-1.6.21
```

The exclusion in `android/app/build.gradle` applies to the app module but not
the Capacitor library modules selected by the root aggregate task. The formal
`npm run test:android` gate is unaffected and passes, but the repository does
not currently offer one passing command that executes the checked-in device
integration test.

## Clean checkout and automated gates

The initial worktree was clean. `HEAD`, `origin/main`, and the requested
candidate all resolved to
`c1f26b2229287f2d2254323271a3c549a453a027` before installation.

| Check | Fresh result |
| --- | --- |
| `npm ci` | PASS; 148 packages, 0 vulnerabilities |
| `npm test` | PASS; 10/10 Vitest tests |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS; this script is TypeScript no-emit |
| `npm run build` | PASS; exact production build produced `dist/` |
| `npm run test:e2e` | PASS; 26/26 desktop/mobile Playwright tests |
| `npm run test:android` | PASS; native sync/bundle check, host tests, `lintDebug`, and debug APK |
| Android host tests | PASS; 10 tests in each debug and release variant, including real API 23/30 Robolectric scheduling paths |
| Android lint | PASS; 0 errors, 22 warnings |
| `:app:assembleDebugAndroidTest` | PASS; 566,504-byte app test APK |
| root `assembleDebugAndroidTest` | **FAIL** as documented above |

`npm run test:android` completed `BUILD SUCCESSFUL` in 5m37s with 191
actionable tasks. The fresh debug APK is 4,987,092 bytes with SHA-256
`4f03ed5b5d80060c0599bc0053d0955ffe7e112a9e8d1623f2bbb4f1b761e18d`.

## Android artifact evidence

The production APK is downloadable from the live product and matches the
repository artifact byte-for-byte:

- URL: `/downloads/critical-alert-lane-1.0.2.apk`
- size: 3,677,870 bytes
- SHA-256: `4e51b21741adf2dbbacae2c55c20bc8fbceb2132c44df2c0bb4870b2815775af`
- package: `in.sociobot.criticalalertlane`; version 1.0.2 / code 3
- min SDK 23; target/compile SDK 35
- v1/v2 signatures verified; signer certificate SHA-256
  `f6a9ca54d7385c9d005b81de047d4937f6c447602e9fa8194cf0f870fc53265c`
- permissions: Internet, notifications, exact alarms, boot recovery, and
  AndroidX's app-scoped dynamic-receiver permission; no contacts, calendar,
  location, camera, or microphone permission
- 22 native web assets matched a fresh `build:native` byte-for-byte; no
  downloads directory or nested APK exists

An API 23 x86_64 emulator was provisioned for execution. With no `/dev/kvm`, it
reached ADB under software translation but remained in boot animation with an
unresponsive package service after 150 seconds, so the checked-in device test
could not execute. This environment limitation does not establish the P1; the
collision follows directly from the accepted production data and complete
native scheduling path. Physical-device testing of terminated delivery,
permission changes, reboot, and time-zone changes remains required.

## Independent end-to-end exercise

Fresh isolated live sessions at 1440×1000 and 390×844 covered:

- whitespace-only title rejection with an announced error and successful
  in-dialog retry; HTML-like title text rendered literally;
- weekday recurrence, 5-minute repeat, 24-hour escalation, acknowledge, Undo,
  and the 180-minute snooze boundary (stored delta 180.0005 minutes);
- reload persistence, overnight quiet hours (`23:59`–`00:01`), missing-time
  validation/recovery, export download, valid import replacement confirmation,
  malformed JSON rejection without data loss, and delete cancel/confirm;
- the normal three-active free boundary and its actionable fourth-reminder
  error, followed separately by the import bypass above;
- keyboard opening/closing, Add and Edit focus restoration after the next
  animation frame, visible focus, and no traps;
- invalid license restore (`That license is not active.`), checkout
  availability, and query-token capture with immediate URL stripping.

Normal and recovery paths produced no console or page errors. The factory
`verify-url.sh` returned HTTP 200 in 902 ms with title, `lang=en`, exactly one
`h1`, a main landmark, no missing image alternatives, no unnamed buttons, and
zero load errors. Visual inspection confirmed the cassette-zine thesis remains
clear and product-specific at both widths.

## Accessibility, privacy, PWA, and browser policies

- Axe found 0 serious/critical findings in empty and populated/dialog states
  at both viewport sizes.
- The focused primary control used a 4 px `#F3C84B` outline with 3 px offset.
  All visible controls measured at least 44×44 CSS px; 390 px had no horizontal
  overflow.
- Reduced-motion matched and reduced transition/animation duration to 0.01 ms
  with automatic scrolling.
- Fresh live installs were controlled by `/sw.js` with `cal-v5-shell`. Offline
  reload retained imported data, kept `Offline · still working` visible, and
  kept Add enabled.
- A controlled version change to a copy of the production artifact installed
  a new cache, displayed `An update is ready. Reopen the app to use it.`, and
  reloaded offline without errors.
- Ordinary use contacted only the product origin. Invalid-license restore
  added only `https://api.sociobot.in`. Source/runtime review found no
  analytics, ads, trackers, remote fonts, or third-party scripts.
- Privacy and Terms accurately cover local IndexedDB, license localStorage,
  unencrypted exports, permissions, billing, and deletion.
- HTTP redirects to HTTPS. Live responses include HSTS, CSP,
  Permissions-Policy, `nosniff`, anti-framing, COOP/CORP, and strict-origin
  referrer policy. Hashed assets/APK are one-year immutable; `sw.js` is
  no-store; manifest and APK MIME types are correct.
- Production checkout returned HTTP 303 to hosted Dodo checkout. Invalid
  verification returned HTTP 200, `Cache-Control: no-store`, and
  `{ "valid": false, "reason": "invalid" }`.

## Deployment identity and performance

All 24 deployable files in a fresh `dist/` matched production byte-for-byte,
including HTML, JS/CSS, maps, service worker, legal pages, manifest, art, icons,
and signed APK. `staticwebapp.config.json` correctly returned 404. Root HTML
SHA-256 is
`2867679c8dff68340a9221fae7c863a67e95d35dfd7563c53da610dbb15e6e5a`.
The candidate is a documentation-only commit atop the deployed repair, so this
is exact static/native deployment identity evidence.

Fresh Lighthouse 13.4.1 results:

| Profile | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile, median of 3 | 93 | 100 | 100 | 100 | 1.37 s median | 1.52 s median | 301 ms median | 0 |
| Desktop | 100 | 100 | 100 | 100 | 0.26 s | 0.34 s | 7 ms | 0 |

Mobile performance runs were 87/93/99 with TBT 515/301/129 ms; median meets
the ≥90 Lighthouse contract, while the spread is recorded rather than hidden.
The build ships 35,394 B JS (12.63 kB gzip), 12,471 B app CSS (3.59 kB gzip),
no font payload, and a 44,626 B mobile AVIF hero. Static payload, LCP, and CLS
budgets pass. Lab Lighthouse does not provide meaningful interaction INP.

## Required before re-verification

1. Reject or safely normalize duplicate reminder IDs on import, and replace
   Java `String.hashCode()` as the sole alarm/notification identity with a
   collision-safe persisted mapping. Add web and Android collision regressions.
2. Preserve imported data while enforcing/explaining the three-active free
   limit so import cannot silently unlock paid capacity.
3. Make the repository-level instrumentation task dependency-clean and add a
   documented device-test command; run it on physical API 23 and current-API
   devices through alarm delivery, acknowledgement, reboot, and time changes.
