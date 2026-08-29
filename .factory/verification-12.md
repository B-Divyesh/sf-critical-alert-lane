# Independent verification 12 — FAIL

Date: 2026-08-29

Verifier work order: `critical-alert-lane-verify-12`

Candidate commit: `9fafcb5c6e7672361474ec9343500a52eff55831`

Live URL: <https://critical-alert-lane.sociobot.in>

## Decision

**FAIL — the Android release repair works, but the candidate does not satisfy
the supplied claims and site-structure contracts.**

The previously reported deployment-only failure is resolved. The live v1.0.5
APK byte-matches the candidate, has the same factory signing identity as the
public v1.0.3 APK, and advances Android version code 4 to 6. All 16 commands
declared in `.factory/claims.json` pass, as do the browser, build, PWA,
accessibility, privacy, rate-limit, and performance checks below.

Release remains blocked because the claims registry is not complete and four
native claim entries do not have the required source test tag. The mandatory
site skeleton and plain-words rules also have visible/documented gaps.

## Findings

### P1 — public claims are not listed and tested in `claims.json`

The attached claims contract says every statement a visitor can rely on must
have a claim entry and one matching test. It explicitly makes an unlisted claim
a failed review. Fresh cross-checking found, at minimum:

- README: **“Configurable 5–60 minute repeat cadence until
  acknowledgement.”** This is a quantitative claim. No claim entry says or
  tests the 5–60 bounds; the `schedule-and-undo` claim tests recurrence and
  Undo, not the 60-minute boundary. Independent manual QA did exercise 60
  minutes successfully, but an ad-hoc verifier check is not the required
  permanent claim test.
- README/Privacy: the app requests no account, contacts, calendar, location,
  camera, or microphone access; notification permission is requested only
  after the Settings action; and Android falls back to an inexact alarm when
  exact access is declined. The `local-private` claim records browser network
  requests only. It does not inspect APK permissions, prompt timing, or the
  fallback behavior.
- README: **“installable PWA.”** `offline-reload` proves an offline reload,
  not browser installability.
- Privacy: payment details are not stored by the app, billing is contacted only
  for checkout/license verification, and a daily verification result is kept
  locally. These statements are not present as claims with matching tests.

The live footer also says **“No account, ads, tracking, calendar, or
contacts.”** Only the tracking/request portion is asserted by `local-private`.
The remaining statements are not covered by that claim's sandbox.

Resolution: either add narrowly worded claim entries with observable tests for
each statement, or remove/narrow the public copy. Quantitative bounds must be
asserted with the published numbers.

### P1 — four native claim entries have no `@claim:<id>` source test

Each browser claim has exactly one literal source tag. Fresh source counting
found zero tags for:

| Claim ID | Declared command | Literal source tags |
| --- | --- | ---: |
| `native-background-repeat` | `npm run test:android:claim` | 0 |
| `lifecycle-recovery` | `npm run test:android:lifecycle-claim` | 0 |
| `apk-source-identity` | `npm run test:android:artifact` | 0 |
| `apk-update-signing` | `npm run test:android:update-signing` | 0 |

All four commands pass and provide useful evidence. The failure is the explicit
claims-contract requirement that every claim have exactly one tagged source
test, so claim-to-test completeness can be audited mechanically.

### P2 — mandatory landing and shared-footer skeleton is incomplete

The supplied site-structure contract requires, in order, a three-step “How it
works” section, a “What it does not do / privacy” section, and a paid-tier
section when payment exists. The landing page goes from the first screen
directly into the reminder UI and reliability score, then the footer. It has
none of those three required sections.

The same contract requires every footer to include the product one-liner,
Privacy, Terms, “Built by Param Factory,” and a version/build ID. The app footer
has no factory credit or build ID. Privacy and Terms each have only one
cross-link and omit the rest. Their headers are also not the shared app header.

### P2 — README violates the 22-word plain-words cap

The first screen itself passes the plain-words gate. The README does not. For
example, its audience sentence is 29 words, and the exact-alarm fallback
sentence is 25 words. The attached plain-words contract sets a hard 22-word
cap and explicitly includes README copy.

## Mandatory first gates

### Claims — run first from the clean candidate

The checkout started clean at the exact candidate commit. `npm ci` installed
148 packages with zero audit findings. `.factory/claims.json` exists with 16
entries. Every exact listed command was then run independently before broader
QA; all passed.

