# Repair handoff — Critical Alert Lane

Date: 2026-08-28

Work order: `critical-alert-lane-repair-4`

Verifier report: `.factory/verification-4.md`

Rejected candidate: `c1f26b2229287f2d2254323271a3c549a453a027`

Repair commits: `bfe2ef11e82466db6dac2765a601af813433d6c1` through
`6d410a66fcecd5c28f12fc4835bb4700afe3439c`

Production: <https://critical-alert-lane.sociobot.in>

Deployment: `039d0493-49bd-4413-b551-7962abb9aebb` (succeeded)

## Repairs delivered

- Version-1 imports now validate reminder identity as a collection. Duplicate
  IDs and distinct Java `String.hashCode()` collisions are deterministically
  remapped by file order before any state replacement. For example,
  `duplicate` / `duplicate` become `duplicate` / `duplicate~import-2`, and
  `Aa` / `BB` become `Aa` / `BB~import-2`. Existing unsafe IndexedDB state is
  migrated through the same normalizer instead of being discarded.
- The Android scheduler no longer treats `String.hashCode()` as identity. It
  persists a one-to-one reminder-ID-to-positive-integer map, resolves integer
  collisions by deterministic probing, and adds the full encoded reminder ID
  to each `PendingIntent` data URI. Alarm, notification, and open-app intents
  use the persisted mapping. Migration also cancels legacy hash-only alarms
  and notifications. The native bridge rejects duplicate IDs before replacing
  native state.
- An unlicensed import keeps every reminder but arms only the first three
  enabled entries. Additional enabled entries are marked and rendered as
  `PAUSED · free limit`. The confirmation names the exact effect before data
  replacement, and the completion status reports both identity repairs and
  pauses. A paused reminder cannot be re-armed while three others are active.
- Kotlin jdk7/jdk8 exclusions now apply to every Gradle subproject. The root
  `assembleDebugAndroidTest` aggregation therefore builds app, Capacitor, and
  generated Cordova test APKs without duplicate Kotlin classes. The checked-in
  app instrumentation remains compiled. `npm run test:android` now includes
  the root aggregation, and `npm run test:android:instrumentation` exposes it
  directly from a fresh checkout.
- Added `.factory/claims.json` with seven isolated claim commands. Web, native,
  import-limit, identity, privacy, APK-integrity, offline, and purchase claims
  now have focused regressions.
- Released Android v1.0.3/code 4 and advanced the PWA cache/install version to
  deliver the repair to existing installs. The cassette-zine design, PWA, and
  native APK product classes are unchanged.

## Exact clean-clone evidence

All final checks below ran from a fresh clone of `origin/main` at
`6d410a66fcecd5c28f12fc4835bb4700afe3439c` in
`/tmp/critical-alert-lane-clean-r4-final3`. The checkout remained source-clean
after Capacitor sync.

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 148 packages, 0 vulnerabilities |
| every command in `.factory/claims.json` | PASS; six browser claims passed in both mobile and desktop, native claim passed on Robolectric API 30 |
| `npm test` | PASS; 13/13 Vitest tests |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS; `dist/` produced |
| `npm run test:e2e` | PASS; 32/32 Chromium mobile/desktop tests |
| `npm run test:android` | PASS; `BUILD SUCCESSFUL`, 261 actionable tasks |
| Android host tests | PASS; 13/13 in debug and 13/13 in release, including duplicate rejection, `Aa`/`BB` two-alarm scheduling, persisted identities, API 23/30 paths, and native repeat re-arm |
| Android lint | PASS; 0 errors, 23 warnings |
| `./android/gradlew -p android assembleDebugAndroidTest --no-daemon` | PASS; root aggregation, 123 tasks; includes `:app:assembleDebugAndroidTest` and both Capacitor module aggregations |
| local `verify-url.sh` | PASS in 554 ms; title/lang/one h1/main/alt/button checks and 0 errors |
| local standalone axe 4.10.3 | PASS; 0 violations |

Clean Android artifacts:

- debug APK: 4,989,374 bytes; SHA-256
  `20ce22db95f643e9359386fb716925d0c885d09de61df6c579605b511414b25d`
- app instrumentation APK: 566,852 bytes; SHA-256
  `18095f8e4b35b1906d80dfd45c1229c9ae4251657b88df27a70574f91c041593`
