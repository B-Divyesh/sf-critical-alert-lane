# Adversarial first-read review 1 — Critical Alert Lane

Date: 2026-08-29

Live URL: <https://critical-alert-lane.sociobot.in>

Reviewed commit: `84ebfc6c59e2754d65f90964d4bb54822debcb1a`

## Verdict

**FAIL**

Two blocking findings remain. The one-click demo does not show the product in
use in its first mobile viewport, and the `How it works` deep link/back path is
broken. There are also unlisted claims, copy violations, route-focus defects,
and incomplete 404 metadata. A PASS requires zero findings and no untested
claim.

## Cold first screen

Fresh Chromium contexts were opened at 390×844 and 1440×900 with scroll
position 0.

- What it does: repeats a small set of critical Android reminders until the
  user handles them.
- For whom: Android users who lose medicine, deadline, or call alerts in a
  busy notification list.
- First click: **Try it with sample data**.

The cold-read clarity gate passes at both widths. The exact text that supplied
the answers was:

> Keep critical Android reminders repeating.

> For Android users overwhelmed by notifications, keep medicine, deadlines,
> and calls visible until you handle them.

> Try it with sample data

The mobile viewport shows only two of the required three plain facts; that is
recorded as F-1-9 rather than a cold-read blocker because the three primary
questions are still answered.

## Findings

### Blocking

#### F-1-1 — The demo's first mobile screen does not show the product in use

- Location: 390×844, click **Try it with sample data**, resulting `/demo`
  viewport at scroll position 0.
- Exact visible copy: `Demo — sample data, nothing is saved`, `Try the
  repeating reminder below`, followed by the full landing headline and intro.
- Verification: the due `Take evening medicine` sample exists, but it is below
  the first 844 px. The viewport ends at **Download Android app (APK)**.
- Why this fails: the required first screen after the one click does not
  already look like the product being used. A phone visitor sees another hero,
  not a live reminder.
- Concrete fix: make `/demo` start at the due-reminder product surface. Keep
  the persistent demo banner, then place `Take evening medicine`, its realistic
  note/status, **Acknowledge**, and **Snooze** in the initial 390×844 viewport.
  Add a 390×844 test that clicks the landing action and asserts the current
  alert and at least one handling action are inside the viewport without a
  scroll.

#### F-1-2 — The How-it-works deep link and Back restoration return to the top

- Location: `/#how-it-works`, and Back after navigating from that anchor to
  `/privacy/`.
- Exact result: the URL retains `#how-it-works`, but `scrollY` is `0` and the
  target begins about `2075 px` below the viewport. Focus is on `<body>`.
- Why this fails: the section is rendered after the browser attempts anchor
  navigation. A copied deep link and browser Back both point to a section the
  visitor cannot see. Broken routing is blocking under the review contract.
- Concrete fix: after app render, restore the current hash target and focus its
  heading; on `popstate`/`hashchange`, restore both scroll and focus. Add direct
  load and Back tests for `/#how-it-works` at desktop and 390 px.

### Major

#### F-1-3 — The README's demo-readiness claims are not registered

- Location: README, **Try the demo**.
- Exact quotes: `Open the sample demo in one click.` and `It starts with three
  realistic reminders in a separate browser database.`
- Why this fails: these are product claims with no matching
  `.factory/claims.json` entry. Existing untagged policy coverage does not meet
  the one-claim/one-tag contract.
- Concrete fix: add a `demo-ready` claim and one `@claim:demo-ready` test that
  starts on the landing page, clicks once, verifies exactly three named
  samples, confirms the separate namespace, and verifies the due sample and a
  handling action are inside the first 390×844 viewport. This test should fail
  until F-1-1 is fixed.

#### F-1-4 — Dodo and refund statements are unlisted claims

- Locations: landing paid section and README **Price**.
- Exact quotes: `Sociobot checkout uses Dodo as merchant of record. Refunds are
  handled there.` and `Dodo is the merchant of record and handles refunds.`
- Why this fails: `billing-data-boundary` tests the Sociobot origin, local
  fields, and daily checks; it does not assert the payment processor or refund
  handler.
- Concrete fix: add a claim whose fixture/contract test proves the checkout's
  processor and refund route, or remove those statements. If retained, use the
  plain rewrite in F-1-25.

