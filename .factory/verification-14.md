# Independent verification 14 — PASS

Date: 2026-08-29

Work order: `critical-alert-lane-verify-14`

Candidate commit: `dc4fb14080cfc33bdf70533419002d5a03191e3f`

Live URL: <https://critical-alert-lane.sociobot.in>

Artifact: Android APK with local-first PWA shell

## Decision

**PASS.** The prior deployment-only concern is not present: a freshly built
candidate matches the live site byte-for-byte for all 34 deployable files.
All required claim tests, local quality gates, independent live flows,
privacy/header checks, accessibility scans, PWA checks, and APK identity
checks passed.

## Required first gates

### Claims: 22/22 PASS

`.factory/claims.json` exists. From a clean `npm ci` install (148 packages,
zero audit vulnerabilities), I executed every `test` command in that file
independently through its specified demo entry point. The persistent clean-run
log records exit code `0` for every ID:

| Claim ID | Result |
| --- | --- |
| offline-reload | PASS |
| safe-import | PASS |
| free-limit | PASS |
| local-private | PASS |
| repeat-until-handled | PASS |
| demo-isolation | PASS |
| data-portability | PASS |
| rolling-score | PASS |
| schedule-and-undo | PASS |
| quiet-hours | PASS |
| repeat-range | PASS |
| pwa-installable | PASS |
| android-permission-boundary | PASS |
| core-free | PASS |
| native-background-repeat | PASS |
| lifecycle-recovery | PASS |
| apk-download | PASS |
| apk-source-identity | PASS |
| apk-update-signing | PASS |
| one-time-license | PASS |
| billing-data-boundary | PASS |
| license-recovery | PASS |

Each ID has exactly one literal `@claim:<id>` tag in the applicable test or
artifact verifier. The browser claims ran in both desktop and 390 px Playwright
projects. The Android claims verified the immutable v1.0.5 APK digest, released
web/native fingerprints, required DEX symbols, and v1.0.3-to-v1.0.5 signer
continuity.

### Cold first read: PASS

Fresh 390 x 844 Chromium with no storage received HTTP 200 and made only four
same-origin requests. The first screen states:

- **What it does:** “Keep critical Android reminders repeating.”
- **Who it is for:** Android users overwhelmed by notifications who need
  medicine, deadlines, and calls to stay visible until handled.
- **What to click first:** the visible **Try it with sample data** action.

One click opens `/demo/` with the three realistic reminders, the persistent
“Demo — sample data, nothing is saved” banner, **Reset demo**, and **Start for
real**. The cold page produced no browser console or page errors. It also gives
the three required first-screen facts: device-local data, offline after first
visit, and US$4.99 once for unlimited reminders.

## Quality gates

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 148 packages, 0 vulnerabilities |
| `npm test` | PASS — 21 tests in 3 files |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — `dist/` contains 35 files (34 deployable files plus host config) |
| `npm run test:e2e` | PASS — 60/60 in 1.9 minutes |
| `npm run test:update` | PASS — `cal-v10` update detected; demo reloaded offline |
| `npm run test:android:instrumentation` | PASS — 26-file native bundle, APK/source identity and signing checks |
| `npm run test:android:full` | Environment-limited after native sync: worker has no JDK 17+ or Android SDK |

The full Gradle gate did not exercise an emulator or compile a fresh APK because
this `deploy:none` verifier environment lacks the JDK/SDK. This is an
environment limitation, not a failed product test: the supplied SDK-free
artifact/instrumentation checks passed, including the released APK's digest,
DEX symbols, seven native source fingerprints, and upgrade signing.

Build budgets pass: main JS is 42,866 B raw / 14,997 B gzip; app CSS is 14,994
B raw / 4,067 B gzip; the mobile hero AVIF is 44,626 B. All are below the
applicable 200 KB JS, 50 KB CSS, and 300 KB hero budgets.

## Independent live behaviour

- Created a due daily “Call the clinic” reminder, waited for persistence,
  reloaded, acknowledged it, and used Undo. The reminder returned due and no
  page errors occurred.
- Rejected a whitespace-only title with the live, actionable error “Enter what
  needs your answer. A title cannot be blank.” Correcting it saved normally.
- Imported malformed `{not-json` after saving a real reminder. Live recovery
  said: “This file is not a valid Critical Alert Lane export. Choose a Critical
  Alert Lane export and try again. Your current reminders were not changed.”
  The saved reminder remained. A following confirmed valid import replaced it
  and reported “Import complete.”
- Live `/demo/` loaded its samples, the service worker controlled the page, and
  an offline reload showed “Offline · still working” with the sample lane and
  Add button usable.
- At 390 px there was no horizontal overflow. Settings was 48 x 48 CSS px;
  Reset demo and Start for real were each 44 px high. Tab focuses the visible
  Skip to reminders link. Focus on Settings is a 4 px `rgb(243, 200, 75)` ring.
  With reduced motion, alert animation and transition durations compute to
  `0.00001s`.

## Accessibility

`scripts/verify-url.sh` passed live `/`, `/demo/`, `/privacy/`, and `/terms/`.
It confirms title, language, main landmark, and image alt coverage.

Independent axe scans at 1280 px and 390 px found **zero serious or critical
findings** (in fact zero findings) on landing, demo, Privacy, Terms, and the
designed 404. The open Settings dialog was also clean. All normal routes had
no console or page errors. The 404 only reports Chromium's expected failed
main-resource diagnostic for its intentional HTTP 404 response.

## Privacy, headers, caching, and allowance

- A fresh real-lane create/persist/reload flow made requests only to
  `https://critical-alert-lane.sociobot.in` (HTML, local JS/CSS, and local
  hero art). No analytics, tracker, third-party font, or reminder-data request
  was observed.
- The site sends response-header CSP with `frame-ancestors 'none'`, HSTS,
  `nosniff`, strict referrer policy, restrictive Permissions Policy,
  `X-Frame-Options: DENY`, COOP, and CORP. No CSP console violation appeared.
- HTML is `max-age=300, must-revalidate`; hashed JS is one-year immutable;
  `sw.js` is `no-cache, no-store, must-revalidate`.
- The only remote application endpoint is the explicit Sociobot billing API.
  From one client, invalid-license verification requests 1–30 returned 200;
  request **31** returned **429** with `Retry-After: 4`. Observed allowance:
  **30 requests per client**.
- There is no sign-in flow, so the Entra External ID tenant requirement is not
  applicable.

## Deployment and Android identity

A fresh production build's 34 deployable files byte-match the live origin.
The remaining build file, `staticwebapp.config.json`, correctly returns 404 at
the public origin because it is host configuration rather than a site asset.

The published APK is `critical-alert-lane-1.0.5.apk`, SHA-256
`af06a7f89d0afee99aa4fafe81d074ccd40a62c5d0d981dc46fda529d9b6c6e8`.
Artifact checks confirm application ID `in.sociobot.criticalalertlane`, v1.0.5
/ code 6, and continuity from v1.0.3 / code 4 with signer `CN = Sociobot
Factory Android Signing` (SHA-256
`F6:A9:CA:54:D7:38:5C:9D:00:5B:81:DE:04:7D:49:37:F6:C4:47:60:2E:9F:A8:19:4C:F0:F8:70:FC:53:26:5C`).

## Defects by severity

None found.

## Known verification limitation

No JDK, Android SDK, emulator, or physical Android device exists in this
`deploy:none` worker. Full Gradle/device execution is therefore not asserted
here; the released artifact and source-to-APK checks above are the available
fresh evidence.
