# Independent product verification — FAIL

Date: 2026-08-28

Work order: `critical-alert-lane-verify-3`

Candidate: `e57594aedce04fa7c2e214ce942c719960ea8cce`

Production URL: <https://critical-alert-lane.sociobot.in>

## Verdict

**FAIL.** This is not the earlier deployment-only failure. The signed Android
APK is now downloadable from production, production checkout is enabled, and
the live static app matches the candidate build. However, the native Android
quality gate fails and identifies unguarded APIs newer than the declared
minimum Android version in the core alarm path. Android 6–11 can reach an API
31-only call while arming every reminder, and Android 6 also uses an unsupported
date pattern. Invalid quiet-hour input also raises an uncaught page error with
no announced explanation, and the reminder editor loses keyboard focus when it
closes.

## Defects

### P1 — Native scheduling can fail on supported Android 6–11 devices

The APK declares `minSdkVersion 23`, but
`ReminderScheduler.schedule()` evaluates
`alarms.canScheduleExactAlarms()` unconditionally before passing its result to
`usesExactAlarm()`. `AlarmManager.canScheduleExactAlarms()` was added in API
31. The intended version check is inside the later helper and therefore cannot
protect evaluation of the API 31 call.

Fresh `./gradlew lintDebug` evidence:

```text
ReminderScheduler.java:140: Error: Call requires API level 31
(current min is 23): android.app.AlarmManager#canScheduleExactAlarms [NewApi]
```

The shipped signed APK was independently decompiled with `apkanalyzer`; its
`schedule()` bytecode likewise invokes the synthetic
`AlarmManager.canScheduleExactAlarms()` bridge before `usesExactAlarm(IZ)`.
Thus this is in the published artifact, not only the source tree. A reminder
sync can throw linkage failure on API 23–30 instead of arming the advertised
background alarm.

The same lint run found a second supported-version error:

```text
ReminderScheduler.java:178: Error: pattern character 'X' requires API 24
(current min is 23): "yyyy-MM-dd'T'HH:mm:ss.SSSX" [NewApi]
```

On API 23, the native timestamp parser used before scheduling is unsupported.
The host unit tests exercise the pure `usesExactAlarm()` decision but never
execute `schedule()` or `parseTime()` on an old Android runtime, so their pass
does not cover either failure.

### P1 — The available Android lint gate fails with four errors

`ANDROID_HOME=/tmp/critical-alert-android-sdk ./gradlew lintDebug --no-daemon`
ended `BUILD FAILED`: **4 errors, 22 warnings**. In addition to both `NewApi`
errors above, lint reports:

- `MissingPermission` at the final notification `notify()` call. Permission is
  checked by a helper, but the delivery call neither carries a recognized
  permission contract nor handles a possible `SecurityException` if permission
  changes between check and delivery.
- `ProtectedPermissions` on `SCHEDULE_EXACT_ALARM`. This needs resolution or a
  documented, narrowly scoped suppression appropriate to the app's special
  alarm-access flow; the release currently has neither.

Because Android is the artifact class and lint is an available repository
quality check, a failing lint gate independently prevents a PASS.

### P2 — Blank quiet-hour input produces an uncaught error without feedback

In production, open Settings, clear the Start time, and activate **Save quiet
hours**. The time inputs are not required and have no form-level validation.
`saveSettings()` mutates in-memory state, then IndexedDB validation rejects it.
Observed result:

```json
{
  "pageerror": "The quiet-hour settings in this file are invalid.",
  "settingsDialogStillOpen": true,
  "inlineErrors": 0,
  "toast": ""
}
```

Entering a valid time and submitting again does recover and displays `Quiet
hours saved.`, but the invalid submission violates the required actionable,
announced error path and the no-page-errors criterion.

### P2 — Closing the reminder editor loses keyboard focus

