# Independent verification 13 — FAIL

Date: 2026-08-29

Work order: `critical-alert-lane-verify-13`

Candidate commit: `da18e401a7b012a577c973457905fda2b4ed8579`

Live URL: <https://critical-alert-lane.sociobot.in>

Artifact class: Android APK with a PWA landing/application shell

## Decision

**FAIL — one user-facing import error violates the supplied error and
plain-words contract.**

The earlier deployment-only failure is not present. The live deployment
byte-matches this candidate, the signed v1.0.5 APK matches its published
digest and v1.0.3 signer, all 22 declared claims pass, and the functional,
privacy, accessibility, PWA, performance, and rate-limit gates otherwise pass.

## Release-blocking finding

### P2 — malformed JSON exposes parser jargon and gives no recovery action

From a fresh live browser profile:

1. Create and save a reminder.
2. Open **Settings**.
3. Choose **Import JSON** and select a file containing `{not-json`.

The visible status says:

> Expected property name or '}' in JSON at position 1 (line 1 column 2)

The existing reminder is safely preserved, and a valid import works
afterward. The problem is the message itself: it does not say in plain words
that the selected file is not a valid Critical Alert Lane export, and it gives
no next action. This fails the supplied requirements that invalid input have a
usable recovery path and that errors say what happened and what to do next.
The cause is the raw `JSON.parse` message passed through at
`src/main.ts:454-455`.

Expected: a stable message such as “This file is not valid JSON. Choose a
Critical Alert Lane export and try again.” Add an end-to-end regression for a
syntactically malformed file, not only valid JSON with invalid reminder
fields.

## Mandatory first gates

### Claims — 22/22 PASS after clean lockfile install

The checkout was clean and at the exact candidate. `.factory/claims.json`
exists. `npm ci` installed 148 packages with zero audit findings. Every listed
claim command was then run independently; every command exited zero. All 22
claim IDs also have exactly one literal `@claim:<id>` source tag.

| Claim | Result | Evidence |
| --- | --- | --- |
| `offline-reload` | PASS | Desktop/mobile demo reload under browser offline mode |
| `safe-import` | PASS | Duplicate and Java-hash-colliding IDs remain separately editable |
| `free-limit` | PASS | Four imported rows preserved; only three active |
| `local-private` | PASS | Ordinary reminder flow remained same-origin |
| `repeat-until-handled` | PASS | Due sample repeats, snoozes, resets, and acknowledges |
| `demo-isolation` | PASS | Demo namespace and all exit/reset paths remain isolated |
| `data-portability` | PASS | Versioned JSON export and confirmed replacement import |
| `rolling-score` | PASS | 29-day history counted and 31-day history excluded |
| `schedule-and-undo` | PASS | One-time/daily/weekday/weekly schedules and Undo |
| `quiet-hours` | PASS | Due alert stays visible while notification repeats are muted |
| `repeat-range` | PASS | Complete 5, 10, 15, 30, and 60 minute range |
| `pwa-installable` | PASS | Standalone manifest, required icons, controlled shell |
| `android-permission-boundary` | PASS | Settings-only notification request, permission exclusions, inexact fallback |
| `core-free` | PASS | Core controls/export available; axe serious/critical count zero |
| `native-background-repeat` | PASS | Native state, receiver/repeat DEX symbols, APK identity |
| `lifecycle-recovery` | PASS | Boot, clock, and time-zone rescheduling evidence |
| `apk-download` | PASS | Download exceeds 1 MB and matches displayed SHA-256 |
| `apk-source-identity` | PASS | 26 web assets, seven native fingerprints, required DEX symbols |
| `apk-update-signing` | PASS | v1.0.3 code 4 to v1.0.5 code 6 with the same signer |
| `one-time-license` | PASS | Fixture verification unlocks and persists four active reminders |
| `billing-data-boundary` | PASS | Sociobot-only billing URL, token/verdict storage, daily cache |
| `license-recovery` | PASS | Restore works; revoked license preserves fourth reminder paused |

### Cold first read — PASS

Fresh Chromium at 390×844, no prior storage:

- What it does: **“Keep critical Android reminders repeating.”**
- For whom: Android users overwhelmed by notifications who cannot miss
  medicine, deadlines, or calls.
- First click: **Try it with sample data**.
- The same first screen states device-local data, offline use after the first
  visit, and the US$4.99 one-time price.
- One click opens `/demo/` with three realistic reminders and the persistent
  **“Demo — sample data, nothing is saved”** banner, **Reset demo**, and
  **Start for real**.

The cold page returned 200, made four same-origin requests, and produced no
console or page error.

## Functional and recovery evidence

Independent live checks, separate from the repository suite, covered:

- creating a due daily reminder, saving, reloading, acknowledging, and Undo;
- the published 60-minute repeat and 24-hour escalation boundaries;
- a whitespace-only title, announced bound error, and successful correction;
- an empty quiet-hours start, `aria-invalid`, and successful correction;
- malformed JSON rejection with existing data preserved;
- a valid replacement import immediately after that malformed file;
- sample snooze and Reset demo;
- demo service-worker control and offline reload;
- desktop and 390×844 mobile layout, including 200% root text;
- keyboard-only access to the skip link and Settings, Escape close, and focus
  return.