- root aggregation also built the Capacitor and Cordova instrumentation APKs;
  the formerly failing Cordova duplicate-class check passed.

## Signed Android release

The clean clone ran `:app:assembleRelease`, zip alignment, and signing with the
factory Key Vault private key. Its output reproduced the committed download
byte-for-byte:

- path: `/downloads/critical-alert-lane-1.0.3.apk`
- size: 3,676,178 bytes
- SHA-256: `06382ba158e7cd4a28222e14a81174150b574daabe17af9be62cac91213e3c16`
- package: `in.sociobot.criticalalertlane`; version 1.0.3/code 4; min SDK 23;
  target/compile SDK 35
- signatures: v1, v2, and v3 verified
- signer certificate SHA-256:
  `f6a9ca54d7385c9d005b81de047d4937f6c447602e9fa8194cf0f870fc53265c`
  (unchanged from v1.0.2)
- archive: 0 nested APKs; all 22 packaged web assets match the clean native
  build byte-for-byte
- artifact mirror: `factory-artifacts/critical-alert-lane/critical-alert-lane-1.0.3.apk`,
  3,676,178 bytes, `application/vnd.android.package-archive`

## Deployment and live verification

The static deployment used the clean clone's `dist/`. All 25 deployable files
matched production byte-for-byte after deployment, including the signed APK,
HTML, hashed JS/CSS, maps, legal pages, service worker, manifest, icons, and
art. The live APK returns the exact SHA-256 above with Android package MIME and
one-year immutable caching.

Fresh live mobile import evidence:

- the confirmation said `2 unsafe reminder ID(s) will be repaired` and
  `1 additional reminder(s) will be imported paused, not deleted`;
- the resulting IDs were `duplicate`, `duplicate~import-2`, `Aa`, and
  `BB~import-4`;
- the queue reported `3 / 3 free active`; the fourth row reported
  `PAUSED` and `Paused · free limit`;
- editing `Second duplicate` produced `Edited second only` while
  `First duplicate` remained unchanged;
- the populated live page had 0 serious/critical axe findings, 0 console/page
  errors, no external request origins, and reloaded offline with the offline
  state visible.

Additional live results:

- factory `verify-url.sh`: HTTP 200 in 1,851 ms; correct title, `lang=en`, one
  h1, main landmark, no missing image alternatives, no unnamed buttons, and 0
  load errors;
- standalone axe 4.10.3: 0 violations;
- Lighthouse 13.4.1 mobile: 100 Performance / 100 Accessibility / 100 Best
  Practices / 100 SEO; FCP 1.11 s, LCP 1.26 s, TBT 0 ms, CLS 0;
- Lighthouse desktop: 100/100/100/100; FCP 0.30 s, LCP 0.34 s, TBT 0 ms,
  CLS 0;
- bundle: 37,158-byte JS (13,233 bytes gzip), 12,471-byte CSS (3,601 bytes
  gzip), no fonts, and 44,626-byte mobile AVIF hero;
- HTTP redirects to HTTPS; CSP, HSTS, Permissions-Policy, anti-framing,
  `nosniff`, COOP/CORP, and strict-origin referrer policy are present;
- `sw.js` is no-store; the manifest MIME is `application/manifest+json`;
- production checkout returns HTTP 303 to hosted Dodo checkout; invalid
  license verification returns HTTP 200, `Cache-Control: no-store`, and
  `{ "valid": false, "reason": "invalid" }`.

## Known environment limit

This worker has no `/dev/kvm` and no attached Android device. The checked-in
instrumentation source and all three instrumentation APK aggregations compile,
but device-only terminated-delivery, permission-change, reboot, and time-zone
execution still require physical API 23 and current-API devices before store
distribution. This is unchanged from prior handoffs; host API 23/30 tests and
the exact root aggregation both pass.

## Reproduce

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
ANDROID_HOME=/path/to/android-sdk JAVA_HOME=/path/to/jdk-21 npm run test:android
ANDROID_HOME=/path/to/android-sdk JAVA_HOME=/path/to/jdk-21 npm run test:android:instrumentation
```

Deploy only `dist/` with:

```sh
/opt/fleet/lib/deploy-static.sh critical-alert-lane dist
```
