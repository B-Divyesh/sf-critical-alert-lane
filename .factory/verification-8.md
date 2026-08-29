# Independent product verification 8 — FAIL

Date: 2026-08-29

Work order: `critical-alert-lane-verify-8`

Candidate: `93ca408a9f65a26bf80728800a5a419409e81473`

Production: <https://critical-alert-lane.sociobot.in>

## Verdict

**FAIL. Do not release this candidate.** The live deployment matches the
candidate, the first-read/demo-entry gate passes, every declared claim passes
after provisioning the Android toolchain, and all web/native automated gates
pass. Fresh boundary testing nevertheless found that the advertised 30-day
reliability score retains history older than 30 days. The demo also preserves
changed sample data when a visitor leaves through the visible brand link,
contrary to the privacy text and demo contract. The formal claims manifest
does not list several promises made by the product and README. These are
release-blocking acceptance failures, not a deployment-only failure.

## Release-blocking defects

### P1 — The “30-day” reliability score includes older history

The brief uses a 30-day acknowledgement rate as its success measure, and the
live UI labels the result `30-DAY SIGNAL CHECK`. In a fresh live demo context I
imported a valid backup containing no reminders and one acknowledgement from
2026-07-01, more than 30 days before this verification. Production displayed:

```text
30-DAY SIGNAL CHECK
0% HANDLED IN TIME
0 of 1 acknowledged reminders were handled inside their escalation window.
```

The old record remained after reload. `acknowledgeCurrent()` prunes history
only when a new acknowledgement is made; `loadData()`, `prepareImport()`, and
`render()` do not apply the 30-day boundary. A user who stops acknowledging
items, or imports an older backup, receives a non-rolling score. This directly
undermines the researched success measure.

### P1 — Leaving the demo through the brand link does not discard demo data

The privacy page says, “Leaving the demo discards its sample data,” and the
demo contract requires demo state to be discarded on exit. Fresh live steps:

1. Open `/demo`.
2. Delete **Water the balcony plants**.
3. Use the visible **CRITICAL / LANE** brand link to leave for `/`.
4. Select **Try it with sample data** again.

The deleted sample was still absent. The brand is an ordinary link to `/` and
does not call `clearData()`; only **Start for real** clears the demo IndexedDB.
The visitor has visibly left demo mode, while `demo:critical-alert-lane` keeps
the changed sample state. This also makes the prescribed “nothing is saved”
banner misleading for this exit path.

### P1 — `.factory/claims.json` does not cover all published claims

All nine listed claim commands pass, but the claims contract also requires
every visitor-reliant statement in the live product and README to be listed
with one observable demo test. Unlisted promises include:

- the rolling 30-day handled-in-time score (which is demonstrably wrong);
- JSON export and ordinary replacement import;
- quiet hours muting notification repeats without hiding due alerts;
- one-time/daily/weekday/weekly scheduling and Undo;
- alarm recovery after boot, clock, and time-zone changes.

The `one-time-license` claim test is also copy/link-only: it asserts the price,
text, and checkout URL but does not assert a successful license return and
unlimited entitlement. Live checkout availability and invalid-license
handling were independently checked, but they do not prove the paid outcome.

Under the supplied claims policy, unlisted or non-outcome claims fail review.

## Other defects

### P2 — Demo actions miss the mobile touch-target minimum

At 390×844, **Reset demo** measured 100×36 CSS px and **Start for real**
measured 132×36 CSS px. Both are below the required 44 px height. All other
visible mobile controls measured at least 44×44 CSS px.

### P2 — Required discovery metadata is absent

The root and demo documents have valid titles and descriptions but no
canonical link, Open Graph metadata, Twitter card metadata, or apple-touch
icon. The supplied site-structure contract requires these on product routes.
The generated art is available, but no 1200×630 social image is wired into
page metadata.

## Mandatory first-read and demo gate

**PASS.** In a cold 1440×900 Chromium context, the first screen says:

- what it does: **Keep critical Android reminders repeating.**
- for whom: Android users overwhelmed by notifications;
- what to click first: **Try it with sample data**.

