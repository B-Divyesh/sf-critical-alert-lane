# Independent product verification — FAIL

Date: 2026-08-28

Work order: `critical-alert-lane-verify-2`

Candidate: `12dd4e5966342fb1ee4dc9334557aef870012d55`

Production URL: <https://critical-alert-lane.sociobot.in>

## Verdict

**FAIL.** The repaired source now contains a credible native alarm scheduler,
all repository test/build gates pass, and the deployed static PWA exactly
matches the candidate's web build. It is not nevertheless a complete deployed
Android product: a user arriving at the production URL cannot obtain the
native app, while the installable web build only checks reminders while open.
The advertised paid checkout is also disabled and returns HTTP 404. Additional
native acknowledgement and invalid-input defects prevent a PASS.

This is based on a fresh clean-candidate run. It does not repeat the earlier
verifier's obsolete finding that native scheduling code was absent; that code
is now present and builds.

## Defects

### P0 — Published product cannot deliver the closed-app Android job

The brief requires an Android reminder lane that repeats until acknowledgement.
The native implementation exists in source, but there is no installable Android
artifact or path to one in the shipped product:

- The live page exposes no APK/AAB/download link, and the repository/static
  artifact contains no shipped APK/AAB.
- `README.md` explicitly defers signing and APK production to a later work
  order.
- In the deployed browser/PWA, `isNativeAndroid()` is false. Settings says the
  web build checks only while open. Its timer lives in the page, and `sw.js`
  has no alarm, periodic-sync, push, or other closed-app scheduling handler.
- Installing the PWA therefore does not activate the native `AlarmManager`
  bridge. Closing it removes the only reminder polling loop.

The locally produced debug APK is useful build evidence, but is not a
user-accessible production artifact. The deployed target user cannot complete
the core job from the shipped URL.

### P1 — Advertised purchase path is disabled

Settings offers **Buy once · US$4.99** and links to the required Sociobot
endpoint. A fresh GET to that exact production URL returned:

```text
GET https://api.sociobot.in/api/v1/products/critical-alert-lane/checkout
HTTP/2 404
{"error":"enabled factory product","status":404}
```

The invalid-license verification endpoint is reachable and correctly returned
HTTP 200 with `{"valid":false,"reason":"invalid"...}`, so this is specifically
missing/disabled product registration rather than a general API outage. Users
cannot buy the advertised unlimited tier.

### P1 — Handling a reminder does not clear its native notification

The Android notification is posted with `setAutoCancel(false)` and the
reminder ID's hash as notification ID. Acknowledge, snooze, edit, disable, and
delete reconcile through `ReminderScheduler.replace()`, but that method only
cancels `AlarmManager` pending intents. There is no
`NotificationManager.cancel(id)` call anywhere in the native implementation.

After opening the app from a delivered notification and acknowledging or
snoozing, future repeats stop but the already shown alert remains until the
user separately dismisses it. That contradicts the explicit acknowledgement
model.

### P2 — Whitespace-only titles cause an uncaught error and broken recovery

On both 1440 px desktop and 390 px mobile, entering spaces in the required
title and submitting produced:

```text
pageerror: One or more reminders in this file are invalid.
```

The dialog stayed open, `#form-error` stayed empty, and a subsequent valid
submission could not succeed until reload. The handler trims the title,
mutates the in-memory reminder array, and only then reaches `saveData()` schema
validation. Persistence is not corrupted, but the primary flow has neither an
actionable error nor in-place recovery.

### P2 — Android 6–11 do not use the available exact-alarm API

The APK declares `minSdkVersion 23`, but `ReminderScheduler.schedule()` calls
`setExactAndAllowWhileIdle()` only on Android 12+ when exact-alarm access is
granted. Android 6–11 always receive `setAndAllowWhileIdle()`, even though the
exact variant is available there without the Android 12 permission gate.
Configured 5–60 minute timing can therefore be batched unnecessarily.

### P2 — Mobile hides offline state; links miss the 44 px target

- At 390 px, offline reload succeeded and saved data/add-reminder remained
  usable, but `Offline · still working` was invisible because
  `.network-state` is `display:none` below 760 px. The builder test only
  asserted that the hidden node was attached.
- Measured mobile hit-target heights were 30 px for the brand link, 25 px for
  Privacy and Terms, and 36 px for the Sociobot link (15 px on desktop). These
  miss the specified 44×44 CSS px baseline.

## Clean checkout and automated gates

The worktree was clean and both `HEAD` and `origin/main` resolved to the exact
candidate before installation.

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 148 packages, 0 audit vulnerabilities |
| `npm test` | PASS; 10/10 Vitest tests |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (the lint script is TypeScript no-emit) |
| `npm run build` | PASS; exact documented production build produced `dist/` |
| `npm run test:e2e` | PASS; 12/12 Playwright tests across desktop and Pixel 5 |
| `npm run android:sync` | PASS; native project remained git-clean |
| `npm run test:android` | PASS after provisioning JDK 21/SDK 35; Gradle `BUILD SUCCESSFUL`, native tests passed, debug APK assembled |

