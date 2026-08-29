# Independent product verification 9 — FAIL

Date: 2026-08-29

Work order: `critical-alert-lane-verify-9`

Candidate: `192eda6c88f2768dd80e2142fb5b8215a36e6dab`

Production: <https://critical-alert-lane.sociobot.in>

## Verdict

**FAIL. Do not release this candidate.** The deployed web/PWA is healthy,
matches the candidate's fresh `dist/` byte-for-byte, and passes every declared
claim after the web and Android toolchains are provisioned. The published
Android artifact does not contain the candidate application, however. The
signed v1.0.3 APK embeds the exact native web build from older commit
`bfe2ef1`, before the demo and rolling-score repairs. Direct execution of the
APK's embedded UI reproduces a release-blocking 30-day score error and has no
one-click sample-data entry point.

This is a stale-artifact failure, not a deployment-only failure.

## Release-blocking defect

### P1 — The published Android APK is from an older product commit

The live page links
`downloads/critical-alert-lane-1.0.3.apk` and displays SHA-256
`06382ba158e7cd4a28222e14a81174150b574daabe17af9be62cac91213e3c16`.
The downloaded file is 3,676,178 bytes and matches that digest, but its embedded
application is not candidate `192eda6`:

- `git log -- public/downloads/critical-alert-lane-1.0.3.apk` shows that the
  APK was last changed by `bfe2ef1`.
- A clean native build of `bfe2ef1` produced
  `assets/app-CBhz1Bb_.js`, `assets/app-BPCA9V18.css`,
  `assets/legal-ZpdOFDBE.css`, `index.html`, and `sw.js` byte-for-byte identical
  to those five files inside the signed APK.
- The APK contains service worker `cal-v6`; candidate `192eda6` contains
  `cal-v8`.
- The APK contains 22 public files. The candidate's freshly synced native
  bundle contains 26 and adds `/demo/index.html`, `/404.html`, the social
  preview, and the current application bundles.
- Candidate native JS is `main-DnYDl98e.js` with SHA-256
  `95d66a04a3415045e95c195f0b3239fe463c635dd17aa99b61ac06143b091b47`.
  The signed APK instead contains old `app-CBhz1Bb_.js` with SHA-256
  `bf9b06e2fef1af34b1c6e9816101bdd57e5a96b36d9de223fb647418cf3baf60`.

I extracted and served only `assets/public/` from the signed APK in a fresh
browser context. Its first screen says **REMINDERS THAT WAIT FOR AN ANSWER**,
has no **Try it with sample data** or **Load sample project** action, and the
embedded `/demo/` path returns 404. This violates the mobile demo contract.

In that same extracted APK runtime, I imported a valid backup containing no
reminders and one acknowledgement from 31 days ago. It displayed:

```text
0% HANDLED IN TIME
0 of 1 acknowledged reminders were handled inside their escalation window.
```

The latest-30-days score must exclude that entry. This is the exact defect
fixed in source after the APK was signed, and it directly affects the brief's
success measure.

The current claim suite cannot detect this mismatch: Android behavior tests
compile current source, while `@claim:apk-download` checks only the APK's size
and advertised digest. Rebuild and sign a version-bumped APK from this
candidate, update the download and digest, and add a gate that compares or
executes the signed APK's embedded app against the candidate native bundle.

## Mandatory first-read and demo gate

**PASS for the live web page.** A cold 1440×900 context showed:

- what it does: **Keep critical Android reminders repeating.**
- who it is for: Android users overwhelmed by notifications;
- what to do first: **Try it with sample data**.

The action is visible without scrolling at both 1440×900 and 390×844. One
click opens `/demo/` with three realistic reminders and **Take evening
medicine** already due. The persistent banner says **Demo — sample data,
nothing is saved** and offers **Reset demo** and **Start for real**.

The shipped APK itself fails the attached mobile demo requirement as described
above.

## Claims gate

As required, all 14 commands in `.factory/claims.json` were invoked before any
other repository inspection. In the untouched clone they could not start
because dependencies were not installed. After `npm ci`, all browser claims
passed. The two Android commands then reported the worker's absent JDK/SDK;
after provisioning OpenJDK 21 and official Android API 35 outside the repo,
the unchanged commands passed.

| Claim | Result | Evidence |
| --- | --- | --- |
| `offline-reload` | PASS | 2/2 desktop/mobile Playwright cases |
| `safe-import` | PASS | 2/2; duplicate and Java-hash collision repair |
| `free-limit` | PASS | 2/2; fourth active import preserved and paused |
| `local-private` | PASS | 2/2; ordinary demo flow stayed same-origin |
| `repeat-until-handled` | PASS | 2/2; repeat, snooze, reset, acknowledge |
| `demo-isolation` | PASS | 2/2; real/demo separation and every exit path |
| `data-portability` | PASS | 2/2; versioned export and confirmed replacement |
| `rolling-score` | PASS in source | 2/2; 29-day kept and 31-day removed after reload |
| `schedule-and-undo` | PASS | 2/2; all schedules and Undo |
| `quiet-hours` | PASS | 2/2; due alert remains visible while muted |
| `native-background-repeat` | PASS in source | Robolectric; five-minute native repeat re-armed |
| `lifecycle-recovery` | PASS in source | Robolectric; boot, clock, and time-zone recovery |
| `apk-download` | PASS as written | 2/2; linked bytes match displayed digest |
| `one-time-license` | PASS | 2/2; recorded verification unlocks four reminders |

Final manifest result in a provisioned environment: **14/14 pass**. The stale
APK finding shows that the manifest lacks an artifact/source identity claim.

## Clean checkout and automated gates