Focus was a visible 4 px `#F3C84B` outline. All measured visible links,
buttons, and selects at 390 px were at least 44×44 CSS px. Neither normal nor
200% text produced horizontal overflow. Reduced motion computed to 0.00001 s
for animation/transition and `scroll-behavior: auto`.

The full internal-link crawl returned 200 for every route and APK link; all
hash targets exist. External checkout, factory, and mail links are explicit.
The designed unknown route returns HTTP 404 with a usable page.

## Live deployment and Android identity

A fresh `npm run build` produced `dist/`. All 34 deployable files (everything
except host configuration) byte-match the live origin.

- Root HTML SHA-256:
  `6d62efac26b6a3951be544edf6f1a83962c05066b95d8a7c6d5bb42bfd631005`
- Main JS SHA-256:
  `084d80209e35bbe6a2bb584e21bf99a279434ebead801a9caf77fcf68c20ca32`
- Service worker SHA-256:
  `58537f5ce837ac8b6a447e9cf3b003912eaee7302305e93a6eba55b4a865d0ec`
- Live/candidate APK: 4,596,635 bytes, SHA-256
  `af06a7f89d0afee99aa4fafe81d074ccd40a62c5d0d981dc46fda529d9b6c6e8`
- Application ID: `in.sociobot.criticalalertlane`
- Version: v1.0.5 / code 6, up from v1.0.3 / code 4
- Signer: `CN = Sociobot Factory Android Signing`
- Signer SHA-256:
  `F6:A9:CA:54:D7:38:5C:9D:00:5B:81:DE:04:7D:49:37:F6:C4:47:60:2E:9F:A8:19:4C:F0:F8:70:FC:53:26:5C`

The SDK-free instrumentation-source check passes. The full Gradle command
successfully synced the native shell, then was environment-blocked because
this `deploy:none` worker has neither a JDK nor Android SDK. The work order
states those are supplied only for Android deploy workers. No emulator or
physical device was available, so terminated-process delivery was verified
through the released source fingerprints and compiled APK symbols rather than
on-device execution.

## Privacy, endpoint allowance, headers, and caching

- A live create/persist/reload/acknowledge/settings/import flow made nine
  requests across four unique URLs, all on the product origin.
- No analytics, trackers, remote fonts, reminder-data requests, console
  errors, or page errors appeared during ordinary use.
- The Sociobot verification endpoint allowed 30 requests from one client.
  Request 31 returned HTTP 429 with `Retry-After: 4`.
- Browser-observed HTML response headers include CSP with response-header
  `frame-ancestors 'none'`, HSTS, nosniff, strict referrer policy,
  restrictive Permissions Policy, DENY framing, COOP, and CORP.
- HTML and the manifest use five-minute revalidation. Hashed assets and APKs
  use one-year immutable caching. `sw.js` is `no-cache, no-store,
  must-revalidate`.
- The app requires no sign-in, so the Entra tenant rule does not apply.
- There is no product backend beyond explicit Sociobot billing calls, so
  backend concurrency, health, and persistence checks do not apply.

## Accessibility, PWA, and performance

- `scripts/verify-url.sh` passes live `/`, `/demo/`, `/privacy/`, and
  `/terms/`.
- Axe scans of those routes and the designed 404 at desktop and 390 px found
  zero violations of any impact. The Settings dialog also had zero findings.
- Every scanned route has `lang="en"`, exactly one H1, and one main landmark.
- Normal 200 routes had no console/page errors. The deliberate 404 navigation
  produces only Chromium's expected failed-main-resource console diagnostic.
- `npm run test:update` passes: service worker `cal-v9` detects an update and
  the updated demo reloads offline.
- Lighthouse mobile `/demo/`: performance 95, accessibility 100, best
  practices 100, SEO 100; FCP 1.272 s, LCP 1.494 s, CLS 0, TBT 243.5 ms,
  transfer 70,727 bytes.
- Live Event Timing across Settings and editor interactions peaked at 72 ms.
- Main JS is 42.66 kB raw / 15.02 kB gzip. App CSS is 14.99 kB raw / 4.06 kB
  gzip. The mobile hero WebP is 39.34 kB. All supplied size budgets pass.

## Local quality gates

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 148 packages, 0 vulnerabilities |
| all 22 exact claim commands | PASS |
| `npm test` | PASS — 20/20 tests in 3 files |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — `dist/` produced |
| `npm run test:e2e` | PASS — 58/58 desktop/mobile cases |
| `npm run test:update` | PASS |
| `npm run test:android:instrumentation` | PASS |
| `npm run test:android:full` | ENVIRONMENT BLOCKED after native sync — no JDK/SDK in this `deploy:none` worker |

## Required resolution

Replace raw parser exceptions on malformed import with a plain, actionable
message and add a regression that submits syntactically malformed JSON. Then
rerun the clean-clone claims-first verification. No deployment, signing,
privacy, accessibility, or performance repair is indicated by this run.