#### F-1-5 — The alert-delay limitation is an unlisted claim

- Location: landing, **Not for emergencies**.
- Exact quote: `Device power rules can delay alerts.`
- Why this fails: a visitor can rely on this safety statement, but no claim
  entry covers it. `android-permission-boundary` only proves the inexact-alarm
  fallback.
- Concrete fix: register a conservative `timing-limits` claim and test that
  declining exact alarms selects the inexact scheduling branch and keeps this
  warning visible. Avoid an unmeasurable timing promise.

#### F-1-6 — The no-account/no-ads/no-fonts promise exceeds its claim

- Locations: landing **Kept on your device** and README **Privacy and
  permissions**.
- Exact quotes: `The app has no account, ads, analytics, calendar, or contacts.`
  and `The app uses no account, ads, analytics, tracking pixels, or third-party
  fonts.`
- Why this fails: `local-private` proves same-origin requests and local reminder
  data. It does not explicitly test the absence of accounts, ad surfaces, or
  third-party font declarations.
- Concrete fix: expand the registered privacy claim and its test to inspect the
  full rendered demo, requests, cookies/storage, CSS font sources, and account
  controls, or narrow the copy to the behavior the present test proves.

#### F-1-7 — The designed 404 omits required route metadata

- Location: an unknown live route such as `/__review_missing_page__`.
- Exact result: HTTP 404 and the designed page render correctly, but canonical,
  Open Graph title/image, and Apple touch icon are absent.
- Why this fails: the route is visually complete but cannot produce the same
  share/install identity as the rest of the site.
- Concrete fix: add the product social image, OG/Twitter metadata, Apple touch
  icon, and an intentional canonical policy for the 404 template. Add the 404
  to the metadata regression test.

#### F-1-8 — Route changes do not move focus to the new heading

- Locations: landing → `/privacy/`, `/#how-it-works`, and Back.
- Exact result: `document.activeElement` is `<body>`; the destination `<h1>` or
  section heading has no focus target.
- Why this fails: keyboard and screen-reader users receive no programmatic
  destination after navigation.
- Concrete fix: make route headings programmatically focusable, focus them
  after navigation without a visible-pointer regression, and announce the
  change in a polite live region. Test forward, deep-link, and Back focus.

#### F-1-9 — The mobile first screen omits the price fact

- Location: landing at 390×844, scroll position 0.
- Exact result: `Private: data stays on this device.` and `Offline after the
  first visit.` are visible; `US$4.99 once for unlimited reminders.` begins
  below the viewport.
- Why this fails: the mandatory first-screen shape requires all three short
  privacy/offline/price facts.
- Concrete fix: reduce the mobile hero's vertical footprint or move the three
  facts above the secondary APK action so all three fit without scrolling.

### Minor copy findings

#### F-1-10 — `ONE LANE. NO FEED.` is an information-free slogan

- Location: landing hero eyebrow.
- Why this fails: it is brand mood that could survive unchanged on another
  product and tells the visitor nothing usable.
- Concrete fix: delete it, or replace it with `REPEATING ANDROID REMINDERS`.

#### F-1-11 — `One protected signal, pulled out of the noise.` is metaphor

- Location: hero figure caption.
- Why this fails: `signal` and `noise` do not describe a capability or action.
- Concrete fix: use `A cassette tape forms one lane ending at a checked
  reminder.` or omit the decorative caption.

#### F-1-12 — `TRACK 01 / NOW` is decorative brand lore

- Location: current-alert section label.
- Why this fails: `track` borrows the cassette metaphor instead of naming the
  section.
- Concrete fix: delete it or use `DUE NOW`.

#### F-1-13 — `Answer this` does not name the section

- Location: current-alert `<h2>`.
- Why this fails: heard out of context, it does not identify a reminder or
  action state.
- Concrete fix: `Reminder needing action`.

#### F-1-14 — `The lane is clear.` is metaphorical empty-state copy

- Location: no-current-alert `<h3>`.
- Why this fails: it does not say whether there are no saved reminders or only
  no reminders due now.
- Concrete fix: `No reminders need action now.`

#### F-1-15 — `breaking through the noise` is metaphor, not instruction

