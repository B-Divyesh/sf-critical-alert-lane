# Polish 1 handoff — PASS

Date: 2026-08-29

Work order: `critical-alert-lane-polish-1`

Candidate: `dc4fb14080cfc33bdf70533419002d5a03191e3f`

Review: `c1b43a5c282b440ef5939d50c0d45e58fd38c3ec`

Repair commit: `c2f9eea4bb909efde53965b8fa2eef47bb165f15`

Deployment ID: `df34bfec-665a-4644-83fd-e1163eb39dc8`

Live URL: <https://critical-alert-lane.sociobot.in>

## What changed

- Made `/?demo=1` the one-click sample entry and kept `/demo/` as an alias.
- Put the due medicine reminder and both handling actions in the first 390×844
  demo viewport beneath a sticky demo/reset banner.
- Kept demo records in `demo:critical-alert-lane`; exit clears them without
  reading or changing the real reminder database.
- Added reliable hash scroll, History API navigation, Back restoration,
  heading focus, and polite route announcements.
- Completed route-specific titles, canonical/social metadata, Apple icons,
  legal links, and designed 404 metadata.
- Rewrote every phrase flagged in review 1 and standardized snooze/acknowledge
  terminology without changing the cassette-era zine design.
- Put the APK digest behind an explained disclosure.
- Added `demo-ready`, `timing-limits`, `billing-processor-refunds`, and
  `repo-no-signing-secrets` claims with one tagged test each.
- Expanded the privacy claim test across requests, cookies, storage, account
  and ad surfaces, and font sources.
- Added a deterministic Unicode copy-audit generator and corrected all counts.
- Updated the catalog sentence to 79 characters and a verb-first opening.
- Bumped the offline cache to `cal-v11` and the install manifest version to 6.

The complete finding-by-finding map is in `.factory/polish-1.md`.

## Verification

Clean clone: `/tmp/cal-polish-claims-OaCFrw` at repair commit `c2f9eea`.

- All 26 exact commands in `.factory/claims.json`: PASS.
- `npm test`: PASS, 23 tests.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run test:copy`: PASS.
- `npm run build`: PASS; `dist/` produced.
- `npm run test:e2e`: PASS, 74 tests across mobile and desktop.
- `npm run test:update`: PASS, including offline update reload.
- `npm run test:android:artifact`: PASS.
- `npm run test:android:instrumentation`: PASS.
- Published APK source identity and v1.0.3 → v1.0.5 signing upgrade: PASS.
- Initial JS: 15.46 KB gzip; CSS: 4.47 KB gzip.
- Local Lighthouse mobile: 100 performance, 100 accessibility, 100 best
  practices, 100 SEO; LCP 1.6 s, CLS 0, TBT 60 ms.
- Live Lighthouse mobile: 100 in all four categories; LCP 1.3 s, CLS 0,
  TBT 0 ms.

Evidence is under `docs/evidence/polish-1/`. The clean logs record every
command. The browser record reports zero serious/critical Axe findings, zero
app console errors, zero external demo requests, zero font requests, no
cookies, and no demo local-storage keys.

## Deployment and cold live check

The committed `dist/` was uploaded to the existing Azure Static Web App. No
DNS, billing, or infrastructure configuration was changed.

- All 38 deployable files matched production byte-for-byte after upload.
- `/`, `/?demo=1`, `/privacy/`, `/terms/`, and `/offline.html` returned 200.
- An unknown path returned 404 with the designed page and complete metadata.
- Every crawled HTTP link returned below 400; the checkout returned its
  expected 303 redirect to `https://checkout.dodopayments.com`.
- Cold 390×844 entry showed all three facts before the fold.
- One click opened the isolated demo; the due title, Acknowledge, and Snooze
  controls were all inside the first viewport.
- Acknowledge, Reset demo, Start for real, offline reload, direct hash entry,
  Privacy focus, and browser Back restoration all passed live.

## Known gaps

No review finding remains unresolved. This static-deploy worker has no JDK or
Android SDK, so `npm run test:android:full` could not run here. The required
SDK-less checks passed, the native project was synchronized, and the existing
signed v1.0.5 APK remained byte-identical and upgrade-compatible. A future
Android release work order can publish the synchronized web-copy polish in a
new signed APK; this work order did not alter the released APK.
