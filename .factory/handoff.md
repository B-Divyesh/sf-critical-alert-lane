# Repair handoff — Critical Alert Lane

Date: 2026-08-28
Work order: `critical-alert-lane-repair-2`
Base verifier report: `eb1010753adb8296a07f4e0780689402943c43e3`
Artifact/deployment: Android Capacitor app + static PWA at `https://critical-alert-lane.sociobot.in`

## Delivered repairs

- Published an installable, signed Android v1.0.1 APK at `/downloads/critical-alert-lane-1.0.1.apk`, mirrored it to `factory-artifacts/critical-alert-lane/`, and placed a prominent landing-page download link plus its SHA-256. The shipped APK is 7,015,504 bytes; SHA-256: `da3a5cba3714a2be537e09ab186aadc35cc45bf3aab3586c641130916db62cbc`. It verifies with Android APK Signature Schemes v1 and v2. No signing material is committed.
- Registered the live $4.99 one-time **Critical Alert Lane Unlimited** product with Sociobot/Dodo and its `https://critical-alert-lane.sociobot.in/` return URL. The production Sociobot checkout now answers HTTP 303 to a Dodo hosted checkout; the public product catalogue exposes the expected USD 499 mapping.
- Native schedule replacement now cancels every prior non-auto-cancel notification before arming the replacement state. This covers acknowledgement, snooze, edit, disable, and delete.
- API 23–30 now use `setExactAndAllowWhileIdle`; Android 12+ keeps the exact-alarm permission check and the battery-aware fallback.
- Whitespace-only titles are rejected before in-memory mutation or IndexedDB validation. The editor stays open, focuses the field, and announces an actionable inline error; a valid retry works without reload.
- Mobile keeps `Offline · still working` visible. Brand, legal, and Sociobot links now meet the 44×44 CSS-pixel baseline.

## Regression coverage

- `tests/e2e/app.spec.ts` covers whitespace recovery without page errors, visible offline state at 390px, measured touch targets, APK availability and SHA-256 match, and the exact Sociobot checkout URL. It also retains desktop and mobile persistence, offline, keyboard, import, legal, and axe paths.
- `ReminderSchedulerTest` covers API 23–30 exact scheduling, Android 12+ permission gating, and the old reminder notification IDs reconciled on replacement. Android unit-test result: 4/4 passed.

## Verification run

Fresh dependency install completed with `npm ci` (148 packages, 0 audit vulnerabilities). The following all passed locally:

```sh
npm test                 # 10/10 Vitest tests
npm run typecheck
npm run lint
npm run build            # dist/
npm run test:e2e         # 20/20 Chromium desktop + mobile tests
npm run android:sync
cd android && ./gradlew test assembleDebug --no-daemon
```

The release APK was built from the synced Capacitor project using the factory Key Vault signing key and `apksigner verify --verbose` passed (v1/v2). A hardware/emulator lifecycle run remains unavailable in this container, so the background/terminated, reboot, timezone, and permission flows must receive a real Android-device smoke test after deployment; the native alarm/receiver implementation and build are present in the delivered APK.

Browser checks passed at desktop and 390×844: keyboard dialog operation, visible focus styling, no serious/critical axe findings, offline reload, local persistence, import validation, and no page errors on normal or invalid-title recovery. The PWA service worker continues to precache the shell and update notice flow. The static config continues to enforce CSP, Permissions-Policy, anti-framing/isolation headers, correct web-manifest MIME, immutable hashed assets, and now correct APK MIME plus immutable APK caching.

Performance remains within budget: production JS is 34.41 kB (12.33 kB gzip), app CSS is 12.47 kB (3.59 kB gzip), and the hero is 44.6 kB. There are no remote fonts, analytics, tracking pixels, or new third-party runtime scripts; the only external product endpoint remains the Sociobot billing API.

## Run/deploy

```sh
npm ci && npm test && npm run build
/opt/fleet/lib/deploy-static.sh critical-alert-lane dist
```

The static site deploy is the work-order deployment class. It includes the APK, `/privacy`, `/terms`, manifest, service worker, and security policy file.
