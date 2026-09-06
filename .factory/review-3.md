# Review 3 — Repeat critical Android reminders until acknowledged

Date: 2026-09-06  
Work order: `critical-alert-lane-review-3`  
Live URL: <https://critical-alert-lane.sociobot.in>  
Implementation candidate: `60c2ccbb77b0df2d7ae50ac25e7e7e8b190cb035`  
Documentation candidate: `4a5827f6e3ad77d004db14c5424496b68eb5b15c`

## Verdict

**FAIL.** One P1 finding remains. Three of 26 declared claim commands fail
from a clean checkout, and the full browser suite fails 8 of 74 cases. There
are zero untested claims: every declared command ran, and the three affected
behaviours were also checked independently with corrected, scoped selectors.

Finding count: **1**. Untested claim count: **0**.

## First screen before scrolling

Fresh 390 × 844 phone and 1440 × 900 desktop Chromium contexts opened `/` at
scroll position zero. Both first screens show the complete answer:

- Job: **Keep critical Android reminders repeating.**
- Audience: Android users overwhelmed by notifications who need medicine,
  deadline, and call reminders repeated until snoozed or acknowledged.
- First action: **Try it with sample data**. The adjacent text says it opens
  three isolated sample reminders.

The privacy, offline, and US$4.99 one-time-price facts are also fully visible
before scrolling in both viewports.

## Finding

### F-3-1 · P1 — Three declared claim commands fail after their fixed dates became due

The clean checkout installed 148 packages with zero audit vulnerabilities.
The exact command from every `.factory/claims.json` entry then ran separately.
These commands fail in both configured browser projects:

| Claim | Exact command | Result |
| --- | --- | --- |
| `safe-import` | `npm run test:e2e -- --grep @claim:safe-import` | FAIL, 0/2 |
| `demo-isolation` | `npm run test:e2e -- --grep @claim:demo-isolation` | FAIL, 0/2 |
| `data-portability` | `npm run test:e2e -- --grep @claim:data-portability` | FAIL, 0/2 |

The shared fixture in `tests/e2e/app.spec.ts` sets `nextAt` to
`2026-09-01T09:00:00.000Z`. On this review date, imported fixtures are due and
appear both in **Reminder needing acknowledgement** and **Your reminders**.
Each failed assertion uses an unscoped `getByRole('heading', { name: ... })`.
Playwright correctly rejects the two matching headings in strict mode.

The same date rollover also breaks the untagged malformed-import recovery case.
The complete `npm run test:e2e` result is 66 passed and 8 failed: the four
affected cases fail once on mobile and once on desktop.

This is a required quality and claims-gate failure. It is release-blocking even
though the product behaviour is sound. Scope these assertions to the saved
reminder list, or make the fixtures relative to the test clock, then rerun all
26 claim commands and the full suite.

Independent live checks separated the test defect from product behaviour:

- Unsafe import reported two repaired IDs and produced the unique IDs
  `duplicate`, `duplicate~import-2`, `Aa`, and `BB~import-4`.
- Editing **Second duplicate** changed only that reminder; **First duplicate**
  remained.
- Export downloaded version 1 with all three samples. Confirmed replacement
  import left only **Pay the electricity bill**.
- A real reminder seeded in a fresh browser database survived demo use and
  **Start for real**. No sample entered the real lane.
- Brand, Privacy, Terms, Factory, and checkout exits each discarded demo edits;
  the next demo entry restored **Water the balcony plants**.

These independent checks do not make the declared failing commands pass.

## Declared claims

All 26 commands were invoked. Twenty-three passed:

`offline-reload`, `free-limit`, `local-private`, `repeat-until-handled`,
`demo-ready`, `rolling-score`, `schedule-and-undo`, `quiet-hours`,
`repeat-range`, `pwa-installable`, `android-permission-boundary`,
`timing-limits`, `core-free`, `native-background-repeat`,
`lifecycle-recovery`, `apk-download`, `apk-source-identity`,
`apk-update-signing`, `repo-no-signing-secrets`, `one-time-license`,
`billing-data-boundary`, `billing-processor-refunds`, and `license-recovery`.

The three failures are listed in F-3-1. A fresh cross-check of live and README
copy found no unlisted public claim. No AI action is needed for this local
reminder job; import and export already cover the useful adjacent need.

