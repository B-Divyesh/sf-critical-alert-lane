# Adversarial first-read review 2 — Critical Alert Lane

Date: 2026-08-29
Live URL: <https://critical-alert-lane.sociobot.in>
Reviewed commit: `4958895a434e55237a72cd279861010478077754`

## Verdict

**PASS.** The fresh full review found zero blocking, major, minor, unlisted-claim, or untested-claim findings.

## Cold first screen

Fresh Chromium contexts at 390 × 844 and 1440 × 900 loaded `/` at scroll position zero. Before scrolling, the product was clear:

- It repeats a few critical Android reminders until the person snoozes or acknowledges them.
- It is for Android users overwhelmed by notifications.
- Click **Try it with sample data** first; it opens three isolated samples.

The exact copy that supplied those answers was:

> Keep critical Android reminders repeating.

> For Android users overwhelmed by notifications, repeat medicine, deadline, and call reminders until you snooze or acknowledge them.

> Try it with sample data

At 390 px, `Opens three isolated sample reminders.` and all three facts (`Private: data stays on this device.`, `Offline after the first visit.`, and `US$4.99 once for unlimited reminders.`) were visible in the first viewport. No cold-read blocker applies.

## Copy audit

The complete, not sampled, sentence inventory is in [`copy-audit.md`](./copy-audit.md): it lists every landing/demo and README sentence or standalone line with its Unicode-token count. I reran `npm run test:copy` in the clean clone; it passed and reproduced the inventory.

The landing/demo inventory contains 30 sentences (4–18 words). The README inventory contains every reader-facing sentence and standalone line (1–17 words). No sentence exceeds 22 words and no banned marketing word occurs.

The audit's terminology table consistently uses **reminder**, **snooze**, **acknowledge**, **paused**, and **license**. Heading/action review found no violations: headings name their sections (`Reminder needing acknowledgement`, `Your reminders`, `30-day acknowledgement rate`, `Android notification permission`) and all controls name results (`Try it with sample data`, `Add critical reminder`, `Acknowledge`, `Snooze`, `Reset demo`, `Start for real`, `Export backup`, `Restore purchase`). No rewrite is required.

## Demo and sandbox

One click from `/` opened `/?demo=1`. The 390 × 844 initial viewport showed the persistent `Demo — sample data, nothing is saved` banner, **Reset demo**, **Start for real**, the due `Take evening medicine` sample and note, and both **Acknowledge** and **Snooze**. The other opinionated samples were `Call the insurance case worker` and `Water the balcony plants`.

I acknowledged the due sample, confirmed its handling control disappeared, selected **Reset demo**, and confirmed **Acknowledge** returned. IndexedDB listed the distinct `critical-alert-lane` and `demo:critical-alert-lane` databases. The declared isolation test separately seeds real data and passed. A normal fresh demo flow made only same-origin requests; the fresh offline/service-worker claim tests also passed.

## Claims

In a disposable clean local clone with a fresh `npm ci`, every exact command in `.factory/claims.json` ran independently and passed:

| Claim IDs | Result |
| --- | --- |
| `offline-reload`, `safe-import`, `free-limit`, `local-private`, `repeat-until-handled`, `demo-isolation`, `demo-ready` | PASS |
| `data-portability`, `rolling-score`, `schedule-and-undo`, `quiet-hours`, `repeat-range`, `pwa-installable` | PASS |
| `android-permission-boundary`, `timing-limits`, `core-free`, `native-background-repeat`, `lifecycle-recovery` | PASS |
| `apk-download`, `apk-source-identity`, `apk-update-signing`, `repo-no-signing-secrets` | PASS |
| `one-time-license`, `billing-data-boundary`, `billing-processor-refunds`, `license-recovery` | PASS |

The Android artifact checks confirmed published APK 1.0.6 identity, embedded web assets, repeat/lifecycle paths, and signer continuity from 1.0.3. `npm test` (23 tests), `npm run test:copy`, and `npm run build` also passed in that clone.

I cross-checked the live landing and README. Privacy/local-only, sample isolation, repeating behavior, schedules, quiet hours, backups, free limit, offline, native timing, APK identity, checkout, Dodo/refunds, and recovery statements each have their matching claims entry. No unlisted claim was found.

