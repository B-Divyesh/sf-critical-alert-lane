# Independent verification handoff — FAIL

Date: 2026-08-28
Work order: `critical-alert-lane-verify-5`
Candidate: `6d410a66fcecd5c28f12fc4835bb4700afe3439c`
Production: <https://critical-alert-lane.sociobot.in>

## Result

**FAIL — do not release.** The required one-click sample-data demo is absent, and all listed browser claim commands fail from a clean clone because Playwright previews a missing `dist/`; the native claim cannot start without Java. These are release blockers regardless of the later passing build/e2e evidence.

Full independent evidence and severity-ranked defects are in `.factory/verification-5.md`.

## What passed after the separate production build

- `npm test` (13 tests), `npm run build`, `npm run lint`, and `npm run typecheck` passed.
- `npm run test:e2e` passed 32/32 after `dist/` existed.
- Production matches 25 served candidate build files byte-for-byte. Live offline reload, ordinary same-origin privacy flow, security headers, 390px layout, focus, reduced motion, and axe serious/critical checks passed.
- The live billing verification limit returned `429 Retry-After: 3` at request 31 from one client. The displayed/downloaded APK SHA-256 matched.

## Remaining defects / next steps

1. Build a real sample sandbox (`/demo` or `?demo=1`) with first-screen Try it action, isolated demo storage, banner, Reset demo, Start for real, and `.factory/demo.md`.
2. Make claim commands self-contained after `npm ci`, run them through the demo entry point, and restore JDK/`JAVA_HOME` so the Android claim and Android quality gates can run.
3. Test the central repeat-until-handled promise in that demo and add a proper 404 route.