## Clean checkout results

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 148 packages, 0 vulnerabilities |
| `npm test` | PASS — 23/23 |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test:copy` | PASS |
| `npm run build` | PASS — `dist/` produced |
| `npm run test:e2e` | **FAIL — 66 passed, 8 failed** |
| `npm run test:update` | PASS — `cal-v12` update and offline reload |
| `npm run test:android:artifact` | PASS |
| `npm run test:android:instrumentation` | PASS |

The Android artifact checks found 28 current embedded assets, required native
symbols, v1.0.3-to-v1.0.6 signing continuity, and the one-click 390 × 844 demo
layout. The public full Android workflow for implementation commit `60c2ccb`
also completed successfully. This worker had no Android device, JDK, or SDK,
so it did not repeat the optional full Gradle/device run locally.

## Live demo and product paths

- One click from either fresh first screen opened `/?demo=1` with three
  realistic reminders.
- The first demo viewport showed **Take evening medicine**, its note,
  **Acknowledge**, and **Snooze**.
- **Demo — sample data, nothing is saved** remained visible after a change and
  after reset. **Reset demo** restored the due reminder.
- The separate IndexedDB names were `critical-alert-lane` and
  `demo:critical-alert-lane`. The isolation exercise preserved real data and
  copied no sample into it.
- Normal create, reload, acknowledge, Undo, weekday schedule, 60-minute repeat,
  and 24-hour acknowledgement-window paths passed.
- Blank titles and blank quiet-hour input produced labelled recovery messages.
  Corrected values saved normally.
- HTML-like input stayed literal and did not execute. Malformed JSON produced
  a recovery message and preserved existing data. The 180-minute snooze limit
  worked.

Ordinary live flows requested only product-origin resources. No cookies,
analytics, trackers, ads, remote fonts, or reminder-data requests appeared.
Billing requests occur only after an explicit purchase or restore action.
This static product has no product backend, tenant, server-side state, or
health endpoint, so backend restart, SQLite mount, and tenant checks do not
apply.

## Accessibility, routes, links, and performance

- Playwright Axe reported zero violations on desktop root, populated demo,
  Settings with an error, Privacy, Terms, designed 404, and the phone demo at
  200% text.
- The first Tab exposed the skip link. Enter focused the main heading. Keyboard
  use opened and closed the reminder dialog, moved focus to its title, and
  restored focus to the opener. Focus uses a visible 4 px yellow outline.
- Every visible phone control measured at least 44 × 44 CSS pixels. No
  horizontal overflow appeared at normal size or 200% text.
- Reduced motion set transition and animation durations to 0.01 ms and scroll
  behaviour to `auto`.
- A controlled live demo reloaded offline and remained usable. The update test
  passed.
- `/`, `/?demo=1`, `/demo/`, `/privacy/`, `/terms/`, `/404.html`, and
  `/offline.html` passed `scripts/verify-url.sh`. Privacy and Terms return 200
  with route titles, one h1, metadata, and shared navigation.
- An unknown URL intentionally returns HTTP 404 and the designed **Page not
  found** page. Chromium's matching failed-resource message is expected, not a
  defect.
- All HTTP links returned 200 except checkout's expected 303 redirect to the
  hosted Dodo page. Mail links are explicit. `robots.txt` and `sitemap.xml`
  are available.
- Lighthouse 13.4.1 scored mobile and desktop 100/100/100/100 for performance,
  accessibility, best practices, and SEO. Mobile LCP was 1.293 s, TBT 0 ms,
  and CLS 0. Desktop LCP was 0.348 s, TBT 0 ms, and CLS 0.
- Production main JavaScript is 45.33 kB raw / 15.46 kB gzip; CSS is 17.15 kB
  raw / 4.47 kB gzip; the mobile hero AVIF is 44.63 kB. All budgets pass.

## Candidate and live deployment

Commits `59169d4`, `4958895`, and `4a5827f` change only reports after
implementation commit `60c2ccb`. A fresh production build from the
documentation candidate has 39 deployable files. All 39 are byte-identical to
the live origin. The host-only `staticwebapp.config.json` correctly returns
404. The live and candidate APK SHA-256 values both equal
`e902da576a34ede089010c2fbce721d811ea587106abe024eebcd33c47a5289e`.

Live headers include HSTS, `nosniff`, strict referrer policy, restrictive
Permissions Policy, COOP/CORP, DENY framing, and response-header CSP with
`frame-ancestors 'none'`. Normal pages produced no console or page errors.

## Earlier finding disposition

Every earlier review and verification report in `.factory/` was inspected.
The current disposition is based on fresh live, clean-checkout, artifact, and
source evidence.

| Earlier report | Findings inspected | Current disposition |
| --- | --- | --- |
| `verification.md` | Closed-app Android repeat; corrupt import; response headers and caching | Fixed. Native claims/artifact checks pass; invalid imports recover; live headers and caches are correct. |
| `verification-2.md` | Closed-app APK, disabled purchase, native notification clearing, blank title, Android 6–11 fallback, mobile offline/touch targets | Fixed. Native, billing, validation, offline, and 44 px checks pass. |
| `verification-3.md` | Android 6–11 scheduling, lint, blank quiet hours, dialog focus, nested APK | Fixed. Artifact/native checks pass; live validation and focus pass; bundle has no nested APK. |
| `verification-4.md` | Import alarm identity, free limit, instrumentation assembly | Fixed. Safe IDs and free-limit behaviour pass independently; instrumentation artifact command passes. |
| `verification-5.md` | Missing demo, broken claim setup, unlisted core promise, missing 404/verifier, unavailable Android checks | Product fixes remain present. The original setup causes are fixed, but F-3-1 newly makes the claims gate red. |
| `verification-8.md` | 30-day score, demo exit clearing, claim coverage, demo touch targets, discovery metadata | Fixed. Score claim passes; every demo exit resets; touch and metadata checks pass. |
| `verification-9.md` | APK older than candidate | Fixed. APK source identity and all 28 embedded assets match. |
| `verification-10.md` | Standalone update command; clean-worker Android claims | Fixed. Update and all SDK-free Android claim commands run. |
| `verification-11.md` | Android signing identity changed | Fixed. v1.0.6 retains the v1.0.3 factory signer and advances code 4 to 7. |
| `verification-12.md` | Unlisted claims, missing native tags, landing/footer skeleton, long README text | Fixed. Claim registry and tags are complete; current structure and copy audit pass. |
| `verification-13.md` | Malformed JSON exposed parser jargon and lacked recovery | Fixed. Live error is plain, actionable, and preserves data. |
| `verification-14.md` | No findings | No regression found beyond F-3-1. |
| `verification-15.md` | Red full Android gate, stale APK layout, old APK copy | Fixed. Exact implementation CI is green; v1.0.6 artifact, mobile demo, and copy checks pass. |
| `verification-16.md` | No product findings; no physical-device run | Product evidence remains valid. Physical-device execution remains an environment limitation. |
| `review-2.md` | No findings | Its 2026-08-29 PASS is superseded by the date-triggered F-3-1 failure. |

The 31 findings in `review-1.md` were checked individually:

| IDs | Current evidence |
| --- | --- |
| F-1-1 | Phone demo begins with the due sample and both handling controls in the first viewport. |
| F-1-2 | Direct `#how-it-works`, navigation, and Back restore target scroll and heading focus. |
| F-1-3–F-1-6 | Demo, processor/refund, timing, and local-private claims are registered; their commands pass except the separate F-3-1 selector failures. |
| F-1-7–F-1-9 | The 404 metadata, route focus, and phone price fact pass live checks. |
| F-1-10–F-1-12 | Current labels are **REPEATING ANDROID REMINDERS**, a literal art caption, and **DUE NOW**. |
| F-1-13–F-1-17 | Current copy says **Reminder needing acknowledgement**, explains the empty state, labels saved reminders, and uses **Your reminders**. |
| F-1-18–F-1-22 | Current copy says **LAST 30 DAYS**, **30-day acknowledgement rate**, **Choose the reminder schedule**, **Android notification permission**, and **Open settings**. |
| F-1-23 | Current copy consistently uses reminder, snooze, and acknowledge. |
| F-1-24–F-1-25 | APK verification and Dodo/refund text use plain instructions. |
| F-1-26–F-1-29 | README headings and user-facing backup, browser-storage, and install wording remain plain. |
| F-1-30 | `npm run test:copy` passes the reproducible inventory. |
| F-1-31 | The repository-only signing-secret claim and tracked-file scan pass. |

No earlier product defect has returned. F-3-1 is a new seven-day,
date-sensitive test regression.

## Required next step

Repair the four time-sensitive Playwright selectors or fixtures without
weakening their outcome checks. Then rerun all 26 exact claim commands and the
full browser suite. A new review may declare PASS only when all commands pass.