Keyboard-opening **Add critical reminder** correctly focuses the title input.
After Escape, `document.activeElement` is `BODY`, not the invoking Add button.
The editor re-renders and destroys its opener before `showModal()`, so native
dialog focus restoration has no element to return to. The Settings dialog does
return focus correctly. This fails the attached screen-reader/dialog focus
management baseline.

### P2 — The released APK embeds a second signed APK

The 7,015,504-byte published APK contains
`assets/public/downloads/critical-alert-lane-1.0.1.apk`, a complete 3,706,106-
byte signed APK. Its SHA-256 is
`eeea59f7a273bf6f96abc58c35fc93ca47173f2c2dea415c6645d1a6476d11bd`.
The installed app's embedded page points its Android download button at this
nested package and prints that nested digest, while the actual distributed APK
digest is `da3a5cba3714a2be537e09ab186aadc35cc45bf3aab3586c641130916db62cbc`.
This unnecessary recursive packaging more than doubles the base artifact and
means the native web bundle is not the same page users receive at the live URL.

## Clean checkout and automated gates

The initial worktree was clean. `HEAD` and `origin/main` both resolved to the
exact candidate before installation.

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 148 packages, 0 audit vulnerabilities |
| `npm test` | PASS; 10/10 Vitest tests |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS; repository script is TypeScript no-emit |
| `npm run build` | PASS; exact documented build produced `dist/` |
| `npm run test:e2e` | PASS; 20/20 Chromium desktop/mobile cases |
| `npm run android:sync` | PASS; candidate remained git-clean |
| `./gradlew test assembleDebug --no-daemon` | PASS with JDK 21 / SDK 35; 8 unique host tests passed in both debug and release variants, and debug APK assembled |
| `./gradlew lintDebug --no-daemon` | **FAIL; 4 errors, 22 warnings** |

The fresh debug APK was 11,655,775 bytes, SHA-256
`2c04110512bbfc98ece5be60026d8c07df49161201cded80e10297ee766244b7`.
The production APK is 7,015,504 bytes and verifies under Android signature
schemes v1 and v2 with signer `CN=Sociobot Factory Android Signing`. `aapt`
confirmed package `in.sociobot.criticalalertlane`, version `1.0.1` / code 2,
min SDK 23, target/compile SDK 35, and only Internet, notification, exact-alarm,
boot, plus AndroidX's app-scoped dynamic-receiver permission. No contacts,
calendar, location, camera, or microphone permission is present.

An Android 15 x86_64 emulator was provisioned for a runtime smoke test. With no
`/dev/kvm`, software emulation briefly reached ADB but exited after the image
required a 6 GB userdata resize beyond usable worker space. Device lifecycle
testing therefore remains unavailable; the native compatibility findings are
from Android lint, source inspection, and decompilation of the shipped APK.

## Independent end-to-end exercise

The live product was exercised independently at 1440×1000 and 390×844:

- Created a due weekday reminder containing literal HTML-like text; selected
  the 5-minute repeat and 24-hour escalation boundaries. Content rendered as
  text, not markup.
- Snoozed for the 180-minute boundary and verified persistence after reload;
  acknowledged, used Undo, and observed immediate live-region feedback.
- Reached the three-active-reminder free boundary and received the documented
  inline error on a fourth reminder.
- Saved overnight quiet hours (`23:59`–`00:01`), exported version-1 JSON, and
  imported a valid weekly/60-minute/24-hour-boundary backup after confirmation.
  Reload preserved the replacement data.
- Malformed JSON and corrupt reminder/settings schemas were rejected without
  replacing the three saved reminders. Whitespace titles were also covered by
  the passing repository E2E test. The quiet-hour defect above was reproduced
  separately rather than hidden by these passing cases.
- The first Tab reaches the skip link; Enter/Space paths work; focus styling is
  a visible 4 px signal-yellow outline with 3 px offset. No keyboard trap was
  observed. No visible interactive target measured below 44×44 CSS px, and no
  horizontal overflow occurred at 390 px.
- `prefers-reduced-motion: reduce` produced effectively instant 0.01 ms
  transitions/animations and automatic scrolling.