The checkout began clean. `HEAD`, `main`, `origin/main`, and the requested SHA
all resolved to `192eda6c88f2768dd80e2142fb5b8215a36e6dab`.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 148 packages; 0 vulnerabilities |
| `npm test` | PASS — 17/17 Vitest tests |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — exact production `dist/` created |
| `npm run test:e2e` | PASS — 46/46 desktop/mobile Chromium tests |
| `npm run test:update` | PASS — `cal-v8` update detected; updated demo reloaded offline |
| `scripts/verify-url.sh` | PASS on local and live root, demo, privacy, and terms |
| `npm run test:android:claim` | PASS after JDK/API 35 provisioning |
| `npm run test:android:lifecycle-claim` | PASS after JDK/API 35 provisioning |
| `npm run test:android` | PASS — unit tests, lint, debug APK, and Android-test APK |
| `npm run test:android:instrumentation` | PASS — test APK assembly; not device execution |

Android debug and release variants each ran 14 host tests with no failures or
errors. The fresh candidate debug APK is 5,906,996 bytes with SHA-256
`86ee3f87d300732584a37adc9f6f82711c0ff285bb39d4eb5ac4beb743b3fcd4`.

## Independent live exercise

Fresh desktop contexts covered:

- sample snooze at the 180-minute boundary and persistence after reload;
- acknowledgement and Undo;
- JSON export of all three samples;
- malformed JSON rejection while preserving all three reminders;
- empty quiet-hour input, announced error/focus, then recovery with an
  overnight `23:59`–`00:01` range;
- blank-title rejection and in-dialog recovery;
- a due daily reminder at the five-minute repeat and 24-hour escalation
  boundaries;
- literal rendering and persistence of HTML-like title/note input, with no
  injected element or script execution.

The repository suite additionally exercised duplicate/hash-colliding IDs, the
three-active free limit, every schedule type, demo exit isolation, and a paid
fixture entitlement surviving reload. No console or page errors occurred in
the independent live flows.

## Accessibility and responsive behavior

- Axe found zero serious/critical findings on the populated live demo, editor,
  Settings, and 390×844 demo.
- Keyboard traversal began with the skip link and continued through demo
  controls, brand, Settings, add, APK, acknowledge, snooze, and row actions.
- Every focused control had a visible 4 px yellow outline, 3 px offset, and
  dark separation. Enter opened the editor, focus moved to its title, Escape
  closed it, and focus returned to the opener.
- At 390×844, document and body width remained 390 px. All 19 visible
  interactive targets measured at least 44×44 CSS px.
- Reduced motion produced 0.01 ms transitions/animations and `scroll-behavior:
  auto`.
- Live route structure has `lang="en"`, one `<h1>`, one `<main>`, route-specific
  titles, and valid image alternatives.

## Privacy, network, server policy, and links

- Nine requests during the ordinary create/export/error/snooze/acknowledge
  demo exercise were all same-origin. No analytics, tracking, CDN font, ad, or
  unrelated third-party request appeared.
- APK inspection found only Internet, notification, exact-alarm, boot, and the
  AndroidX app-scoped receiver permission. There are no contacts, calendar,
  camera, microphone, or location permissions.
- The billing verification endpoint allowed 30 invalid requests from one
  client. Request 31 returned HTTP 429 with `Retry-After: 4` and the expected
  CORS origin.
- Checkout returned the expected HTTP 303 hosted Dodo checkout redirect.
- All discovered HTTP links returned 200, except checkout's intentional 303.
- HTTP redirects to HTTPS. Production sends HSTS, CSP with response-header
  `frame-ancestors 'none'`, Permissions-Policy, `nosniff`, DENY framing, COOP,
  CORP, and strict-origin referrer policy.
- Hashed assets and the APK are one-year immutable. `sw.js` is no-store; HTML
  and the manifest use five-minute revalidation. Unknown routes return the
  designed 404 with HTTP 404.

## Deployment identity, PWA, APK, and budgets

- All 32 publicly served files from fresh candidate `dist/` match production
  byte-for-byte. `staticwebapp.config.json` is correctly not publicly served.
- A fresh live service worker controlled `/demo/` with `cal-v8-shell`; the
  populated demo reloaded offline at 390 px. The update test installed a
  changed worker and reloaded its updated shell offline.
- Production JS is 39,907 bytes raw / 14,124 bytes gzip. App CSS is 13,323
  bytes raw / 3,759 bytes gzip; legal CSS is 756 bytes gzip. There are no font
  files. The selected hero AVIF is 44,626 bytes. Static budgets pass.
- Fresh Lighthouse 13.0.1: mobile 97 performance, 100 accessibility, 100 best
  practices, 100 SEO; FCP 1.05 s, LCP 1.32 s, TBT 207.5 ms, CLS 0. Desktop was
  100/100/100/100; FCP 0.34 s, LCP 0.40 s, TBT 32.5 ms, CLS 0.
- The signed APK verifies under v1/v2/v3 with signer certificate SHA-256
  `f6a9ca54d7385c9d005b81de047d4937f6c447602e9fa8194cf0f870fc53265c`.
  It is package `in.sociobot.criticalalertlane`, version 1.0.3/code 4, min SDK
  23, target/compile SDK 35.

No Android device or `/dev/kvm` is available, so the assembled instrumentation
APK could not be executed on hardware/emulator. That limitation does not
affect the stale-APK finding, which is proven from the signed artifact's own
embedded files and runtime.

## Required before re-verification

1. Build and sign a version-bumped APK from the accepted candidate, replace
   the published download, and update its visible digest.
2. Verify the signed APK contains the candidate native bundle and demo route.
3. Run the 31-day rolling-score and first-run sample-data checks against the
   signed APK artifact, not only against current source/build output.
4. Install the rebuilt APK on physical API 23 and current-API devices for a
   terminated-app notification, reboot, clock-change, and time-zone smoke test.
