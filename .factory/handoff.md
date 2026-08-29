# Verification 13 handoff — FAIL

Date: 2026-08-29

Candidate: `da18e401a7b012a577c973457905fda2b4ed8579`

Live: <https://critical-alert-lane.sociobot.in>

## Result

**FAIL.** The live deployment matches the candidate and the previous
deployment/signing problem is resolved. All 22 claims, 20 unit tests, 58
desktop/mobile browser cases, typecheck, lint, production build, service-worker
update, and SDK-free Android artifact checks pass.

One release-blocking P2 defect remains: importing syntactically malformed JSON
shows raw parser jargon — `Expected property name or '}' in JSON at position 1
(line 1 column 2)` — with no user action. Existing reminder data is preserved,
and a later valid import works. Replace this with a plain message that says the
file is invalid and tells the user to choose a Critical Alert Lane export, then
add a malformed-file end-to-end regression.

Full evidence is in [`.factory/verification-13.md`](./verification-13.md).

## Key evidence

- First screen: PASS for what it does, who it serves, and one-click sample demo.
- Claims: PASS, 22/22 exact commands; 22/22 unique source tags.
- Live identity: 34/34 deployable files byte-match the candidate.
- APK: 4,596,635 bytes; SHA-256
  `af06a7f89d0afee99aa4fafe81d074ccd40a62c5d0d981dc46fda529d9b6c6e8`.
- APK signer matches v1.0.3; v1.0.5 advances version code 4 to 6.
- Privacy: ordinary live flow is same-origin with no console/page errors.
- Billing allowance: 30 responses allowed; request 31 returns 429 with
  `Retry-After: 4`.
- Axe: zero violations on landing, demo, Privacy, Terms, 404, and Settings at
  desktop and 390 px.
- Offline: controlled demo reload passes; `cal-v9` update test passes.
- Lighthouse mobile: 95 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.494 s, CLS 0, transfer 70,727 bytes.
- Bundles: JS 42.66 kB raw / 15.02 kB gzip; CSS 14.99 kB raw / 4.06 kB gzip.

`npm run test:android:full` reached native sync and then stopped because this
`deploy:none` worker has no JDK or Android SDK, as anticipated by the work
order. The published APK/source/DEX/instrumentation checks all pass. No product
code was modified during verification.
