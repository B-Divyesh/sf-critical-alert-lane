# Perfection-loop polish 1

Date: 2026-08-29

Candidate: `dc4fb14080cfc33bdf70533419002d5a03191e3f`

Review: `c1b43a5c282b440ef5939d50c0d45e58fd38c3ec`

Repair: `c2f9eea4bb909efde53965b8fa2eef47bb165f15`

Live URL: <https://critical-alert-lane.sociobot.in>

Every finding in `.factory/review-1.md` is closed. There were no earlier
`.factory/review-*.md` or `.factory/polish-*.md` files beyond that report.

## Finding map

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | The demo omits the landing hero and opens on a compact demo heading followed by the due medicine reminder, Acknowledge, and Snooze. | `@claim:demo-ready`; [demo mobile](../docs/evidence/polish-1/demo-mobile.png); live `/?demo=1` cold check in `live-check.json`. |
| F-1-2 | Hash navigation now uses history, restores an exact section offset, focuses the section heading, announces it, and repeats this after Back. | `restores section scroll and heading focus for direct links, navigation, and Back`; [deep-link mobile](../docs/evidence/polish-1/how-deep-link-mobile.png); live mobile and desktop `/#how-it-works` plus Back passed. |
| F-1-3 | Added the `demo-ready` claim and its single tagged test for one-click entry, three named samples, database separation, and mobile-fold controls. | `@claim:demo-ready`; `clean-claims.log`; live `/?demo=1` showed both database names and three samples. |
| F-1-4 | Registered `billing-processor-refunds`, added a recorded checkout contract, and rewrote the statement in plain words. | `@claim:billing-processor-refunds`; `live-billing.json` records the live 303 redirect to `checkout.dodopayments.com`; [terms](../docs/evidence/polish-1/terms-full-desktop.png). |
| F-1-5 | Registered `timing-limits`; the test pairs the visible delay warning with Android's inexact `setAndAllowWhileIdle` branch. | `@claim:timing-limits`; `clean-claims.log`; live landing limits checked at `/`. |
| F-1-6 | Expanded `local-private` to test requests, cookies, storage, account/ad surfaces, and font sources; personal-data permissions remain covered separately. | `@claim:local-private` and `@claim:android-permission-boundary`; live check found zero external/font requests, cookies, or local-storage keys in demo. |
| F-1-7 | Added canonical, Open Graph, Twitter, and Apple-touch metadata to the designed 404 and extended regressions. | `renders the designed 404 with complete route metadata`; [404](../docs/evidence/polish-1/404-desktop.png); live unknown route returned 404 with all metadata. |
| F-1-8 | Internal route transitions mark the destination; legal pages and rendered app routes focus and announce their new headings. | Route-focus browser test; [privacy focus](../docs/evidence/polish-1/privacy-focus-desktop.png); live Privacy focus and Back focus passed. |
| F-1-9 | The primary demo action now precedes all three compact facts; secondary add/APK actions follow them on mobile. | `keeps all three first-screen facts visible on a 390px phone`; [landing mobile](../docs/evidence/polish-1/landing-mobile.png); all three facts ended above 844 px live. |
| F-1-10 | Replaced `ONE LANE. NO FEED.` with `REPEATING ANDROID REMINDERS`. | Copy-audit regression; [landing mobile](../docs/evidence/polish-1/landing-mobile.png); live `/` checked. |
| F-1-11 | Replaced the metaphorical caption with a literal description of the cassette artwork. | Copy-audit regression; [full landing](../docs/evidence/polish-1/landing-full-desktop.png); live `/` checked. |
| F-1-12 | Replaced `TRACK 01 / NOW` with `DUE NOW`. | Copy-audit regression; [demo mobile](../docs/evidence/polish-1/demo-mobile.png); live `/?demo=1` checked. |
| F-1-13 | Renamed the current section `Reminder needing acknowledgement`. | Copy-audit regression; [demo mobile](../docs/evidence/polish-1/demo-mobile.png); live `/?demo=1` checked. |
| F-1-14 | Replaced the empty heading with `No reminders need acknowledgement now.` | Copy-audit regression and real-lane Start-for-real check; [full landing](../docs/evidence/polish-1/landing-full-desktop.png); live `/` checked. |
| F-1-15 | Replaced the metaphorical empty instruction with `Add a reminder to see it here when it is due.` | Copy-audit regression; [full landing](../docs/evidence/polish-1/landing-full-desktop.png); live `/` checked. |
| F-1-16 | Replaced `TRACK 02 / QUEUE` with `SAVED REMINDERS`. | Copy-audit regression; [demo mobile](../docs/evidence/polish-1/demo-mobile.png); live demo checked. |
| F-1-17 | Renamed the saved list `Your reminders`. | Copy-audit regression; [full landing](../docs/evidence/polish-1/landing-full-desktop.png); live `/` checked. |
| F-1-18 | Replaced `30-DAY SIGNAL CHECK` with `LAST 30 DAYS`. | Copy-audit regression; [full landing](../docs/evidence/polish-1/landing-full-desktop.png); live `/` checked. |
| F-1-19 | Renamed the history empty state `30-day acknowledgement rate`. | Copy-audit regression and `@claim:rolling-score`; [full landing](../docs/evidence/polish-1/landing-full-desktop.png); live `/` checked. |
| F-1-20 | Renamed step two `Choose the reminder schedule`. | Copy-audit regression; [deep-link mobile](../docs/evidence/polish-1/how-deep-link-mobile.png); live deep link checked. |
| F-1-21 | Renamed the permissions heading `Android notification permission`. | Copy-audit regression and `@claim:android-permission-boundary`; [full landing](../docs/evidence/polish-1/landing-full-desktop.png); live `/` checked. |
| F-1-22 | Renamed the header action `Open settings`. | Keyboard-dialog browser test; [settings](../docs/evidence/polish-1/settings-desktop.png); live `/` checked. |
| F-1-23 | Standardized user-facing action terms to critical reminder, snooze, acknowledge, and acknowledgement. | Copy-audit terminology table plus repeat/undo tests; [full landing](../docs/evidence/polish-1/landing-full-desktop.png); live copy checked. |
| F-1-24 | Moved the digest into `Verify the APK download` details with instructions for comparing it. | `@claim:apk-download`; [landing mobile](../docs/evidence/polish-1/landing-mobile.png); live APK link returned 200. |
| F-1-25 | Replaced jargon and the ambiguous `there` with the specified Dodo/Sociobot sentence. | `@claim:billing-processor-refunds`; [terms](../docs/evidence/polish-1/terms-full-desktop.png); live checkout redirected to Dodo. |
| F-1-26 | Renamed the README section `Reminder schedules, repeats, and backups`. | `reproduces copy-audit counts with the shared Unicode tokenizer`; `clean-full-suite.log`; live product copy cross-check passed. |
| F-1-27 | Replaced unexplained `PWA` with `Installs from supported browsers`. | Copy-audit regression and `@claim:pwa-installable`; `clean-claims.log`; live manifest and service worker passed. |
| F-1-28 | Replaced user-facing `versioned JSON` with `backup file after confirmation`. | Copy-audit regression and `@claim:data-portability`; `clean-claims.log`; live legal routes remained reachable. |
| F-1-29 | Replaced user-facing `IndexedDB` with `this browser on this device`; database names remain only in technical sections. | Copy-audit regression and `@claim:local-private`; [privacy](../docs/evidence/polish-1/privacy-full-desktop.png); live privacy check passed. |
| F-1-30 | Added one Unicode tokenizer and deterministic generator, then regenerated every count. | `npm run test:copy` and `reproduces copy-audit counts with the shared Unicode tokenizer`; `clean-full-suite.log`; live copy matched the build. |
| F-1-31 | Narrowed the statement to repository contents and registered a tracked-file signing-secret scan. | `@claim:repo-no-signing-secrets`; `clean-claims.log`; deployed build contains no signing material. |

## Shared evidence

- Every exact claim command: `docs/evidence/polish-1/clean-claims.log` — 26/26 passed in clean clone `/tmp/cal-polish-claims-OaCFrw`.
- Full clean-clone suite: `docs/evidence/polish-1/clean-full-suite.log` — unit, type, lint, copy, build, 74 browser tests, update, and Android instrumentation-source checks passed.
- Live browser record: `docs/evidence/polish-1/live-check.json`.
- Live link crawl: `docs/evidence/polish-1/live-links.json` — every HTTP link was below 400; checkout returned its expected 303.
- Deployment identity: `docs/evidence/polish-1/live-deployment-match.json` — 38 of 38 deployable files matched.
- Live Lighthouse: `docs/evidence/polish-1/lighthouse-live-mobile.json` — 100 performance, accessibility, best practices, and SEO.
