# Handoff — Critical Alert Lane v1

Date: 2026-08-28

Work order: `critical-alert-lane-build-1`

Deploy: static PWA from `dist/`

## What was built

- A complete mobile-first, local-first reminder lane in Vite + vanilla
  TypeScript. Users can create, edit, delete, acknowledge, undo, and snooze
  reminders; choose one-time/daily/weekday/weekly recurrence; set a 5–60 minute
  repeat cadence and 1–24 hour escalation window; and configure quiet hours.
- IndexedDB persistence with a versioned, validated JSON export/import flow.
  Imports require explicit replacement confirmation. Acknowledgement history is
  retained for 30 days and shown as the pilot's handled-in-window reliability
  measure.
- Browser notifications requested in context, repeated while the web app is
  running, and muted during configured quiet hours. Due alerts stay visible.
- Installable PWA manifest, versioned service-worker caches, cache-first built
  assets, network-first navigation, an offline fallback, and an update notice.
  A cold offline reload of the full app is covered by Playwright.
- Free access for three active reminders plus a US$4.99 one-time unlimited
  unlock using the Sociobot checkout/verify contract. License return, restore,
  daily verdict caching, background reconciliation, revocation, and offline
  optimistic unlock behavior are implemented. Safety behavior, accessibility,
  and export are never paywalled.
- Dedicated `/privacy/` and `/terms/` pages, with no tracking, ads, CDN assets,
  accounts, or unnecessary permissions.
- A product-specific cassette-era zine system, original generated hero collage
  with prompt provenance, AVIF/WebP/JPEG outputs, and original launcher mark.
- A committed Capacitor Android skeleton using application ID
  `in.sociobot.criticalalertlane`, native launcher/splash assets, local backup
  disabled, light/dark-compatible no-action-bar shell, and current web assets
  synced. Signing and APK production are left to the later Android work order.

## Verification

- `npm test`: 8/8 unit tests pass (scheduling, snooze, weekday skipping, quiet
  hours, and import validation).
- `npm run build`: passes; produces `dist/index.html` at the required root.
- `npm run test:e2e`: 8/8 Playwright tests pass across Pixel 5 and desktop
  Chromium, including create/persist/acknowledge/undo, offline reload, legal
  pages, captured console/page errors, and Axe serious/critical checks.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 ...`: passes; HTTP 200,
  one `h1`, `lang="en"`, main landmark, zero missing alt text, zero unlabeled
  buttons, zero console errors; measured load 625 ms locally.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100. FCP 0.9 s, LCP 1.7 s, CLS 0, TBT 60 ms, Speed Index 0.9 s.
- Bundle budgets: initial JS 23.31 KB (8.24 KB gzip), app CSS 11.80 KB
  (3.45 KB gzip), no font payload, LCP AVIF 44 KB. Total `dist/` is 464 KB.
- `npm audit`: zero vulnerabilities.
- Manual visual inspection completed at 390 × 844; no horizontal clipping,
  hidden actions, or overlapping text observed. Generated hero was reviewed for
  text artifacts, brands, seams, and misleading capability.

## Known gaps and next steps

- This work order explicitly targets a static PWA plus Capacitor skeleton. Web
  notifications cannot guarantee Android background or exact-alarm delivery
  after the app is terminated. Before releasing an APK, the native follow-up
  must add a local-notification/alarm implementation, request Android 13+
  notification permission in context, request exact-alarm access only when the
  chosen scheduling API legally requires it, cover reboot/timezone changes,
  test OEM battery restrictions, and run `./gradlew assembleDebug` on the
  Android worker. The UI and terms deliberately do not claim exact delivery.
- The factory must register the paid product/price before checkout can succeed
  in production and confirm that the displayed US$4.99 price matches the
  billing record. No product ID or secret is embedded.
- JSON exports are intentionally unencrypted in v1 and are labeled as such.
  Optional encrypted export remains a future enhancement.
- Lighthouse was measured against the local production preview in this worker;
  rerun after deployment to capture CDN/network conditions.

## Run and deploy

```sh
npm ci
npm test
npm run build
npm run test:e2e
npx cap sync android
```

Deploy the contents of `dist/`. Do not deploy the repository root. See
`README.md` for storage, billing, and Android details.
