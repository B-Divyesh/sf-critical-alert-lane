# Review 1 handoff — FAIL

Date: 2026-08-29

Work order: `critical-alert-lane-review-1`

Reviewed commit: `84ebfc6c59e2754d65f90964d4bb54822debcb1a`

Live URL: <https://critical-alert-lane.sociobot.in>

## What was done

Completed a fresh adversarial mobile/desktop review and wrote
`.factory/review-1.md`. Product code was not changed.

The review records 31 findings. Two are blocking:

1. `/demo` does not show the realistic sample reminder or a handling control in
   its first 390×844 viewport.
2. `/#how-it-works` direct loads and browser Back return to the top because the
   hash target is rendered after navigation.

The remaining findings cover unlisted claims, copy that violates the attached
plain-words rules, missing 404 metadata, mobile fact placement, and route focus.

## How it was verified

- Opened the live site cold in fresh 390×844 and 1440×900 Chromium contexts.
- Exercised demo entry, acknowledge, Reset, Start for real, namespace
  separation, live offline reload, and same-origin request logging.
- Ran every exact `.factory/claims.json` command from detached clean worktree
  `/tmp/cal-review-79n6xU` after `npm ci`: all 22 passed.
- Ran `npm test`: 21/21 passed.
- Ran `npm run build`: passed and produced `dist/`.
- Ran `npm run test:e2e`: 60/60 passed.
- Ran `/opt/fleet/lib/verify-url.sh` on landing, demo, privacy, and terms: all
  passed with no console errors.
- Ran live Axe checks on public routes and 404: zero serious/critical findings.
- Crawled public links/assets and checked metadata, titles, headings, routes,
  Back behavior, focus, and the designed 404.
- Confirmed the earlier malformed-import handoff issue is fixed live and in
  code; saved data remained and a later valid import succeeded.

## Known gaps and next steps

The product is buildable and every declared claim test passes, but it does not
meet the review contract until every finding in `.factory/review-1.md` is
closed. Repair the two blockers first, then register or remove every unlisted
claim, replace every flagged copy item with the supplied rewrite, complete 404
metadata, and rerun the full review from scratch.