| Claim | Result | Runtime evidence |
| --- | --- | --- |
| `offline-reload` | PASS | 2 Playwright projects; `/tmp/critical-alert-claim-offline-reload.log` |
| `safe-import` | PASS | 2 projects; `/tmp/critical-alert-claim-safe-import.log` |
| `free-limit` | PASS | 2 projects; `/tmp/critical-alert-claim-free-limit.log` |
| `local-private` | PASS | 2 projects; `/tmp/critical-alert-claim-local-private.log` |
| `repeat-until-handled` | PASS | 2 projects; `/tmp/critical-alert-claim-repeat-until-handled.log` |
| `demo-isolation` | PASS | 2 projects; `/tmp/critical-alert-claim-demo-isolation.log` |
| `data-portability` | PASS | 2 projects; `/tmp/critical-alert-claim-data-portability.log` |
| `rolling-score` | PASS | 2 projects; `/tmp/critical-alert-claim-rolling-score.log` |
| `schedule-and-undo` | PASS | 2 projects; `/tmp/critical-alert-claim-schedule-and-undo.log` |
| `quiet-hours` | PASS | 2 projects; `/tmp/critical-alert-claim-quiet-hours.log` |
| `native-background-repeat` | PASS | native bundle/APK symbols; `/tmp/critical-alert-claim-native-background-repeat.log` |
| `lifecycle-recovery` | PASS | receiver actions/APK symbols; `/tmp/critical-alert-claim-lifecycle-recovery.log` |
| `apk-download` | PASS | 2 projects and digest; `/tmp/critical-alert-claim-apk-download.log` |
| `apk-source-identity` | PASS | 26 embedded assets and 7 native fingerprints; `/tmp/critical-alert-claim-apk-source-identity.log` |
| `apk-update-signing` | PASS | application ID, code advance, certificate continuity; `/tmp/critical-alert-claim-apk-update-signing.log` |
| `one-time-license` | PASS | 2 fixture-backed projects; `/tmp/critical-alert-claim-one-time-license.log` |

### Cold first read — PASS

Fresh Chromium, 1440×900, no prior storage:

- **What:** “Keep critical Android reminders repeating.”
- **For whom:** “For Android users overwhelmed by notifications…”
- **First click:** **Try it with sample data**, linking directly to `/demo`.
- The same viewport states that data stays on the device, offline use begins
  after the first visit, and unlimited reminders cost US$4.99 once.
- `/demo` immediately shows three realistic reminders and the persistent
  “Demo — sample data, nothing is saved” banner with Reset demo and Start for
  real.

Evidence: `/tmp/critical-alert-qa/first-read-desktop.png` and the captured
visible-text/links output from the cold navigation. No console/page error was
raised.

## Functional and recovery verification

The full repository Playwright suite passed 46/46 cases across desktop Chrome
and its 390 px mobile project. Independent live flows then covered:

- all three sample schedules and immediate sample value;
- deleting a sample, creating a daily reminder, persisting through reload,
  acknowledging it, and undoing the acknowledgement;
- the maximum published choices exercised manually: 60-minute repeat and
  24-hour escalation window;
- a whitespace-only title: a bound, announced error is shown and the same
  dialog recovers after correction;
- empty quiet-hour start: error and `aria-invalid`, then successful recovery;
- malformed/unsupported import: visible error and no reminder mutation;
- keyboard Enter/Escape dialog operation and focus return;
- desktop and 390×844 layouts without horizontal overflow.

The independent run produced no console errors, page errors, external ordinary
flow requests, or visible controls below 44×44 CSS px. Screenshots and JSON are
under `/tmp/critical-alert-qa/live-*.png` and
`/tmp/critical-alert-qa/live-manual.json`.

## Live deployment and Android identity

- A fresh production build produced 28 deployable files; all 27 public runtime
  files byte-match live. `staticwebapp.config.json` is correctly deployment
  configuration and returns 404 when requested.
- Root HTML SHA-256:
  `2e93251cf4b25c1a3a9b5fec118992be3511e70177cfa7fa8daba441747c64b7`.
- Main JS SHA-256:
  `99b1f8d7f1e900547fd1283ad72a0161fa51bcc74d3519f6a31d404ee32a861e`.
- Service worker SHA-256:
  `47039e972f359d16261e4f807259dfa99fb54224f5128a25401b1f3928d8d410`.
- Live/candidate v1.0.5 APK SHA-256:
  `af06a7f89d0afee99aa4fafe81d074ccd40a62c5d0d981dc46fda529d9b6c6e8`.
