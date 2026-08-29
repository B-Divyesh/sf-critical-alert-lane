# Independent verification 10 — FAIL

Date: 2026-08-29
Verifier work order: `critical-alert-lane-verify-10`
Candidate commit: `25f1f1b2d64770af7f57049e8019e7b87c01006f`
Live URL: <https://critical-alert-lane.sociobot.in>

## Decision

**FAIL — release-blocking quality gates do not run from this clean verifier.**

The live site and its published Android artifact match this candidate exactly,
and the browser product checks are healthy. This is not enough to accept an
Android/PWA release: the documented standalone PWA update test fails, and each
of the three required native claim tests stops before executing because this
clean worker has no JDK (and no Android SDK platform directory). The claims
contract says any failing claim test blocks release.

## Release blockers

### P1 — `npm run test:update` is not runnable as documented

From a clean checkout after `npm ci` and the exact production `npm run build`,
the documented command failed:

```
> critical-alert-lane@1.0.0 test:update
> node scripts/verify-update.mjs

page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4174/demo/
```

`scripts/verify-update.mjs` assumes an already-running preview server on port
4174, but `package.json` starts no server and the README lists the command as a
standalone verification command. This means a clean verifier cannot execute
the required PWA update/offline check. Manually starting `npm run preview --
--port 4174` makes the test pass (`PASS: cal-v8 detected an update and the
updated demo reloaded offline.`), proving the test logic is useful but its
published command is broken.

### P1 — Required Android claim tests cannot execute in this clean worker

All three native entries in `.factory/claims.json` were invoked individually:

- `npm run test:android:claim`
- `npm run test:android:lifecycle-claim`
- `npm run test:android:artifact`

Each completed `build:native`, Capacitor sync, and the 26-file native-bundle
check, then failed before Gradle test/assembly with:

```
A JDK is required for Android checks. Install JDK 17+ or set JAVA_HOME.
```

There is no `java`, no `JAVA_HOME`, and no `/opt/android-sdk/platforms` in the
supplied clean worker. The full available Android gates (`npm run test:android`
and `npm run test:android:instrumentation`) fail at the same prerequisite.
Therefore native background repeat and boot/clock/time-zone recovery were not
executed in this verification. The candidate must provide a verifier image with
JDK/SDK or make its documented clean verification prerequisites explicit and
available before it can pass this Android release gate.

## Claims run first from the demo entry point

`.factory/claims.json` exists and contains 15 claims.

| Claim(s) | Result | Evidence |
| --- | --- | --- |
| `offline-reload`, `safe-import`, `free-limit`, `local-private`, `repeat-until-handled`, `demo-isolation`, `data-portability`, `rolling-score`, `schedule-and-undo`, `quiet-hours`, `apk-download`, `one-time-license` | PASS | Each exact listed `npm run test:e2e -- --grep @claim:…` command was run serially after clean `npm ci`; the chained process completed. The first command reported 2/2 passed; the final one-time-license command was reached and completed. |
| `native-background-repeat` | FAIL / not executed | Exact listed command stopped at missing JDK. |
| `lifecycle-recovery` | FAIL / not executed | Exact listed command stopped at missing JDK. |
| `apk-source-identity` | FAIL / not executed | Exact listed command stopped at missing JDK before clean release assembly. |

The published APK itself was independently checked without Gradle: its 26
embedded web assets exactly match `android/app/src/main/assets/public`, including
the demo entry point, and its SHA-256 is
`2af8e0b60ce77aa729b82e465626d9b37778e38f22b4665c80e6301bcd6327bf`.
That artifact evidence does not replace the failing clean native claim command.

## Product and live-deployment evidence

- **First-read, cold live page: PASS.** It says “Keep critical Android
  reminders repeating,” identifies Android users overwhelmed by notifications,
  and provides a first-screen **Try it with sample data** link. `/demo` opens
  the realistic sample lane with a persistent “Demo — sample data, nothing is
  saved” banner, Reset demo, and Start for real.
- **Normal and recovery flow: PASS.** On the live 390×844 page, created a
  weekly “Renew prescription” reminder, reloaded and found it persisted,
  received the labelled invalid-quiet-hours recovery message, and observed no
  console or page errors. The first keyboard tab reached a visibly outlined
  “Try it with sample data” link.
- **Accessibility: PASS.** `scripts/verify-url.sh` passed for live `/`,
  `/demo/`, `/privacy/`, and `/terms/`. Fresh desktop and 390 px mobile axe
  scans of live `/demo` found zero violations, including zero serious/critical;
  each page had one `h1` and one `main`. With reduced motion enabled the live
  alert transition is effectively instant (`0.00001s`) and scroll behavior is
  `auto`.
- **Privacy/network: PASS for ordinary use.** A cold live root and the live
  normal/reminder flow requested only product-origin HTML, JS, CSS, art, and
  service-worker assets; no analytics, tracker, external font, or script
  request occurred. The billing endpoint is only reached after an explicit
  restore/purchase action.
- **Server allowance: PASS.** Fresh invalid-license verification requests to
  `https://api.sociobot.in/api/v1/products/critical-alert-lane/verify` returned
  200 for attempts 1–30; attempt 31 returned **429** with
  `Retry-After: 3`. Observed allowance: 30 requests per client/window.
- **PWA offline: PASS on live.** After service-worker control at `/demo`, a
  fully offline reload retained the sample lane and showed “Offline · still
  working,” with no errors.
- **Headers/caching: PASS.** Live routes supply HTTPS/HSTS, CSP with
  `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, strict referrer
  policy, restrictive Permissions Policy, COOP/CORP, no-store service worker,
  and immutable hashed assets/APK. Unknown route returns a styled HTTP 404.
- **Deployment identity: PASS.** A fresh exact production build produced
  `dist/`; SHA-256 comparison of all 34 deployable files against live (excluding
  the deployment-only `staticwebapp.config.json`) found zero mismatches. The
  live v1.0.4 APK has the same published digest above.
- **Budgets: PASS.** Production main JS is 39.91 kB raw / 14.20 kB gzip and
  app CSS is 13.32 kB raw / 3.75 kB gzip, below the static-product budgets.

## Local gates

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 148 packages, 0 vulnerabilities |
| `npm test` | PASS — 17 tests |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — exact Vite production build, `dist/` produced |
| `npm run test:e2e` | PASS — full 46-test desktop/mobile Playwright suite completed without failure artifacts |
| `npm run test:update` | **FAIL** standalone; passes only after manually starting a port-4174 preview server |
| `npm run test:android` | **FAIL** — no JDK before Gradle |
| `npm run test:android:instrumentation` | **FAIL** — no JDK before Gradle |

## Required next steps

1. Make `test:update` self-start its preview server (or compose it with a
   server-owning Playwright config) so its documented command passes after a
   clean install/build.
2. Supply JDK 17+ and Android SDK platform tools in the Android verifier image,
   then re-run every native claim and the full Android build/instrumentation
   gates from a clean clone.
3. Re-verify after those gates pass; no deployment mismatch was found in this
   candidate.