- Location: no-current-alert empty state.
- Exact quote: `Add the first reminder worth breaking through the noise.`
- Concrete fix: `Add a reminder to see it here when it is due.`

#### F-1-16 — `TRACK 02 / QUEUE` is decorative brand lore

- Location: saved-reminder section label.
- Concrete fix: delete it or use `SAVED REMINDERS`.

#### F-1-17 — `Your critical lane` hides the section's content

- Location: saved-reminder `<h2>`.
- Why this fails: `lane` is a product metaphor, while the section contains
  reminders.
- Concrete fix: `Your reminders`.

#### F-1-18 — `30-DAY SIGNAL CHECK` uses an unexplained metaphor

- Location: acknowledgement-history section label.
- Concrete fix: `LAST 30 DAYS`.

#### F-1-19 — `Build a reliable streak` is a mood heading

- Location: empty acknowledgement-history `<h2>`.
- Why this fails: it does not name the metric that will appear.
- Concrete fix: `30-day acknowledgement rate`.

#### F-1-20 — `Choose its repeat` does not make sense out of context

- Location: How it works, step 2 heading.
- Concrete fix: `Choose the reminder schedule`.

#### F-1-21 — `Permission when needed` is too vague

- Location: Limits and privacy heading.
- Concrete fix: `Android notification permission`.

#### F-1-22 — `Settings` is a noun-only button

- Location: global app header.
- Why this fails: it does not name the result of pressing the control.
- Concrete fix: `Open settings`.

#### F-1-23 — Core action terminology changes between answer, handle, and acknowledge

- Locations: landing lede (`handle them`), `Answer this`, footer (`wait for
  your answer`), README opening (`important ... until you answer them`), and
  the **Acknowledge** action.
- Why this fails: the same action is described with three verbs, and the README
  changes `critical` reminders to `important` reminders.
- Concrete fix: keep `critical reminder`, `snooze`, and `acknowledge`
  everywhere. Example README opening: `Keep critical Android reminders
  repeating until you snooze or acknowledge them.` Example lede: `For Android
  users overwhelmed by notifications, repeat medicine, deadline, and call
  reminders until they snooze or acknowledge them.`

#### F-1-24 — The hero exposes unexplained checksum jargon

- Location: landing APK proof.
- Exact quote/location: `APK SHA-256:` followed by a 64-character digest.
- Why this fails: the raw digest interrupts first-time product copy without
  saying how to use it.
- Concrete fix: move it into a `Verify the APK download` disclosure with one
  plain sentence explaining that the value checks the downloaded file.

#### F-1-25 — `merchant of record` and `there` are avoidable jargon/ambiguity

- Location: landing paid section and README Price.
- Concrete fix: after registering the claim, use `Dodo processes the payment
  and handles refunds through Sociobot checkout.`

#### F-1-26 — README heading `What it does` is generic

- Location: README.
- Why this fails: it does not identify the subject when headings are heard as
  a list.
- Concrete fix: `Reminder schedules, repeats, and backups`.

#### F-1-27 — README uses `PWA` before explaining it

- Location: README What it does.
- Exact quote: `Installs as a PWA and reloads offline after the first visit.`
- Concrete fix: `Installs from supported browsers and reloads offline after
  the first visit.` Put `PWA` only in the developer section if needed.

#### F-1-28 — README presents `versioned JSON` as user-facing copy

- Location: README What it does.
- Exact quote: `Exports and imports versioned JSON with confirmation.`
- Concrete fix: `Exports and imports a backup file after confirmation.` Keep
  the JSON format detail under Storage and billing.

#### F-1-29 — README privacy copy uses the implementation term `IndexedDB`

- Location: README Privacy and permissions.
- Exact quote: `Reminder data stays in IndexedDB on this device during normal
  use.`
- Concrete fix: `Reminder data stays in this browser on this device during
  normal use.` Keep the database name in the technical storage section.

#### F-1-30 — The existing copy audit has incorrect word counts

- Location: `.factory/copy-audit.md`.
- Examples: the 16-word lede is recorded as 14; the 6-word demo banner is
  recorded as 7; the 6-word price fact is recorded as 5.