Across initial, editor-dialog, and populated states at both sizes, Axe found
zero serious or critical issues. Normal flows produced zero console/page
errors. The factory `verify-url.sh` reported HTTP 200, 977 ms load, title,
`lang=en`, exactly one `h1`, a main landmark, zero missing image alts, zero
unnamed buttons, and no load errors. Desktop/mobile screenshots were visually
reviewed against `.factory/design.md`; the product-specific cassette-zine
layout remains clear and responsive.

## PWA, privacy, and commerce

- The production service worker controlled the page with `cal-v4-shell`; after
  going offline, reload retained three saved reminders, the visible `Offline ·
  still working` state, and an enabled Add action.
- A controlled local production-artifact update changed the worker cache
  version. The new worker installed, displayed `An update is ready. Reopen the
  app to use it.`, and the updated app reloaded offline with no errors.
- Manifest fields and 192/512/maskable icons are present with correct actual
  dimensions, standalone display, versioned start URL, and design-token theme/
  background colors.
- Normal product use requested only the production origin. Restoring an invalid
  license added only `https://api.sociobot.in`, returned HTTP 200, and showed
  `That license is not active.` Repository/runtime inspection found no
  analytics, ads, tracking pixels, remote fonts, or third-party scripts.
- Production checkout returned HTTP 303 to Dodo hosted checkout. The public
  live catalogue lists `Critical Alert Lane Unlimited`, USD 499 minor units,
  and the correct return product URL. Invalid license verification returned
  `{ "valid": false, "reason": "invalid" }` with `Cache-Control: no-store`.
- Privacy and Terms accurately cover local IndexedDB, unencrypted exports,
  permissions, billing/license storage, deletion, and limitations.

## Deployment identity, policies, and budgets

Twenty-four public files from a fresh `dist/` build matched production
byte-for-byte, including HTML, hashed JS/CSS, source maps, service worker,
manifest, legal pages, art, icons, and the APK. `staticwebapp.config.json` is
deployment configuration and correctly returned 404 rather than being served.
Root HTML SHA-256:
`736d4c9ffb21dac5e7762800e255a3522023e2882d70bb5060b79c8b27a5bdaf`.

HTTP redirects to HTTPS. Production supplies HSTS, CSP, Permissions-Policy,
`nosniff`, anti-framing, COOP/CORP, and strict-origin referrer policy. Hashed
JS/CSS and the APK use one-year immutable caching; `sw.js` is no-store; the web
manifest has `application/manifest+json`; the APK has
`application/vnd.android.package-archive`.

Fresh Lighthouse 13.4.1 results:

| Profile | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | 96 | 100 | 100 | 100 | 1.15 s | 1.30 s | 230 ms | 0 |
| Desktop | 100 | 100 | 100 | 100 | 0.29 s | 0.33 s | 8 ms | 0 |

Lab Lighthouse does not provide meaningful INP without field interactions;
the exercised interactions showed no long-task symptom. The production build
ships 34,407 B JS (12.33 kB gzip), 12,471 B app CSS (3.59 kB gzip), no font
payload, and a 44,626 B mobile AVIF hero, all within the contract budgets.

## Required before re-verification

1. Guard every API 31 exact-alarm call before evaluation and replace or guard
   the API 24 timestamp pattern; add API 23 and API 30 runtime tests around the
   real scheduling path, not only the pure policy helper.
2. Resolve all Android lint errors and make Android lint an explicit project
   quality gate.
3. Validate required quiet-hour values before mutating state, and provide an
   inline announced error with recovery and no uncaught exception.
4. Preserve and restore the Add/Edit button focus when the reminder dialog
   closes.
5. Exclude the downloadable APK from Capacitor web assets (and hide the web APK
   download control in the native shell), then rebuild/sign a non-recursive
   release APK and run reminder/permission/reboot/time-zone flows on devices at
   the minimum and current API levels.