## Earlier finding closure

I read every earlier review, polish record, and handoff. Each previous finding was verified on the live product and in source/tests, not accepted merely because a document marked it fixed.

| Earlier ID | Direct confirmation |
| --- | --- |
| F-1-1 | Demo starts on the usable due reminder; 390 px handling controls are above the fold. |
| F-1-2 | Direct `/#how-it-works` scrolled to the target and focused `#how-title`; route-focus restores hash navigation. |
| F-1-3 | `demo-ready` exists and passed. |
| F-1-4 | Dodo/refund wording is covered by the passing `billing-processor-refunds` claim. |
| F-1-5 | The inexact-alarm warning is covered by the passing `timing-limits` claim. |
| F-1-6 | `local-private` passed request, storage, cookie, account/ad, and font checks. |
| F-1-7 | Fresh 404 had designed content plus canonical, OG/Twitter, favicon, and Apple-touch metadata. |
| F-1-8 | Direct hash focus works; source handles legal navigation and Back focus. |
| F-1-9 | All three hero facts are above the mobile fold. |
| F-1-10 | Hero eyebrow is `REPEATING ANDROID REMINDERS`. |
| F-1-11 | The cassette caption literally describes the art. |
| F-1-12 | Current label is `DUE NOW`. |
| F-1-13 | Current heading is `Reminder needing acknowledgement`. |
| F-1-14 | Empty heading says no reminders need acknowledgement now. |
| F-1-15 | Empty instruction says how to make a reminder appear. |
| F-1-16 | Saved-list label is `SAVED REMINDERS`. |
| F-1-17 | Saved-list heading is `Your reminders`. |
| F-1-18 | History label is `LAST 30 DAYS`. |
| F-1-19 | History heading is `30-day acknowledgement rate`. |
| F-1-20 | Step two is `Choose the reminder schedule`. |
| F-1-21 | Permission heading is `Android notification permission`. |
| F-1-22 | Header control is `Open settings`. |
| F-1-23 | Copy audit confirms the standard terms critical reminder, snooze, and acknowledge. |
| F-1-24 | Digest sits in `Verify the APK download` with a plain instruction. |
| F-1-25 | Payment copy plainly names Dodo, payment/refunds, and Sociobot checkout. |
| F-1-26 | README heading is `Reminder schedules, repeats, and backups`. |
| F-1-27 | README says `Installs from supported browsers`; unexplained reader-facing PWA wording is gone. |
| F-1-28 | README says `backup file after confirmation`; format detail remains technical context. |
| F-1-29 | Reader-facing storage copy says `this browser on this device`. |
| F-1-30 | Shared tokenizer/audit passed, so every count is reproducible. |
| F-1-31 | Narrow repository-only signing-key statement and registered scan both passed. |

No earlier finding is unfixed, half-fixed, or regressed.

## Structure, routing, privacy, identity, and leverage

- `/`, `/?demo=1`, `/privacy/`, `/terms/`, and the designed 404 returned the appropriate status, a route-specific title, one h1, one main landmark, description, canonical URL, OG/Twitter image, SVG favicon, and Apple touch icon.
- Header/footer are consistent. Product links, legal routes, APK download, and Sociobot link returned 200; checkout deliberately returned its expected 303 to Dodo. `robots.txt` and `sitemap.xml` list the routes.
- The live response has a response-header CSP with `frame-ancestors 'none'`, self-hosted scripts/styles/fonts, and the explicit Sociobot billing origin. No normal cold/demo console errors appeared.
- The cassette-era zine identity matches `design.md`: paper/oxide palette, tape-label typography, hard-offset sheets, original cassette collage, and reduced-motion behavior. It is distinct from a generic SaaS template.
- The brief implies local repeating reminders, quiet hours, and backup portability; the product provides native scheduling plus import/export and offline local storage. An AI action is neither necessary nor decorative here. No missed-leverage finding applies.

## What would make this perfect

Nothing product-facing remains from this review. Maintain the existing claim coverage and repeat a physical-device Android notification delivery check when that environment is available; that is prudent release validation, not an observed product defect in this sandbox.
