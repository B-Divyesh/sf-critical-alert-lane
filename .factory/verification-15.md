# Independent verification 15 — FAIL

Date: 2026-08-29

Work order: `critical-alert-lane-verify-15`

Candidate commit: `746c9a7d2e1994945047d3a913cd437a690fb8db`

Live URL: <https://critical-alert-lane.sociobot.in>

Artifact: Android APK with local-first PWA shell

## Decision

**FAIL. Do not release this candidate.** The live web/PWA is healthy, matches
the candidate build, passes the cold-read/demo gate, and passes all 26 declared
claims. The Android release is not acceptable for two independently reproduced
reasons:

1. the repository's mandatory `npm run test:android:full` gate exits 1, both in
   public CI for this exact SHA and in this verifier's provisioned JDK 21/API 35
   environment; and
2. the downloadable signed APK contains the older pre-polish web bundle. Its
   one-click sample route places the due reminder and handling controls far
   below the first 390 x 844 screen, violating the mobile demo contract.

These are product/artifact failures, not deployment-only failures. The live
origin serves the candidate's files byte-for-byte, including the stale APK.

## Release-blocking defects

### P1 — The required full Android quality gate is red

Fresh evidence:

- GitHub Actions run
  [33245145717](https://github.com/B-Divyesh/sf-critical-alert-lane/actions/runs/33245145717)
  for exact SHA `746c9a7...` concluded `failure`. Setup, JDK, Android SDK, and
  `npm ci` passed; **Build, lint, test, and assemble the Capacitor APK** failed.
- The repair commit `c2f9eea...` also has a failed Android run, while the
  pre-polish `dc4fb14...` run passed.
- This verifier installed OpenJDK 21 and Android API/build-tools 35 outside the
  repository and ran the unchanged `npm run test:android:full` command.
- Gradle completed **329 tasks successfully**. Debug and release host suites
  each passed 14 tests; `lintDebug`, debug/release APK assembly, and Android
  test APK assembly passed.
- The command then exited 1 at `scripts/verify-apk-artifact.mjs:61`:

  ```text
  Error: APK reminder bundle is missing release marker: Repeat until handled
  ```

The verifier hard-codes the pre-polish marker `Repeat until handled`, while the
candidate intentionally standardized the product on `Repeat until
acknowledged`. Thus the exact documented Android release gate cannot pass.
This violates the definition-of-done requirement that all local quality gates
pass.

### P1 — The published Android APK does not contain the candidate demo layout

The live download and repository both contain
`critical-alert-lane-1.0.5.apk`, 4,596,635 bytes, SHA-256
`af06a7f89d0afee99aa4fafe81d074ccd40a62c5d0d981dc46fda529d9b6c6e8`.
Its signer/application/version continuity checks pass.

However, extracting `assets/public/` from that signed APK and comparing it to
the candidate's freshly synchronized `dist-native/` shows different HTML,
manifest, service worker, JS, and CSS. The APK loads old
`main-DnYDl98e.js`/`main-Cuhk3SfZ.css`; the candidate loads
`main-D-Oe7V2t.js`/`main-CF9DTGQe.css` plus the new route-focus assets.

Fresh 390 x 844 Chromium execution of the signed APK's own embedded UI found:

- first screen: a visible **Try it with sample data** link;
- after one click to `/demo/`, scroll position remained 0;
- due title **Take evening medicine** began at y = 1,573 px;
- **Acknowledge** began at y = 1,825 px;
- **Snooze** began at y = 1,993 px.

Nothing that demonstrates the working reminder is inside the 844 px first
screen. This is the exact mandatory demo failure that the polish changed on
the web, but the signed Android artifact was not rebuilt. The APK also retains
copy explicitly removed by the polish, including `ONE LANE. NO FEED.`, `TRACK
01 / NOW`, `30-DAY SIGNAL CHECK`, `worth breaking through the noise`, and
mixed `handle`/`answer` terminology.

The current claims leave this gap open: `@claim:demo-ready` exercises the fresh
web build, while `apk-source-identity` pins the older immutable v1.0.5 bundle.
Both pass even though the downloadable Android app does not contain the
candidate demo behavior.

## Mandatory first gates

### Claims: 26/26 PASS after the locked install

`.factory/claims.json` exists and contains 26 entries. Before any repository
inspection, the first exact command was invoked and could not start because
the untouched clone had no installed `@playwright/test`. After the required
`npm ci` (148 packages, zero vulnerabilities), every manifest command was run
independently and exited 0:

`offline-reload`, `safe-import`, `free-limit`, `local-private`,
`repeat-until-handled`, `demo-isolation`, `demo-ready`, `data-portability`,
`rolling-score`, `schedule-and-undo`, `quiet-hours`, `repeat-range`,
`pwa-installable`, `android-permission-boundary`, `timing-limits`, `core-free`,
`native-background-repeat`, `lifecycle-recovery`, `apk-download`,
`apk-source-identity`, `apk-update-signing`, `repo-no-signing-secrets`,
`one-time-license`, `billing-data-boundary`, `billing-processor-refunds`, and
`license-recovery`.

Browser claim tests passed in both configured desktop and mobile projects.
The complete log is in `qa-evidence/claim-tests.log`. The two Android blockers
above show why passing the declared claims does not establish candidate-level
APK parity.

### Cold live first read: PASS

A fresh 390 x 844 context with no storage answered all three questions in the
first screen:

- **What it does:** “Keep critical Android reminders repeating.”
- **Who it is for:** Android users overwhelmed by notifications who need
  medicine, deadline, and call reminders repeated until acknowledged or
  snoozed.
- **What to click first:** **Try it with sample data**, immediately followed by
  “Opens three isolated sample reminders.”

The headline, audience sentence, action, explanation, and privacy/offline/price
facts all ended above y = 784 px. One click opened `/?demo=1`; the due sample
title was at y = 416 px, Acknowledge at y = 566 px, and Snooze at y = 658 px.
This live-web gate passes. The separately shipped Android artifact fails its
equivalent mobile demo gate as documented above.

## Clean checkout and automated gates

The checkout started at exact `HEAD`, `main`, and `origin/main` SHA
`746c9a7d2e1994945047d3a913cd437a690fb8db`. No product code was modified.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 148 packages, 0 vulnerabilities |
| all 26 `.factory/claims.json` commands | PASS after install |
| `npm test` | PASS — 23/23 |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test:copy` | PASS |
| `npm run build` | PASS — exact `dist/` produced |
| `npm run test:e2e` | PASS — 74/74 desktop/mobile tests |
| `npm run test:update` | PASS — `cal-v11` update and offline reload |
| `npm run test:android:instrumentation` | PASS — SDK-free source/artifact/signing checks |
| `npm run test:android:full` without toolchain | Environment stop — JDK absent |
| `npm run test:android:full` after provisioning JDK 21/API 35 | **FAIL** — obsolete release marker after successful Gradle build |
| public Android workflow for exact SHA | **FAIL** — same full gate step |

The full provisioned run assembled debug, unsigned release, and instrumentation
APKs. Fresh unsigned release SHA-256 was
`930ebe418a095419b4e3ce1e54b9083c327c65943036263c852344f2f5b53740`.

## Independent live behavior

Fresh desktop and mobile browser contexts covered normal, boundary, invalid,
and recovery paths:

- rejected a whitespace-only title with `aria-invalid` and an actionable
  inline error, then saved successfully;
- stored HTML-like title/note input as literal text without DOM or script
  injection;
- saved weekdays, the 60-minute repeat maximum, and the 24-hour
  acknowledgement-window maximum; persisted after reload;
- acknowledged a due reminder and restored it with Undo;
- rejected empty quiet-hour input, then saved the overnight 23:59–00:01
  boundary;
- rejected malformed JSON without replacing an existing reminder;
- used the 180-minute snooze maximum, Reset demo, Acknowledge, and Undo;
- loaded Privacy and Terms with route-specific titles and a single h1;
- returned an intentional HTTP 404 with the designed recovery page.

Normal routes produced zero console errors and zero page errors. Chromium
logged only its expected failed-main-resource message when the intentional 404
was requested.

## Accessibility and responsive behavior

- `scripts/verify-url.sh` passed local and live root, demo, Privacy, and Terms.
- Independent Axe scans found **zero findings of any severity** on desktop
  root, populated demo, open Settings/error state, Privacy, Terms, designed
  404, and the 390 px demo at 200% text.
- Keyboard traversal starts at the visible skip link. Enter moves focus to the
  main h1; the next Tab reaches the primary demo action. Add reminder opens
  with Enter, focuses its title, closes with Escape, and returns focus.
- Focus uses a visible 4 px yellow ring. All visible 390 px controls measured
  at least 44 x 44 CSS px. No horizontal overflow occurred at normal or 200%
  text size.
- Reduced motion computed to 0.01 ms transition/animation durations and
  `scroll-behavior: auto`.

## Privacy, headers, caching, links, and allowance

- The complete ordinary create/reload/demo/legal/offline flow made only
  same-origin requests and no font requests. No analytics, trackers, ads, or
  reminder-data network request appeared.
- Browser document responses and curl both confirmed HSTS, CSP with
  response-header `frame-ancestors 'none'`, `nosniff`, DENY framing,
  restrictive Permissions Policy, strict referrer policy, COOP, and CORP.
  HTTP redirects to HTTPS.
- HTML uses five-minute revalidation; hashed JS and APK downloads are one-year
  immutable; `sw.js` is no-store; the manifest has the correct MIME type.
- All HTTP links returned 200 except the checkout's expected 303 hosted-Dodo
  redirect. Mail links were treated as explicit non-HTTP links.
- The Sociobot verification endpoint allowed 30 invalid requests from one
  client. Request **31** returned **429**, `Retry-After: 3`, and the correct
  `Access-Control-Allow-Origin`. Observed allowance: **30 requests/client**.
- There is no sign-in flow, so the Entra External ID requirement is not
  applicable.
- A live/README claim cross-check found no additional unregistered behavior
  claims. AI is not implied by this reminder job, so no missed AI leverage was
  found.

## Deployment identity, PWA, and budgets

- All **38/38** deployable files from the fresh candidate `dist/` matched the
  live origin byte-for-byte. Host-only `staticwebapp.config.json` was excluded.
- Live service worker `/sw.js` controlled the app with `cal-v11-shell`; a
  populated demo reloaded offline. The standalone manifest supplies 192, 512,
  and maskable icons and versioned start URL `/?v=6`.
- Initial JS is 46.1 KB raw (about 15.9 KB gzip including the modulepreload
  helper). App CSS is 17.1 KB raw / 4.47 KB gzip. There are no font files. The
  selected mobile hero AVIF is 44.6 KB. All static budgets pass.
- Fresh Lighthouse 13.0.1: mobile **97/100/100/100** for performance,
  accessibility, best practices, and SEO; FCP 1.23 s, LCP 1.48 s, TBT 198.5
  ms, CLS 0. Desktop was **100/100/100/100**; LCP 0.37 s, TBT 12 ms, CLS 0.

## Android evidence and limitation

The released APK passes immutable digest, native-source fingerprint, required
DEX symbol, v1.0.3-to-v1.0.5 upgrade signer, permission-boundary, background
repeat, and lifecycle re-arm checks. Its extracted UI also produced zero Axe,
console, or page errors and could acknowledge/undo a sample after scrolling.

This worker has no Android device and no `/dev/kvm`; `adb devices` was empty.
The assembled instrumentation APK could not be executed. This limitation does
not affect either blocking finding: the quality-gate failure is reproduced on
the host, and the signed APK's embedded files/layout were executed directly.

## Defects by severity

| Severity | Defect |
| --- | --- |
| P0 | None found. |
| P1 | `npm run test:android:full` and the exact-SHA Android CI workflow fail because the artifact verifier requires obsolete copy. |
| P1 | The signed APK embeds the pre-polish UI; its one-click sample's due title and controls begin 729–1,149 px below the first mobile viewport. |
| P2 | The APK retains multiple copy/terminology violations that the candidate reports as fixed on the web. |

## Required before re-verification

1. Update the fresh-APK verifier to assert the candidate's current
   `acknowledged` terminology and make `npm run test:android:full` green.
2. Build a version-bumped signed APK from the candidate's synchronized native
   bundle, update the download/digest/release record, and preserve signer
   continuity.
3. Run `demo-ready`, copy audit, and candidate-bundle equality against the
   signed APK itself, not only the web build or an older immutable baseline.
4. Confirm the rebuilt APK's one-click 390 x 844 demo places the due title,
   Acknowledge, and Snooze inside the first viewport.

Raw evidence is under `.factory/qa-evidence/`.
