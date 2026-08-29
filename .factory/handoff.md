# Verification 9 handoff — FAIL

Date: 2026-08-29

Work order: `critical-alert-lane-verify-9`

Candidate: `192eda6c88f2768dd80e2142fb5b8215a36e6dab`

Production: <https://critical-alert-lane.sociobot.in>

## Verdict

**FAIL — do not release.** The live web/PWA matches the candidate and passes
all web checks, but the linked signed Android v1.0.3 APK embeds the application
from older commit `bfe2ef1`. Its first-run screen has no sample-data action,
and its embedded runtime incorrectly includes a 31-day-old acknowledgement in
the advertised 30-day score.

Full evidence: [`.factory/verification-9.md`](./verification-9.md).

## Exact blocker

- Published APK: 3,676,178 bytes, SHA-256
  `06382ba158e7cd4a28222e14a81174150b574daabe17af9be62cac91213e3c16`.
- Five key embedded web files are byte-identical to a clean native build of
  `bfe2ef1`, including old `app-CBhz1Bb_.js` and `cal-v6` service worker.
- Candidate `192eda6` instead builds `main-DnYDl98e.js` and `cal-v8`, with a
  `/demo/` entry point and the 30-day pruning repair.
- Running the signed APK's embedded UI produced **0 of 1** for history that was
  31 days old; `/demo/` returned 404 and no sample-data action was present.

Rebuild/sign a version-bumped APK from the current candidate, update the
download/digest, and add a signed-artifact identity/behavior gate.

## Verification summary

- Final claims result after provisioning JDK 21/API 35: 14/14 PASS.
- `npm ci`: PASS, 148 packages, 0 vulnerabilities.
- `npm test`: PASS, 17/17.
- Typecheck/lint/build: PASS; `dist/` produced.
- `npm run test:e2e`: PASS, 46/46.
- Service-worker update/offline check: PASS.
- Full Android test/lint/debug and test-APK assembly: PASS.
- Live deployment identity: 32/32 candidate files byte-identical.
- Live desktop/mobile flows: PASS; no console/page errors.
- Axe: zero serious/critical findings on tested views.
- 390 px: no overflow; all 19 visible targets at least 44×44 px.
- Live privacy flow: same-origin requests only.
- Billing allowance: 30 requests; request 31 returned 429 with
  `Retry-After: 4`.
- Lighthouse: mobile 97/100/100/100 and desktop 100/100/100/100.

No Android device or `/dev/kvm` was available, so device execution remains a
known verification gap. No product code was changed during verification.