- Why this fails: the required proof of simplicity is not reproducible.
- Concrete fix: define one tokenizer in the audit generator/tests and
  regenerate the table. The counts below use Unicode word tokens while keeping
  joined versions/ranges such as `v1.0.5` and `5–60` as one word.

#### F-1-31 — The signing-key location statement is unlisted and broader than the evidence

- Location: README Android release identity.
- Exact quote: `The factory signing key and credentials stay outside this
  repository.`
- Why this fails: repository inspection can prove absence from this checkout,
  but not where credentials stay.
- Concrete fix: rewrite to `This repository does not contain Android signing
  keys or credentials.` Add a registered source/secret-scan test if this remains
  a published assurance.

## Copy audit

Counting method: Unicode letter/number tokens; joined versions, ranges, paths,
and hyphenated terms count as one word. Markdown code blocks are commands, not
sentences, and are excluded. No audited sentence exceeds 22 words. No banned
marketing adjective from the plain-words skill appears.

### Landing-page sentences

| Sentence | Words | Flag |
| --- | ---: | --- |
| Keep critical Android reminders repeating. | 5 | — |
| For Android users overwhelmed by notifications, keep medicine, deadlines, and calls visible until you handle them. | 16 | F-1-23 |
| Demo — sample data, nothing is saved. | 6 | — |
| Try the repeating reminder below. | 5 | — |
| Private: data stays on this device. | 6 | — |
| Offline after the first visit. | 5 | — |
| US$4.99 once for unlimited reminders. | 6 | — |
| Native Android alarms repeat after the app closes. | 8 | — |
| The signed APK contains v1.0.5 reminder logic and updates v1.0.3. | 10 | — |
| One protected signal, pulled out of the noise. | 8 | F-1-11 |
| The lane is clear. | 4 | F-1-14 |
| Add the first reminder worth breaking through the noise. | 9 | F-1-15 |
| Keep this list short on purpose. | 6 | — |
| Add medicine, a deadline, or the one call you must make. | 11 | — |
| Your acknowledgement rate appears here after you handle a reminder. | 10 | F-1-23 |
| History stays on this device. | 5 | — |
| Add the few reminders you cannot miss. | 7 | — |
| Choose a schedule and a 5–60 minute repeat. | 8 | — |
| Snooze or acknowledge each alert when it appears. | 8 | — |
| Reminder data stays on this device during normal use. | 9 | — |
| The app has no account, ads, analytics, calendar, or contacts. | 10 | F-1-6 |
| Android asks for notification access only after you choose it in Settings. | 12 | — |
| Without exact-alarm access, Android uses an inexact alarm. | 8 | — |
| Device power rules can delay alerts. | 6 | F-1-5 |
| Keep another safeguard for urgent or life-safety duties. | 8 | — |
| Free use arms three reminders and keeps extra imports paused. | 10 | — |
| Pay US$4.99 once for unlimited active reminders. | 8 | — |
| There is no subscription. | 4 | — |
| Core reminder controls, accessibility, and data export stay free. | 9 | — |
| Sociobot checkout uses Dodo as merchant of record. | 8 | F-1-4, F-1-25 |
| Refunds are handled there. | 4 | F-1-4, F-1-25 |
| Repeating Android reminders that wait for your answer. | 8 | F-1-23 |

### Landing headings, labels, and actions

| Copy | Words | Result |
| --- | ---: | --- |
| ONE LANE. NO FEED. | 4 | F-1-10 |
| Try it with sample data | 5 | Pass: result-naming action |
| Add critical reminder | 3 | Pass: result-naming action |
| Download Android app (APK) | 4 | Pass: result-naming action |
| TRACK 01 / NOW | 3 | F-1-12 |
| Answer this | 2 | F-1-13 |
| TRACK 02 / QUEUE | 3 | F-1-16 |
| Your critical lane | 3 | F-1-17 |
| 30-DAY SIGNAL CHECK | 3 | F-1-18 |
| Build a reliable streak | 4 | F-1-19 |
| How it works | 3 | Pass |
| Add a critical reminder | 4 | Pass |
| Choose its repeat | 3 | F-1-20 |
| Answer the alert | 3 | F-1-23 |
| Limits and privacy | 3 | Pass |
| Kept on your device | 4 | Pass |
| Permission when needed | 3 | F-1-21 |
| Not for emergencies | 3 | Pass |
| Three reminders are free | 4 | Pass |
| Buy once · US$4.99 | 3 | Pass: result and price |
| Restore a license | 3 | Pass: result-naming action |
| Settings | 1 | F-1-22 |
| Reset demo | 2 | Pass: result-naming action |
| Start for real | 3 | Pass: required demo-sandbox action |

