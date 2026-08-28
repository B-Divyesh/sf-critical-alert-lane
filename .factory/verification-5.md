# Independent verification 5 — FAIL

Date: 2026-08-28
Candidate: `6d410a66fcecd5c28f12fc4835bb4700afe3439c`
Production: <https://critical-alert-lane.sociobot.in>

## Result

**FAIL. Do not release this candidate.** Two non-negotiable acceptance gates fail from fresh evidence: the product has no one-click, isolated sample-data demo, and the listed claim tests do not run from a clean checkout using their documented commands.

## Cold first read

I opened production in a new Chromium context at 1280px, without saved state. It says **“Reminders that wait for an answer”** and explains that a private lane repeats until a person acknowledges or snoozes it. The visible first action is **“Add critical reminder.”** It does not plainly identify the intended Android user overwhelmed by notification noise, and it offers no **“Try it with sample data”** action. Therefore a cold visitor cannot use the required sandbox in one click. This alone is an explicit FAIL condition in the work order.

`/demo` and `/?demo=1` both return HTTP 200 only through the SPA fallback; they render the ordinary empty application. Neither contains sample data, a “Demo — sample data, nothing is saved” banner, Reset demo, Start for real, or a separate demo storage namespace. `.factory/demo.md` is absent.

## Release-blocking defects

### P0 — Required demo sandbox is absent

The researched product must be tryable immediately and safely. Production has no sample-data action on its first screen and no functioning demo route or isolated storage. A visitor must begin entering real reminder data instead.

### P0 — Claims gate fails from a clean clone

Before building anything, I installed the lockfile with `npm ci` and invoked every command in `.factory/claims.json` exactly as listed. All six browser commands (`offline-reload`, `safe-import`, `free-limit`, `local-private`, `apk-download`, and `one-time-license`) use `playwright.config.ts`, whose `webServer` starts `npm run preview`. On a clean clone `dist/` does not exist; Vite responds `404` to `/` and Playwright exits 1:

```text
Error: Timed out waiting 60000ms from config.webServer.
```

The `test-results/.last-run.json` result was `{"status":"failed","failedTests":[]}`. The listed native `native-background-repeat` command also failed here because the required Gradle invocation cannot start: `JAVA_HOME is not set and no java command could be found`. A later production build allowed the web suite to pass, but does not repair the clean-clone claim contract.

In addition, every browser claim test starts at `/`, not at `/demo` or `?demo=1`, so even a prebuilt run does not prove the mandatory isolated demo sandbox.

### P1 — Core reminder promise is an unlisted claim

The first-screen sentence says reminders repeat until acknowledged or snoozed, and README makes the same reliability promise. `claims.json` has no exact observable claim test for the central normal reminder flow in its required demo sandbox. `native-background-repeat` is narrower (a Robolectric native alarm path) and its listed test could not run in this clean environment. The claims contract requires visitor-reliant statements to be listed and proven.

### P2 — No real 404 route

`https://critical-alert-lane.sociobot.in/not-a-real-route` returns HTTP 200 and the normal app rather than a designed 404 with a way back. The repository has no `404.html`. This violates the required site routing skeleton.

### P2 — Required URL verifier is absent

No `verify-url.sh` exists in the candidate, so the worker accessibility check named in the acceptance instructions cannot be run. I performed its equivalent live checks manually (title, `lang`, main, image treatment, requests, and console) and ran axe through Playwright; those checks passed, but the prescribed reusable verifier is missing.

### P2 — Android test/build gates are not executable in this worker

Both `npm run test:android` and `npm run test:android:instrumentation` completed the native web bundle check, then stopped at Gradle with no JDK/`JAVA_HOME`. This establishes no native functional failure by itself, but it leaves the APK and the required native repeat claim unverified in the supplied clean worker.

## Automated evidence

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 148 packages, 0 vulnerabilities |
| Every listed claim command before build | **FAIL** — browser commands time out waiting for the 404 preview server; native command cannot start Gradle without Java |
| `npm test` | PASS — 13 tests |
| `npm run build` | PASS — `tsc --noEmit` and Vite `dist/` |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test:e2e` after build | PASS — 32/32 (including desktop/mobile, offline, import, limit, APK, privacy, license and axe tests) |
| `npm run test:android` | BLOCKED/FAIL — no JDK (`JAVA_HOME` unset) |
| `npm run test:android:instrumentation` | BLOCKED/FAIL — no JDK (`JAVA_HOME` unset) |

## Product, accessibility, privacy, and deployment evidence

- Production is the candidate’s web build: 25 of 25 served `dist/` files matched byte-for-byte, including `app-BtkAAOLW.js` and `app-BPCA9V18.css`. The only local file not served is deployment configuration (`/staticwebapp.config.json` correctly returns 404).
- Normal app use after the build passed in the automated suite: create, persistence/reload, due acknowledgement with Undo, recurrence, quiet hours, malformed import rejection/recovery, duplicate-ID repair, and free-limit import preservation. Live smoke testing confirmed validation message “Enter what needs your answer. A title cannot be blank.” with no console/page error, then successful reminder arming.
- Production offline reload worked after service-worker control: offline state and Add critical reminder remained available, with no errors.
- A fresh normal live flow requested only product-origin HTML, JS, CSS, and self-hosted art. No analytics/tracker or third-party font/script request was observed. Invalid license restore is intentionally the separate Sociobot API path described by the product.
- Production returned security headers including HSTS, `nosniff`, CSP with `frame-ancestors 'none'`, `Referrer-Policy: strict-origin-when-cross-origin`, and an appropriate Permissions Policy. Hashed JS/CSS and the APK are immutable for one year; HTML is `max-age=300, must-revalidate`.
- The billing verification endpoint enforced a single-client allowance: the first 30 invalid verification requests returned 200; attempt 31 returned `429` with `Retry-After: 3`.
- At 390×844 there was no horizontal overflow. Visible focus on the primary button was a 4px yellow outline with 3px offset. Reduced-motion desktop axe testing found **zero serious or critical violations**; live console/page errors were zero. The existing all-suite axe checks also passed in both configured Chromium projects.
- Build budget: JS 37,158 B (13.28 kB gzip), app CSS 12,471 B (3.59 kB gzip), hero AVIF 44,626 B. These are within the stated static budgets.
- The downloadable APK is present and internally ZIP-valid: 3,676,178 B, SHA-256 `06382ba158e7cd4a28222e14a81174150b574daabe17af9be62cac91213e3c16`, equal to production’s displayed digest. It was not installed or device-tested because the worker lacks Java/Android command-line tooling.

## Required repair before another verification

1. Add a visible first-screen **Try it with sample data** action and a real `/demo` (or `?demo=1`) namespace with sample reminders, persistent demo banner, Reset demo, Start for real, and `.factory/demo.md`.
2. Make every claim command self-contained from `npm ci` (for example, ensure the Playwright web-server builds before previewing) and run each claim only through the demo entry point. Restore a JDK/`JAVA_HOME` for the documented Android claim and quality gates.
3. Add an exact demo-sandbox claim for the repeat-until-handled job and a real 404 route.
