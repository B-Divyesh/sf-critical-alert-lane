# Verify repeating critical Android reminders — FAIL

Date: 2026-09-06  
Work order: `critical-alert-lane-verify-17`  
Live URL: <https://critical-alert-lane.sociobot.in>  
Implementation candidate: `60c2ccbb77b0df2d7ae50ac25e7e7e8b190cb035`  
Test repair: `73c751717304275f0377bde326a18bbc401be907`  
Documentation candidate: `56ffc54fdb8e6f2cc34bec257b1688309d85f191`

## Verdict

**FAIL.** Finding count: **1**. Untested claim count: **1**.

The deployed reminder product works in the checked browser, APK, and PWA
paths. However, one public claim has no runnable registered test. The work
order requires every declared command to pass and zero untested claims, so the
candidate cannot receive PASS.

## Finding

### F-17-1 — P1: the Android update claim has no tagged claim test

The `apk-update-signing` claim says that a person with v1.0.3 can install the
published v1.0.6 APK as an update. Its registered command is:

```sh
npm run test:e2e -- --grep @claim:apk-update-signing
```

From a clean checkout, that exact command exits 1 with `Error: No tests
found`. There is no `@claim:apk-update-signing` test in the browser suite.
This makes the claim untested under the claims contract.

`npm run test:android:update-signing` does pass and verifies the v1.0.3 to
v1.0.6 signer and version-code path. That is useful supporting evidence, but
it is not the declared command and does not repair the registry failure.

Required repair: register the passing Android signing command as this claim's
`test`, or add exactly one `@claim:apk-update-signing` test and keep the
registry command aligned. Re-run the exact registered command from a clean
checkout.

## First screen and demo

Fresh 390 x 844 phone and 1440 x 900 desktop contexts opened `/` at scroll
position zero.

- Job: **Keep critical Android reminders repeating.**
- Audience: Android users overwhelmed by notifications who need medicine,
  deadline, and call reminders repeated until they snooze or acknowledge them.
- First action: **Try it with sample data**; it says that it opens three
  isolated sample reminders.

All three privacy, offline, and one-time-price facts were inside the first
phone viewport. One click loaded the three realistic samples. The due medicine
reminder had Acknowledge and Snooze controls. The persistent label read
**Demo — sample data, nothing is saved**. Reset restored the due sample.
The independent browser flow also verified that demo changes did not enter the
real lane and that local real data persisted after leaving demo. The fresh
browser context was discarded afterward, so no verifier record was retained.

## Claim commands from a clean checkout

`npm ci` installed 148 packages with zero reported vulnerabilities. All 26
declared commands were run exactly as listed in `.factory/claims.json`.

| Result | Claim IDs |
| --- | --- |
| PASS (25) | `offline-reload`, `safe-import`, `free-limit`, `local-private`, `repeat-until-handled`, `demo-isolation`, `demo-ready`, `data-portability`, `rolling-score`, `schedule-and-undo`, `quiet-hours`, `repeat-range`, `pwa-installable`, `android-permission-boundary`, `timing-limits`, `core-free`, `native-background-repeat`, `lifecycle-recovery`, `apk-download`, `apk-source-identity`, `repo-no-signing-secrets`, `one-time-license`, `billing-data-boundary`, `billing-processor-refunds`, `license-recovery` |
| FAIL / untested (1) | `apk-update-signing`: registered Playwright grep finds no tests |

The repaired date-sensitive claims `safe-import`, `demo-isolation`, and
`data-portability` each passed in both desktop and phone projects.

## Other quality evidence

- `npm test`: 23/23 passed.
- `npm run typecheck`, `npm run lint`, `npm run test:copy`, and `npm run build`
  passed. The build produced `dist/`; main JavaScript is 45.33 kB raw / 15.46
  kB gzip and CSS is 17.15 kB raw / 4.47 kB gzip.
- `npm run test:e2e`: 74/74 passed.
- `npm run test:update` passed: `cal-v12` update and offline demo reload.
- `npm run test:android:artifact` and `npm run test:android:instrumentation`
  passed. The published v1.0.6 APK contains the current demo, native source
  fingerprints, and expected signer continuity.
- `scripts/verify-url.sh` passed for local and live `/`, `/demo/`, `/privacy/`,
  and `/terms/` routes.
- Fresh live Playwright/Axe checks found zero serious or critical issues on
  root, settings recovery, populated demo, Privacy, Terms, designed 404, and
  390 px demo at 200% text. Keyboard skip link, visible focus, dialog focus
  return, invalid-input recovery, max snooze, quiet-hours boundary, undo,
  reduced motion, 44 px targets, offline reload, and same-origin/no-font
  requests passed. Normal routes had no console or page errors.
- The deliberate unknown route returned HTTP 404 with the designed **Page not
  found** page. Its browser resource message was expected and was not counted
  as a defect.
- Live `/`, `/?demo=1`, `/demo/`, `/privacy/`, `/terms/`, `/404.html`, PWA
  manifest, robots, sitemap, and published APK all returned 200. The 39 public
  build files matched the live origin byte-for-byte. The non-public
  `staticwebapp.config.json` is deployment configuration and correctly is not
  served as a public file.

## Earlier findings

Every prior verification, review, and polish record was inspected. The prior
product defects remain closed: native scheduling and permissions, import-ID
collisions, one-click demo isolation, the 30-day score, APK freshness,
signer continuity, invalid import recovery, mobile demo layout, route focus,
404 metadata, copy, and the date-sensitive fixtures are all covered by the
passing commands and live checks above. In particular, review-3 finding
F-3-1 is closed by the now-passing `safe-import`, `demo-isolation`, and
`data-portability` commands and 74/74 browser result.

F-17-1 is a separate, current claims-registry defect. No other finding or
untested claim was found.

## Scope and limitation

No product code was modified in this verification. The supplied worker does
not provide a physical Android device; the released APK's static/native,
artifact, and browser-embedded demo checks passed, but physical notification
delivery was not repeated here.