### README sentences and standalone lines

| Sentence or standalone line | Words | Flag |
| --- | ---: | --- |
| Critical Alert Lane | 3 | — |
| Keep important Android reminders repeating until you answer them. | 9 | F-1-23 |
| It is for Android users who miss medicine, deadline, or call alerts in a busy notification list. | 17 | — |
| Live app: <https://critical-alert-lane.sociobot.in> | 4 | — |
| Sample demo: <https://critical-alert-lane.sociobot.in/demo/> | 4 | — |
| Android app: [Critical Alert Lane 1.0.5 APK](./public/downloads/critical-alert-lane-1.0.5.apk) | 8 | — |
| APK SHA-256: `af06a7f89d0afee99aa4fafe81d074ccd40a62c5d0d981dc46fda529d9b6c6e8` | 3 | F-1-24 |
| Try the demo | 3 | — |
| Open the sample demo in one click. | 7 | F-1-3 |
| It starts with three realistic reminders in a separate browser database. | 11 | F-1-3 |
| **Reset demo** restores the samples. | 5 | — |
| **Start for real** discards demo changes and opens your real reminder list. | 12 | — |
| What it does | 3 | F-1-26 |
| Supports one-time, daily, weekday, and weekly reminders. | 7 | — |
| Repeats every 5–60 minutes until you snooze or acknowledge the alert. | 11 | — |
| Offers overnight quiet hours without hiding a due alert. | 9 | — |
| Shows a score from acknowledgement history in the latest 30 days. | 11 | — |
| Exports and imports versioned JSON with confirmation. | 7 | F-1-28 |
| Repairs unsafe duplicate or hash-colliding import IDs. | 7 | — |
| Keeps extra imports paused above the three-reminder free limit. | 9 | — |
| Installs as a PWA and reloads offline after the first visit. | 11 | F-1-27 |
| Runs native Android alarms after the app closes. | 8 | — |
| Re-arms Android alarms after boot, clock changes, and time-zone changes. | 10 | — |
| Privacy and permissions | 3 | — |
| Reminder data stays in IndexedDB on this device during normal use. | 11 | F-1-29 |
| The app uses no account, ads, analytics, tracking pixels, or third-party fonts. | 12 | F-1-6 |
| It requests no contacts, calendar, location, camera, or microphone access. | 10 | — |
| Notification access is requested only after you choose it in Settings. | 11 | — |
| Android offers exact-alarm access from Settings when needed. | 8 | — |
| Android uses an inexact alarm when you decline exact-alarm access. | 10 | — |
| See [Privacy](./privacy/index.html) for export and billing details. | 8 | — |
| Price | 1 | — |
| Free use supports three active reminders and all safety controls. | 10 | — |
| US$4.99 once adds unlimited active reminders through Sociobot checkout. | 10 | — |
| There is no subscription. | 4 | — |
| Dodo is the merchant of record and handles refunds. | 9 | F-1-4, F-1-25 |
| You can paste an active license on another device. | 9 | — |
| See [Terms](./terms/index.html) for purchase terms. | 6 | — |
| Run and test | 3 | — |
| Use Node.js 20 or newer. | 5 | — |
| `npm run build` writes the static site to `dist/`. | 9 | — |
| Playwright 1.58.2 runs desktop and 390 px mobile checks. | 9 | — |
| The browser tests build and start their own preview server. | 10 | — |
| The native checks inspect the current shell and immutable v1.0.5 APK. | 11 | — |
| GitHub Actions installs JDK 21 and Android API 35 for full Gradle checks. | 13 | — |
| Run `npm run android:sync` after changing the web app. | 9 | — |
| Android release identity | 3 | — |
| The Android application ID is `in.sociobot.criticalalertlane`. | 6 | — |
| Version 1.0.5 uses build code 6. | 6 | — |
| Its signer matches the public v1.0.3 factory signer. | 8 | — |
| That identity lets Android install this APK over v1.0.3. | 9 | — |
| The factory signing key and credentials stay outside this repository. | 10 | F-1-31 |
| Provide the four `ANDROID_RELEASE_*` variables to create a signed release. | 11 | — |
| Then run `cd android && ./gradlew assembleRelease`. | 6 | — |
| Storage and billing | 3 | — |
| Real reminders use the IndexedDB database `critical-alert-lane`. | 7 | —: technical section |
| Demo reminders use the separate database `demo:critical-alert-lane`. | 7 | —: technical section |
| License tokens use `localStorage["sb_license:critical-alert-lane"]`. | 6 | —: technical section |
| The app stores one daily license result beside the token. | 10 | — |
| Only checkout and license checks contact the Sociobot billing API. | 10 | — |
| Payment details never enter or stay in this app. | 9 | — |
| Exports are unencrypted JSON files. | 5 | —: technical section |
| Store exports somewhere you trust. | 5 | — |
| Project records | 2 | — |
| Product scope: [`.factory/brief.json`](./.factory/brief.json) | 4 | — |
| Visual system and asset sources: [`.factory/design.md`](./.factory/design.md) | 7 | — |
| Demo sandbox: [`.factory/demo.md`](./.factory/demo.md) | 4 | — |
| Claims and tests: [`.factory/claims.json`](./.factory/claims.json) | 5 | — |
| Verification evidence: [`.factory/handoff.md`](./.factory/handoff.md) | 4 | — |
| Deploy | 1 | — |
| The factory deploys `dist/` as a static site. | 8 | — |
| Do not change DNS, billing, or infrastructure from this repository. | 10 | — |
| License | 1 | — |
| Released under the [MIT License](./LICENSE). | 6 | — |