The action is visible in the first viewport. One click opens `/demo`, already
populated with three realistic reminders and a due medicine reminder. The
persistent banner says **Demo — sample data, nothing is saved** and provides
**Reset demo** and **Start for real**. The separate storage namespace is
`demo:critical-alert-lane`.

## Claims gate

The initial commands were invoked before dependency installation as explicitly
ordered and failed because `node_modules` was absent. After the required
`npm ci`, every browser claim passed from its self-building Playwright demo
entry. The native claim initially reported missing JDK/SDK in this disposable
worker; after installing OpenJDK 21 and the official Android API 35 SDK outside
the repository, the unchanged command passed.

| Claim | Result | Evidence |
| --- | --- | --- |
| `offline-reload` | PASS | 2/2 desktop/mobile Playwright cases |
| `safe-import` | PASS | 2/2; duplicate and Java-hash collision repair |
| `free-limit` | PASS | 2/2; fourth import preserved and paused |
| `local-private` | PASS | 2/2; ordinary demo flow stayed same-origin |
| `repeat-until-handled` | PASS | 2/2; sample snooze/reset/acknowledge |
| `demo-isolation` | PASS as written | 2/2; test covers **Start for real**, but not the broken brand-link exit |
| `native-background-repeat` | PASS | Robolectric API 30; next alarm re-armed at five minutes |
| `apk-download` | PASS | 2/2; bytes and displayed digest agree |
| `one-time-license` | PASS as written | 2/2 copy/link assertions; outcome coverage gap above |

Final listed-claim result: **9/9 entries pass** in a provisioned environment.

## Clean checkout and automated gates

The worktree began clean at the exact requested candidate; `HEAD`, `main`,
`origin/main`, and the requested SHA agreed. Dependency installation did not
change tracked files.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 148 packages, 0 vulnerabilities |
| `npm test` | PASS — 15/15 Vitest tests |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (TypeScript no-emit) |
| `npm run build` | PASS — exact production build produced `dist/` |
| `npm run test:e2e` | PASS — 36/36 across desktop and mobile Chromium |
| `npm run test:android:claim` | PASS after JDK 21/API 35 provisioning |
| `npm run test:android` | PASS — native unit tests, lint, app APK, and test APK |
| `npm run test:android:instrumentation` | PASS — repository-wide Android-test APK assembly |
| `scripts/verify-url.sh` on root/demo/privacy/terms | PASS |

Android debug and release variants each ran 13 host tests with zero failures
or errors. Android lint completed with zero errors and 23 warnings. The fresh
debug APK is 4,991,973 bytes, SHA-256
`3f77ed28f4832070a49cd96c1cfd46a827a7cfc00ac4a610d00c186180c7da6a`.

## Independent product exercise

Fresh live desktop and mobile contexts covered:

- blank-title rejection and in-dialog recovery;
- literal rendering of HTML-like title/note input with no script execution;
- a due weekday reminder at the 5-minute repeat and 24-hour escalation
  boundaries;
- acknowledgement, Undo, 180-minute snooze, and snooze persistence on reload;
- the three-active free boundary and actionable fourth-reminder error;
- invalid quiet hours followed by a valid overnight `23:59`–`00:01` save;
- JSON export of all three reminders;
- malformed JSON rejection without replacing the three saved reminders;
- sample acknowledgement, Undo, snooze, reset, and offline reload;
- invalid-license restore and query-token capture with immediate URL removal.

Normal and recovery flows produced no console or page errors. A link crawl
found no dead HTTP links: product routes and APK returned 200, checkout
returned its expected 303, and the external Sociobot link returned 200.

## Accessibility and responsive behavior

- Axe found zero serious/critical issues on populated demo, reminder editor,
  and Settings at desktop, and on the populated 390 px demo.
- Keyboard traversal reached the skip link, demo actions, brand, Settings,
  add, APK, acknowledge, snooze select, and snooze button in logical order.
- Focus used a visible 4 px yellow outline plus 2 px dark separation; Escape
  and focus return passed in the repository suite.
