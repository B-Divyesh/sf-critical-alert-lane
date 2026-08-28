# Independent verification — FAIL

Date: 2026-08-28
Verifier work order: `critical-alert-lane-verify-1`
Candidate: `24da88c1f25c64e24771be0ee9182a939bf700d1`
Production URL: <https://critical-alert-lane.sociobot.in>

## Verdict

**FAIL.** The deployed static PWA is healthy and matches the candidate, but
the candidate does not deliver the researched product's core Android job: a
reminder must repeat until acknowledged when the Android app is not open.
The native project is only a Capacitor `BridgeActivity`; it contains no local
notification/alarm implementation and declares neither Android notification
nor exact-alarm permission. This is a release blocker, not a deployment-only
failure.

## Blocking defects

### P0 — Android reminder delivery ends when the web view is not running

Evidence:

- `android/app/src/main/java/in/sociobot/criticalalertlane/MainActivity.java`
  is only `class MainActivity extends BridgeActivity {}`.
- `android/app/src/main/AndroidManifest.xml` declares only `INTERNET`; it has
  no `POST_NOTIFICATIONS`, exact-alarm, boot receiver, alarm receiver, or
  local-notification declaration.
- A repository-wide Android search found no alarm, notification, exact-alarm,
  WorkManager, receiver, or Capacitor local-notification code. Dependencies
  contain only Capacitor core and Android.
- The only scheduling in `src/main.ts` calls `checkNotifications()` at startup,
  when the document becomes visible, and from a 30-second `window.setInterval`.
  It therefore cannot execute after the web view/app is terminated. The README
  itself describes this limitation.

This fails the brief's smallest useful product (Android, on-device recurring
critical reminders with repeat-until-acknowledged behavior) and its Android
permission constraint.

### P1 — Import accepts structurally corrupt reminder data

`validateData()` only checks that a reminder has a string title and parseable
`nextAt`. A manual import with `recurrence: "not-a-recurrence"`,
`repeatMinutes: -1`, `escalationMinutes: 0`, malformed timestamps, and invalid
quiet-hour values was accepted after confirmation with the toast `Import
complete.` The resulting UI rendered `undefined · repeats every -1 min until
handled`. This is an invalid-input/data-integrity failure for the advertised
backup/restore path.

### P2 — Production response policy and caching gaps

- The HTML, hashed JS, AVIF, and service worker all return
  `cache-control: public, must-revalidate, max-age=30`; hashed static assets
  are not immutable/long-lived as required by the performance contract.
- `/manifest.webmanifest` is served as `application/octet-stream`, not a web
  manifest content type.
- The live document has no `Content-Security-Policy`, `Permissions-Policy`,
  `X-Frame-Options`, COOP, or CORP header. Existing HSTS, `nosniff`, and
  `strict-origin-when-cross-origin` are present.

## Checks that passed

### Clean local candidate

- Began from a clean worktree at exactly
  `24da88c1f25c64e24771be0ee9182a939bf700d1`; `origin/main` resolved to the
  same commit.
- `npm ci`: passed; audit reported 0 vulnerabilities.
- `npm test`: passed, 8/8 tests.
- `npm run build`: passed (`tsc --noEmit` plus Vite); produced `dist/`.
  No separate lint command is defined in `package.json`.
- `npm run test:e2e`: passed, 8/8 Chromium desktop/Pixel-5 tests.
- Production Lighthouse against the local production preview: Performance 98,
  Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.8 s,
  CLS 0, TBT 140 ms.
- Initial app bundle is 23,314 B (8,240 B gzip), CSS is 11,802 B (3,459 B
  gzip), no font payload is shipped, and the LCP AVIF is 44,626 B. All are
  within the stated static-product budgets.

### Independent browser exercise

Against the local production preview, at 1440 px and 390 x 844 px:

- Created a due one-time reminder, selected the 5-minute repeat and 24-hour
  escalation boundaries, acknowledged it, used Undo, then snoozed it for one
  hour. Persistence/UI recovery completed without console or page errors.
- Rejected an invalid-date import with an explanatory live toast; verified the
  three-active-reminder free limit; checked no horizontal overflow.
- Enter opened both Add reminder and Settings from their focused buttons;
  Escape closed the editor. The focused primary button had a visible
  `rgb(243, 200, 75) solid 4px` outline with 3 px offset.
- `prefers-reduced-motion: reduce` has a dedicated stylesheet rule.
- Axe found 0 serious or critical violations at both sizes; page/console error
  capture was empty.

The malformed-import result above is deliberately listed as a failure rather
than treating the narrower invalid-date check as sufficient validation.

### Live deployment

- HTTPS root returned 200. The factory `verify-url.sh` check recorded title,
  `lang="en"`, exactly one `h1`, a main landmark, zero images without `alt`,
  zero unlabeled buttons, and zero browser errors (823 ms load in this worker).
- Desktop and 390 px live Chromium sessions had 0 Axe serious/critical issues,
  0 console/page errors, no horizontal overflow, and made requests only to
  `https://critical-alert-lane.sociobot.in` during initial use.
- After initial visit and service-worker control, a live 390 px session was
  put offline and reloaded. It displayed `Offline · still working` and the Add
  critical reminder action remained usable.
- SHA-256 comparisons found all 23 files in the locally built `dist/` matched
  the corresponding live deployment files, including HTML, JS/CSS, service
  worker, manifest, legal pages, icons, and art. Thus the live deployment is
  this candidate's static build.

### Android build attempt

`android/gradlew test assembleDebug` could not start because this verification
container has neither `JAVA_HOME` nor a `java` executable. No APK or native
unit-test result is available from this worker. This environmental limitation
does not alter the P0 source finding above; a suitable Android worker must run
the Gradle build after the native scheduling implementation is added.

## Required next steps

1. Implement and test native Android local notifications plus durable alarm
   scheduling/reconciliation (including reboot, timezone, Android 13+
   notification permission, and exact-alarm access where the chosen API needs
   it). Ensure repeats continue until explicit acknowledgement/snooze while
   the app is closed.
2. Validate every imported reminder, history record, and setting against the
   version-1 schema and allowed ranges before replacing local data.
3. Configure production MIME, immutable hashed-asset caching, and the missing
   response-security policies; then repeat live verification.
4. On an Android-capable worker, run `./gradlew test assembleDebug` and execute
   device/emulator notification lifecycle tests before requesting re-verification.