## Demo and sandbox verification

- One-click entry: present and functional from the landing page.
- Persistent banner: present with the exact sample-data warning, **Reset
  demo**, and **Start for real**.
- Seed data: three specific reminders; `Take evening medicine` is due,
  `Call the insurance case worker` is a one-time follow-up, and `Water the
  balcony plants` is weekly.
- Reset: acknowledge removed the due action; **Reset demo** restored it.
- Exit: **Start for real** returned to `/` without sample reminders; returning
  to `/demo` restored clean samples.
- Namespace: live browser exposed separate `critical-alert-lane` and
  `demo:critical-alert-lane` IndexedDB databases. The declared isolation test
  independently seeded a real-only record and passed.
- Privacy: the complete live demo/offline flow requested only
  `https://critical-alert-lane.sociobot.in` resources.
- Offline: after service-worker control, a live offline reload retained the
  sample reminder and usable **Acknowledge** action.
- Blocking presentation defect: see F-1-1.

## Claims verification

The repository was checked out as a detached clean worktree at
`/tmp/cal-review-79n6xU`, followed by `npm ci`. Every exact command from
`.factory/claims.json` ran independently and exited 0.

| Claim ID | Exact command | Result |
| --- | --- | --- |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS, 2 projects |
| `safe-import` | `npm run test:e2e -- --grep @claim:safe-import` | PASS, 2 projects |
| `free-limit` | `npm run test:e2e -- --grep @claim:free-limit` | PASS, 2 projects |
| `local-private` | `npm run test:e2e -- --grep @claim:local-private` | PASS, 2 projects |
| `repeat-until-handled` | `npm run test:e2e -- --grep @claim:repeat-until-handled` | PASS, 2 projects |
| `demo-isolation` | `npm run test:e2e -- --grep @claim:demo-isolation` | PASS, 2 projects |
| `data-portability` | `npm run test:e2e -- --grep @claim:data-portability` | PASS, 2 projects |
| `rolling-score` | `npm run test:e2e -- --grep @claim:rolling-score` | PASS, 2 projects |
| `schedule-and-undo` | `npm run test:e2e -- --grep @claim:schedule-and-undo` | PASS, 2 projects |
| `quiet-hours` | `npm run test:e2e -- --grep @claim:quiet-hours` | PASS, 2 projects |
| `repeat-range` | `npm run test:e2e -- --grep @claim:repeat-range` | PASS, 2 projects |
| `pwa-installable` | `npm run test:e2e -- --grep @claim:pwa-installable` | PASS, 2 projects |
| `android-permission-boundary` | `npm run test:e2e -- --grep @claim:android-permission-boundary` | PASS, 2 projects |
| `core-free` | `npm run test:e2e -- --grep @claim:core-free` | PASS, 2 projects |
| `native-background-repeat` | `npm run test:android:claim` | PASS |
| `lifecycle-recovery` | `npm run test:android:lifecycle-claim` | PASS |
| `apk-download` | `npm run test:e2e -- --grep @claim:apk-download` | PASS, 2 projects |
| `apk-source-identity` | `npm run test:android:artifact` | PASS |
| `apk-update-signing` | `npm run test:android:update-signing` | PASS |
| `one-time-license` | `npm run test:e2e -- --grep @claim:one-time-license` | PASS, 2 projects |
| `billing-data-boundary` | `npm run test:e2e -- --grep @claim:billing-data-boundary` | PASS, 2 projects |
| `license-recovery` | `npm run test:e2e -- --grep @claim:license-recovery` | PASS, 2 projects |

