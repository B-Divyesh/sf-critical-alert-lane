# Critical Alert Lane

Critical Alert Lane is a tiny, local-first reminder lane for Android and the
web. It is for people who have muted the notification flood but still need a
few reminders—medicine, a deadline, a call—to keep repeating until they
explicitly acknowledge or snooze them.

Live app: <https://critical-alert-lane.sociobot.in>

Try it safely first: <https://critical-alert-lane.sociobot.in/demo>. The demo
opens with realistic sample reminders in a separate browser database. **Reset
demo** restores the samples; **Start for real** discards them and opens your
empty real lane. Any other link that leaves the demo also discards its changes.

Android download: [Critical Alert Lane 1.0.4 APK](./public/downloads/critical-alert-lane-1.0.4.apk)
(`SHA-256 2af8e0b60ce77aa729b82e465626d9b37778e38f22b4665c80e6301bcd6327bf`).
Install this signed APK to use Android's on-device alarms when the app is
backgrounded or closed; the web/PWA lane remains available for its local-first
browser workflow.

## What v1 includes

- One-time, daily, weekday, and weekly reminders
- Configurable 5–60 minute repeat cadence until acknowledgement
- Explicit acknowledge and snooze actions, with Undo after acknowledgement
- Overnight quiet hours that mute notifications without hiding due alerts
- A rolling 30-day “handled in time” reliability score
- IndexedDB persistence, installable PWA, and tested offline reloads
- Local JSON export/import with validation and replacement confirmation.
  Unsafe duplicate or Android-hash-colliding IDs are repaired deterministically.
  Free imports keep every reminder and pause active entries beyond the first three.
- Free use for up to three active reminders; US$4.99 one-time license unlock
  for unlimited active reminders through the Sociobot hosted checkout
- Native Android alarms and local notifications that continue repeating after
  the app is backgrounded or closed, then recover after boot, clock, and time
  zone changes

The app requests no account, calendar, contacts, location, camera, or
microphone access. Notification permission is requested only from the Settings
button. On Android, the app also presents exact-alarm access from Settings when
the OS requires it; without that access, Android's battery-aware inexact alarm
fallback is used.

## Develop and verify

Requires Node.js 20+.

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
npm run test:update
npm run test:android
npm run test:android:artifact
npm run test:android:lifecycle-claim
npm run test:android:instrumentation
```

`npm run build` is the factory build command. It writes the deployable static
site to `dist/`, with `dist/index.html` at its root. Playwright is pinned to
1.58.2 as required by the worker image. Browser claim commands are
self-contained after `npm ci`: their Playwright server builds before previewing.
The update check builds, starts, awaits, and stops its own ephemeral preview
server. The ordinary Android commands are SDK-less release-identity checks:
they sync a freshly built native web bundle, verify it byte-for-byte against
the checked-in published APK, check the APK digest/native symbols, and verify
the recorded native-source fingerprints. This makes every declared native
claim runnable from a standard clean verifier without a local JDK or Android
SDK. Full Android builds stay in GitHub Actions, where the workflow installs
JDK 21 and Android API 35 deterministically.

To refresh the Android shell after a web change:

```sh
npm run android:sync
```

`npm run test:android:instrumentation` checks that the released APK is paired
with the checked-in instrumentation source. GitHub Actions runs the actual
Gradle unit, lint, debug/release assembly, and Android-test APK assembly via
`npm run test:android:full`. Run the APK on physical API 23 and current-API
devices before store distribution.

The committed project uses application ID `in.sociobot.criticalalertlane`.
The downloadable v1.0.4 release APK is signed for release. `npm run test:android:artifact`
checks its digest, source release record, compiled native symbols, and every
embedded web asset against the just-synced native bundle, including the
`/demo/` entry point and current service-worker shell. The factory signing key
is kept outside this repository;
the keystore and all signing credentials remain outside this repository. To
produce a release APK, provide `ANDROID_RELEASE_STORE_FILE`,
`ANDROID_RELEASE_STORE_PASSWORD`, `ANDROID_RELEASE_KEY_ALIAS`, and
`ANDROID_RELEASE_KEY_PASSWORD`, then run `cd android && ./gradlew assembleRelease`.

## Storage and billing

Reminder data is stored in the browser's IndexedDB database
`critical-alert-lane`. License tokens use
`localStorage["sb_license:critical-alert-lane"]`. The only external runtime
request is a purchase/license check against the Sociobot billing API after a
user buys or restores a license. The free experience never waits on that call.

The sample demo is separate: its data uses IndexedDB database
`demo:critical-alert-lane`. It never reads or writes real reminder data,
license tokens, or the Android scheduler. See [the demo guide](./.factory/demo.md).

The export format is versioned JSON. Exports are unencrypted, so users should
store them somewhere they trust. See [Privacy](./privacy/index.html) and
[Terms](./terms/index.html).

## Project notes

- Product scope: [`.factory/brief.json`](./.factory/brief.json)
- Visual system and asset provenance: [`.factory/design.md`](./.factory/design.md)
- Demo sandbox: [`.factory/demo.md`](./.factory/demo.md)
- Build verification and known gaps: [`.factory/handoff.md`](./.factory/handoff.md)

Licensed under the [MIT License](./LICENSE).