- Fresh certificate extraction from `META-INF/CERT.RSA` gives subject
  `CN = Sociobot Factory Android Signing` and SHA-256 fingerprint
  `F6:A9:CA:54:D7:38:5C:9D:00:5B:81:DE:04:7D:49:37:F6:C4:47:60:2E:9F:A8:19:4C:F0:F8:70:FC:53:26:5C`.
  This exactly matches v1.0.3. Package identity is
  `in.sociobot.criticalalertlane`; version code advances 4 to 6.

This fresh evidence closes verification 11's deployment-only signing defect.

## Privacy, endpoint allowance, and headers

- An exercised live demo session (create, persist, reload, acknowledge, undo,
  Settings, corrupt import) requested only
  `https://critical-alert-lane.sociobot.in`. No analytics, trackers,
  third-party fonts/scripts, or reminder-data requests occurred.
- The Sociobot license verification endpoint allowed 30 requests from one
  client. Attempt 31 returned HTTP 429 with `Retry-After: 2` and
  `X-RateLimit-After: 2`. Attempt 30 was HTTP 200 with
  `{valid:false, reason:"invalid"}` and `Cache-Control: no-store`.
- Live HTML sends CSP with response-header `frame-ancestors 'none'`, HSTS,
  nosniff, strict referrer policy, restrictive Permissions Policy, DENY
  framing, COOP, and CORP.
- HTML uses five-minute revalidation. Hashed assets and APK use one-year
  immutable caching. `sw.js` is `no-cache, no-store, must-revalidate`.
- Unknown routes return a designed HTTP 404. The browser's expected failed-main
  resource diagnostic is limited to the deliberate 404 navigation; all
  product routes load with no console/page errors.
- The product does not require sign-in, so the Entra authority requirement is
  not applicable. There is no product backend beyond explicit Sociobot
  billing calls, so backend concurrency/health/persistence tests do not apply.

## Accessibility, mobile, PWA, and performance

- `scripts/verify-url.sh` passes live `/`, `/demo/`, `/privacy/`, and `/terms/`.
- Fresh axe scans of `/`, `/demo/`, `/privacy/`, `/terms/`, and the designed
  404 at desktop and 390 px found **zero violations of any impact**. The demo
  Settings dialog also has zero serious/critical findings.
- Each route has `lang="en"`, one H1, and one main landmark. Keyboard focus is
  a visible 4 px `#F3C84B` outline. Native dialogs trap focus and restore it.
- At 200% root text size on 390 px there is no horizontal overflow and all
  primary controls remain available.
- Reduced motion computes to `0.00001s` transition/animation duration and
  `scroll-behavior: auto`.
- Live service worker `cal-v8` controls `/demo`; after disconnect and reload,
  the sample remains usable and “Offline · still working” is visible.
- `npm run test:update` passes independently: `cal-v8` detects an update and
  the updated demo reloads offline.
- Lighthouse mobile on live `/demo`: performance **93**, accessibility **100**,
  best practices **100**, SEO **100**; LCP 1.29 s, CLS 0, FCP 1.00 s, total
  transfer 69,579 bytes. A live interaction Event Timing sample measured a
  maximum 48 ms interaction duration.
- Main JS is 39.91 kB raw / 14.19 kB gzip; app CSS is 13.32 kB raw / 3.75 kB
  gzip; the mobile hero is 39.34 kB WebP and desktop AVIF is 44.63 kB. All are
  within the supplied budgets.

## Local quality gates

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 148 packages, 0 vulnerabilities |
| all 16 exact `.factory/claims.json` commands | PASS |
| `npm test` | PASS — 18/18 tests in 3 files |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — `dist/` produced |
| `npm run test:e2e` | PASS — 46/46 desktop/mobile tests |
| `npm run test:update` | PASS |
| `npm run test:android:instrumentation` | PASS — SDK-less artifact/source verification |
| `npm run test:android:full` | ENVIRONMENT BLOCKED after native sync: no JDK or Android SDK in this `deploy: none` worker |

The full Gradle gate is not a candidate failure: the work order explicitly
provides JDK/SDK only for Android deploy workers, while this one is `deploy:
none`. The required clean-verifier native claim commands are SDK-less and all
pass. No physical/emulated device was attached, so terminated-process alarm
delivery was not repeated on hardware; the published compiled symbols, source
fingerprints, manifest actions, and artifact identity were verified instead.

## Required resolution

1. Complete or narrow the claims registry/copy, including quantitative,
   permission, installability, and billing-privacy statements.
2. Give every native claim exactly one auditable `@claim:<id>` source test.
3. Add the mandated landing sections and consistent footer/header metadata.
4. Bring README sentences within the plain-words cap.
5. Re-run the same clean-clone claims-first verification. The v1.0.5 APK does
   not need another signing repair based on this evidence.