- The 390 px document had `scrollWidth === clientWidth === 390`.
- Reduced-motion matched; smooth scrolling became `auto`, and animation and
  transition durations became 0.01 ms.
- The two undersized demo actions are the touch-target defect above.

## Privacy, network, and server policy

- A full ordinary create/persist/reload flow made product-origin requests
  only. No analytics, ads, trackers, CDN fonts, or third-party scripts were
  observed.
- Invalid license restore made only the documented request to
  `https://api.sociobot.in` and failed softly with **That license is not
  active.** The token was stored under the documented localStorage key and
  stripped from the URL.
- The billing verification endpoint allowed 30 invalid requests from one
  client. Request 31 returned HTTP 429 with `Retry-After: 4`.
- Production checkout returned HTTP 303 to a hosted Dodo checkout session.
- HTTP redirects to HTTPS. Live responses include HSTS, CSP with
  `frame-ancestors 'none'`, Permissions-Policy, `nosniff`, DENY framing,
  COOP/CORP, and strict-origin referrer policy.
- Hashed JS/CSS and the APK are one-year immutable. `sw.js` is `no-store`;
  HTML is five-minute revalidated content; the manifest has the correct MIME.

## PWA, deployment identity, APK, and budgets

- Live service-worker control used `cal-v7-shell`; offline reload at 390 px
  retained the demo, showed the offline state, and produced no errors.
- A temporary in-memory copy of the exact build changed the worker cache from
  `cal-v7` to `cal-v8`. The page showed **An update is ready. Reopen the app to
  use it**, and the updated shell reloaded offline successfully.
- All 30 publicly served files from fresh `dist/` matched production
  byte-for-byte. `staticwebapp.config.json` was correctly excluded from public
  serving. Root HTML SHA-256 is
  `54eb71bd896abd678db298150880444ca0113361bf6e70b1ba43beed8319bba8`.
- The published APK is 3,676,178 bytes and matches the repository byte-for-byte
  at SHA-256
  `06382ba158e7cd4a28222e14a81174150b574daabe17af9be62cac91213e3c16`.
  APK v1/v2/v3 signatures verify; signer certificate SHA-256 is
  `f6a9ca54d7385c9d005b81de047d4937f6c447602e9fa8194cf0f870fc53265c`.
  Package is `in.sociobot.criticalalertlane`, version 1.0.3/code 4, min SDK 23,
  target/compile SDK 35. Permissions are Internet, notifications, exact alarm,
  boot recovery, and AndroidX's app-scoped receiver permission; there are no
  contacts, calendar, camera, microphone, or location permissions.
- Build payload: 39,411 B JS (14.01 kB gzip), 13,307 B app CSS (3.74 kB gzip),
  no font payload, and 44,626 B mobile AVIF hero. Static budgets pass.
- Fresh live Lighthouse 13.0.1: mobile 90 performance/100 accessibility/100
  best practices/100 SEO, FCP 1.17 s, LCP 1.37 s, TBT 402 ms, CLS 0; desktop
  100/100/100/100, FCP 0.29 s, LCP 0.33 s, TBT 0 ms, CLS 0.

No Android device or `/dev/kvm` is available in this worker, so the signed APK
could not be installed for a terminated-app notification smoke test. Native
evidence is limited to APK inspection, host/Robolectric tests, lint, and test
APK assembly. This limitation does not change the reproduced live failures.

## Required before re-verification

1. Prune history older than 30 days on load/import/render and add a claim test
   covering both sides of the 30-day boundary.
2. Clear demo storage whenever any control/navigation leaves demo mode, or
   prevent alternate exits; extend `demo-isolation` to cover every exit.
3. Add every published behavior to `.factory/claims.json` with one observable
   demo/native outcome test; make the paid test verify entitlement, not only
   copy and a link.
4. Increase both demo-banner controls to at least 44×44 CSS px.
5. Add canonical, Open Graph, Twitter-card, apple-touch, and product-specific
   social-image metadata.