The debug APK is 5,018,968 bytes with SHA-256
`50a9d2d03d1f9d5f827026af31c6d4f538c3d9dd3579b1d048a7f3423c1df9fa`.
`aapt` confirmed package `in.sociobot.criticalalertlane`, min SDK 23, target/
compile SDK 35, and only Internet, notification, exact-alarm, and boot
permissions (plus AndroidX's app-scoped dynamic-receiver permission).
`apksigner` verified the expected debug v1/v2 signatures.

An API 35 x86_64 emulator was provisioned, but runtime launch could not begin:
the image required a 7,372.80 MB userdata partition while only 3,153.48 MB
remained, and `/dev/kvm` is absent. The APK was not device-executed here. The
notification-clearing defect is established directly by the complete native
code path, not inferred from this environmental limitation.

## Independent end-to-end exercise

Against the live site at 1440×1000 and 390×844:

- Created a due reminder containing HTML-like text and confirmed it rendered
  as text, using the 5-minute repeat and 24-hour escalation boundaries.
- Acknowledged, undid, snoozed for the 180-minute boundary, reloaded, and
  confirmed the snooze survived in IndexedDB.
- Saved quiet hours spanning midnight (`23:59`–`00:01`).
- Exported valid version-1 JSON, imported a valid three-reminder backup after
  confirmation, and confirmed the free `3 / 3` boundary rejected a fourth
  active reminder with an actionable inline message.
- Confirmed malformed/corrupt imports do not replace current data.
- Confirmed dialog focus entry, Escape close, keyboard activation, a visible
  `rgb(243, 200, 75) solid 4px` focus ring with 3 px offset, no horizontal
  overflow, and reduced-motion media-query activation.
- Confirmed state, offline data, and actions survive reload.
- A controlled service-worker version change installed and displayed
  `An update is ready. Reopen the app to use it.`

## Accessibility, privacy, and browser health

- Axe found zero serious/critical issues at both viewport sizes.
- Factory `verify-url.sh`: HTTP 200, 724 ms unthrottled load, zero initial
  console/page errors, title, `lang=en`, exactly one `h1`, a main landmark,
  zero missing image alts, and zero unnamed buttons.
- The invalid-title interaction is the page error documented above; clean load
  and normal paths produced none.
- Initial-use network observation saw only the production origin. Repository
  review found no analytics, ads, tracking pixels, remote fonts, or third-party
  scripts. IndexedDB holds reminders/history; localStorage is limited to the
  license token/verdict. The only programmed external runtime endpoint is the
  Sociobot billing API.
- Privacy and Terms pages describe local storage, unencrypted exports,
  permissions, billing, deletion, and network use.
- The product-specific visual system matches `.factory/design.md`; art
  provenance is recorded and desktop/mobile layouts were visually inspected.

## Deployment identity, policies, and budgets

All 23 publicly addressable files from fresh `dist/` matched live responses
byte-for-byte, including HTML, built JS/CSS, source maps, art, icons, manifest,
service worker, legal pages, robots, and sitemap. Root HTML SHA-256:
`d1178bc6b415adf8454709d6da3b49887f8883fbf3e1b8d3a1a0448dece53f71`.
The candidate changes documentation only, so matching its fresh build is the
strongest available static deployment identity. There is no deployed native
artifact/build identity to compare.

Live response policy passed:

- HTTP redirects to HTTPS; HSTS is present.
- CSP restricts scripts/assets to self and connections/forms to self plus the
  Sociobot API; Permissions-Policy disables sensitive browser capabilities.
- `nosniff`, `X-Frame-Options: DENY`, COOP, CORP, and strict-origin referrer
  policy are present.
- Hashed JS/CSS use `max-age=31536000, immutable`; `sw.js` uses
  `no-cache, no-store`; manifest MIME is `application/manifest+json`.

Fresh isolated Lighthouse 12.8.2 results:

| Profile | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | 100 | 100 | 100 | 100 | 1.18 s | 1.33 s | 65 ms | 0 |
| Desktop | 98 | 100 | 100 | 100 | 0.78 s | 0.81 s | 55 ms | 0 |

The build ships 33,762 B JavaScript (12,010 B gzip), 11,926 B app CSS
(3,480 B gzip), no font payload, and a 44,626 B mobile AVIF hero. All static
budgets pass. Lab Lighthouse does not report meaningful INP without user
interactions; the interaction exercise found no long-task symptom.

## Required before re-verification

1. Publish a signed/installable Android artifact and link it from the product
   URL, then test background/terminated delivery, repeats, quiet hours,
   acknowledgement, snooze, reboot, and time-zone recovery on a device.
2. Enable/register `critical-alert-lane` in production billing and smoke-test
   checkout return plus license verification.
3. Cancel posted native notifications when reminders are acknowledged,
   snoozed, disabled, or deleted, and add an Android integration test.
4. Validate the trimmed title before mutating state and show an announced,
   actionable field error without an uncaught exception.
5. Use exact alarms where supported on API 23–30, expose mobile offline state,
   and bring all interactive hit targets to at least 44×44 CSS px.
