# Repair 15 handoff — PASS

Date: 2026-09-06

Work order: `critical-alert-lane-repair-15`

Live URL: <https://critical-alert-lane.sociobot.in>

## Outcome

The date-sensitive claim failure from `review-3.md` is fixed. Imported test
reminders now use dates relative to the test run. Saved-reminder assertions
are scoped to the saved list instead of assuming each title appears once on
the page.

The safe-import regression deliberately imports one reminder due one minute
ago. It verifies that the same reminder is visible in both the current-alert
panel and the saved list, then confirms that editing the second duplicate does
not change the first. This tests the user-visible outcome that triggered the
failure without matching implementation source text.

No runtime product file changed. The deployed PWA and APK remain the accepted
v1.0.6 product. Only the browser regression suite changed.

## Commits and deployment

- Review input/documentation SHA: `67bd88d485327ace04b3ce4fa4a634e402c3957f`
- Runtime implementation SHA: `60c2ccbb77b0df2d7ae50ac25e7e7e8b190cb035`
- Repair/test SHA: `73c751717304275f0377bde326a18bbc401be907`
- Published APK: v1.0.6/code 7, SHA-256
  `e902da576a34ede089010c2fbce721d811ea587106abe024eebcd33c47a5289e`

The repair SHA was pushed to `origin/main`. Its Android release workflow
completed successfully:
<https://github.com/B-Divyesh/sf-critical-alert-lane/actions/runs/34009450032>.

The production build was deployed through the existing
`sf-critical-alert-lane` Azure Static Web App. All 39 deployable files match
the live origin byte-for-byte. HTTPS returned 200 after deployment. The
runtime files are byte-identical to the earlier implementation because this
repair changes tests only.

## Clean-checkout verification

A fresh local clone at the repair SHA ran `npm ci` first. All 26 commands in
`.factory/claims.json` then ran independently and passed. The three claims
that failed review 3 now pass in both browser projects:

- `safe-import`: 2/2
- `demo-isolation`: 2/2
- `data-portability`: 2/2

The untagged malformed-import recovery case also passes in both projects.

The remaining clean-checkout gates passed:

| Command | Result |
| --- | --- |
| `npm test` | 23/23 passed |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run test:copy` | Passed |
| `npm run build` | Passed; `dist/` produced |
| `npm run test:e2e` | 74/74 passed |
| `npm run test:update` | Passed; `cal-v12` update and offline reload |
| `npm run test:android:artifact` | Passed; 28 assets, APK demo, native identity, and signer continuity |
| `npm run test:android:instrumentation` | Passed; SDK-free instrumentation/source checks |
| Exact-SHA Android CI | Passed full Gradle unit, lint, APK, and Android-test assembly gate |

The production bundle remains small: main JavaScript is 45.33 kB raw / 15.46
kB gzip, CSS is 17.15 kB raw / 4.47 kB gzip, and the hero AVIF is 44.63 kB.

## Live browser verification

Fresh 390 × 844 phone and 1440 × 900 desktop contexts opened the live root at
scroll position zero. Both first screens state:

- Job: **Keep critical Android reminders repeating.**
- Audience: Android users overwhelmed by notifications who need medicine,
  deadline, and call reminders repeated until snoozed or acknowledged.
- First action: **Try it with sample data**.

One click opened three realistic sample reminders. The due medicine reminder,
its note, Acknowledge, and Snooze were visible in the first phone viewport.
The **Demo — sample data, nothing is saved** label stayed visible after an
acknowledgement and after reset. Reset restored the due sample. Starting for
real preserved a separately created real reminder and copied no sample data.

Normal, invalid, boundary, and recovery checks passed for create, reload,
acknowledge, Undo, maximum snooze, weekday and repeat limits, quiet hours,
malformed import, legal routes, and the intentional designed 404. Ordinary
flows made only same-origin requests and loaded no remote fonts. Normal routes
produced no console or page errors; the deliberate HTTP 404 produced only the
expected browser resource message.

Every discovered HTTP link and hash target passed. Product, legal, download,
and factory links returned 200; checkout returned its expected 303 redirect.

Keyboard focus, dialog focus return, the skip link, 44 px phone targets,
200% text, reduced motion, offline reload, route titles, one-h1 structure,
legal links, and update behavior passed. Playwright Axe found zero serious or
critical findings across the live root, demo, error state, Privacy, Terms,
phone 200% state, and designed 404. `scripts/verify-url.sh` passed all seven
local and live routes.

Fresh live Lighthouse 13 results for `/?demo=1`:

| Profile | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | 100 | 100 | 100 | 100 | 1.060 s | 6 ms | 0 |
| Desktop | 100 | 100 | 100 | 100 | 0.280 s | 0 ms | 0 |

## Earlier findings

Every report from `verification.md` through `verification-16.md`, all three
reviews, and `polish-1.md` was re-read before the change. The complete claims,
browser, live, route, accessibility, PWA, APK, signer, and exact-SHA Android CI
checks above cover the earlier fixes. None regressed. Review finding F-3-1 is
closed by the relative fixtures, scoped outcomes, passing individual claim
commands, and 74/74 browser result.

## Billing and catalogue records

The live US$4.99 one-time unlimited-reminders offer remains unchanged. The
checkout endpoint returns its expected hosted-checkout redirect. Fixture-backed
tests verify license entitlement and recovery; no paid feature was removed or
made free. Public offer metadata is in
`/work/.evidence/billing-offer.json`. The verb-first 79-character catalogue
description was copied to `/work/.evidence/catalog-description.txt`.

## Known limitations and next steps

The supplied static worker has no local JDK, Android SDK, emulator, or physical
device. The SDK-free Android checks passed locally, and the full Android
workflow passed for the exact repair SHA. On-device notification delivery was
not repeated in this session.

The two externally referenced files `/work/.evidence/qa-report.md` and
`/work/.evidence/qa-result.json` were absent. Their stated finding is fully
present in `.factory/review-3.md` and was reproduced before repair.

No product defect remains from this work order. A future release should still
include routine physical-device checks on API 23 and a current Android version.