No declared claim test failed. F-1-3 through F-1-6 and F-1-31 identify
claim-like copy without an adequate entry/test, so the product still has
untested claims and cannot pass.

## History verification

No earlier `.factory/review-*.md` or `.factory/polish-*.md` exists. The earlier
handoff describes one repaired malformed-import defect. It is confirmed fixed:

- Code catches parsing at the import boundary and returns the stable plain
  message.
- Live malformed import showed: `This file is not a valid Critical Alert Lane
  export. Choose a Critical Alert Lane export and try again. Your current
  reminders were not changed.`
- The pre-existing live reminder remained, and a later valid import succeeded
  without reload.

That earlier defect did not regress.

## Structure, accessibility, and visual identity

- `/`, `/demo`, `/privacy/`, and `/terms/` return 200; an unknown route returns
  the designed 404 response.
- All public routes have one `<h1>`, one `<main>`, `lang="en"`, descriptive
  titles, descriptions, canonical URLs, social cards, favicons, and Apple
  icons. The 404 exception is F-1-7.
- Titles follow the required product/route pattern and stay under 60
  characters.
- The live crawl found no dead public links. The APK, manifest, robots,
  sitemap, icons, and social image return 200. Mail links and checkout were
  treated as explicit special destinations.
- The factory `verify-url.sh` passed landing, demo, privacy, and terms with no
  console errors. Live Axe checks found zero serious or critical findings on
  those routes and the designed 404 at desktop/mobile test dimensions.
- Deep-link, Back, and focus defects are F-1-2 and F-1-8.
- The visual identity passes. The warm paper, oxide black, hard offset shadows,
  cassette collage, halftone texture, and mono typography are specific to this
  product and do not resemble a generic gradient SaaS template.
- The 404 uses the same visual system and provides a route home.

## Missed leverage

No missing AI feature is justified. The core job is deterministic local
scheduling; model use would add cost, network dependence, and privacy exposure
without improving the stated job. The brief-implied import/export path already
exists, the Android artifact is downloadable, and paid capacity can be restored
across devices. No provider keys or decorative AI feature were found.

## Additional verification

- `npm test`: PASS, 21/21.
- `npm run build`: PASS; `dist/` produced; main JS 15.07 kB gzip.
- `npm run test:e2e`: PASS, 60/60.
- Fresh live mobile and desktop contexts: no application console errors.
- Live offline/privacy request check: PASS.
- Dead-link/asset crawl: PASS, subject to the intentional 404 test route.

## What would make this perfect

Resolve every finding above, then re-run the review from a fresh browser and a
new clean worktree. The decisive acceptance checks are: a due sample and its
handling controls in the first 390×844 demo viewport; working direct hash and
Back restoration with heading focus; complete 404 metadata; one registered,
passing test for every retained claim; and a copy audit with no slogans,
metaphor headings, terminology drift, jargon, noun-only buttons, or incorrect
counts. There is nothing else to add: PASS requires that this section have no
remaining action.
